import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { enrollmentService, normalizeApiError } from '../../../api';
import type { EnrollmentRecord, EnrollmentSubject } from '../../../api/services/enrollment.service';
import { generateIdempotencyKey } from '../../../api/idempotency';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  ErrorState,
  Icon,
  LoadingState,
  Stack,
} from '../../../components';
import { TypeaheadSearch } from '../../../components/forms/TypeaheadSearch';
import { IMAGE_ONLY_POLICY, pickFromSource } from '../../attachments';
import { useTranslation } from '../../../i18n';
import type { GroupsStackParamList } from '../../../navigation/types';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { useAuthStore } from '../../auth/store';

type Props = NativeStackScreenProps<GroupsStackParamList, 'Enrollment'>;
type Picked = { uri: string; name: string; type: string };

const MAX_SUBJECTS = 12;

function StatusBlock({
  record,
  onCancel,
  busy,
}: {
  record: EnrollmentRecord;
  onCancel?: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const copy = t.enrollment;

  return (
    <AppCard variant="elevated">
      <Stack gap="md">
        <AppText variant="title">{copy.status[record.status]}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {copy.statusHint[record.status]}
        </AppText>
        {record.items.map((item) => (
          <View key={item.id} style={styles.subjectRow}>
            <Icon
              color={
                item.status === 'approved'
                  ? colors.semantic.success
                  : item.status === 'rejected'
                    ? colors.semantic.error
                    : colors.text.muted
              }
              name={
                item.status === 'approved'
                  ? 'checkCircle'
                  : item.status === 'rejected'
                    ? 'xCircle'
                    : 'clock'
              }
              size={20}
            />
            <View style={styles.flex}>
              <AppText variant="label">{item.subject.name}</AppText>
              {item.reason ? (
                <AppText color="error" variant="caption">
                  {item.reason}
                </AppText>
              ) : null}
            </View>
          </View>
        ))}
        {record.status === 'pending' && onCancel ? (
          <AppButton
            loading={busy}
            onPress={onCancel}
            title={copy.cancelRequest}
            variant="dangerOutline"
          />
        ) : null}
      </Stack>
    </AppCard>
  );
}

export function EnrollmentScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const copy = t.enrollment;
  const accessToken = useAuthStore((state) => state.accessToken);
  const [records, setRecords] = useState<EnrollmentRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shot, setShot] = useState<Picked | null>(null);
  const [subjects, setSubjects] = useState<EnrollmentSubject[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoadError(false);
    try {
      setRecords(await enrollmentService.listMyEnrollments(accessToken));
    } catch {
      setLoadError(true);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const latest = records?.[0] ?? null;
  const wizard = starting || !latest || latest.status === 'cancelled';
  const chosenKeys = useMemo(() => new Set(subjects.map((item) => String(item.id))), [subjects]);

  const pick = async (source: 'album' | 'camera') => {
    setCameraDenied(false);

    const result = await pickFromSource(source, IMAGE_ONLY_POLICY, { quality: 0.9 });

    if (result.status === 'picked' && result.files[0]) {
      const file = result.files[0];

      setShot({
        uri: file.uri,
        name: file.name,
        type: file.mimeType ?? 'image/jpeg',
      });
      setError(null);
    } else if (result.status === 'permission_denied') {
      setCameraDenied(true);
    } else if (result.status === 'invalid' || result.status === 'error') {
      setError(copy.pickError);
    }
  };

  const pickFromGallery = () => pick('album');
  const takePhoto = () => pick('camera');

  const search = useCallback(
    async (query: string) => {
      if (!accessToken) return [];
      return enrollmentService.searchEnrollmentSubjects(query, accessToken);
    },
    [accessToken],
  );

  const submit = async () => {
    if (!accessToken || !shot || subjects.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const handle = enrollmentService.submitEnrollment(
        { screenshot: shot, subjectIds: subjects.map((item) => item.id) },
        accessToken,
        { idempotencyKey, onProgress: setProgress },
      );

      await handle.promise;
      setStarting(false);
      setStep(1);
      setShot(null);
      setSubjects([]);
      setIdempotencyKey(generateIdempotencyKey());
      await load();
    } catch (failure) {
      const code = normalizeApiError(failure).code;

      setError(code === 'CONFLICT' ? copy.alreadyPending : copy.submitError);
      // A definitive refusal may be cached against the key: the next attempt needs a new one.
      setIdempotencyKey(generateIdempotencyKey());
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  const cancel = async () => {
    if (!accessToken || !latest) return;
    setBusy(true);
    try {
      await enrollmentService.cancelEnrollment(latest.id, accessToken);
      await load();
    } catch {
      setError(copy.cancelError);
    } finally {
      setBusy(false);
    }
  };

  let body;

  if (records === null && !loadError) {
    body = <LoadingState message={copy.loading} />;
  } else if (loadError) {
    body = <ErrorState message={copy.loadError} onRetry={() => void load()} />;
  } else if (!wizard && latest) {
    body = (
      <Stack gap="lg">
        <StatusBlock busy={busy} onCancel={() => void cancel()} record={latest} />
        {error ? (
          <AppText color="error" variant="caption">
            {error}
          </AppText>
        ) : null}
        {latest.status !== 'pending' ? (
          <AppButton onPress={() => setStarting(true)} title={copy.newRequest} />
        ) : null}
      </Stack>
    );
  } else {
    body = (
      <Stack gap="lg">
        <View style={styles.steps}>
          {[1, 2, 3].map((value) => (
            <View
              key={value}
              style={[
                styles.stepBar,
                { backgroundColor: value <= step ? brand.primary : colors.border.default },
              ]}
            />
          ))}
        </View>
        <AppText color="muted" variant="caption">
          {copy.stepOf(step, 3)}
        </AppText>

        {step === 1 ? (
          <Stack gap="md">
            <AppText variant="title">{copy.step1.title}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {copy.step1.body}
            </AppText>
            {copy.step1.tips.map((tip) => (
              <View key={tip} style={styles.subjectRow}>
                <Icon color={colors.semantic.success} name="checkCircle" size={18} />
                <AppText color="secondary" style={styles.flex} variant="bodySmall">
                  {tip}
                </AppText>
              </View>
            ))}
            {shot ? (
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={{ uri: shot.uri }}
                style={styles.preview}
              />
            ) : null}
            <AppButton
              onPress={() => void pickFromGallery()}
              title={shot ? copy.change : copy.fromGallery}
            />
            <AppButton onPress={() => void takePhoto()} title={copy.fromCamera} variant="outline" />
            {cameraDenied ? (
              <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}>
                <AppText color="error" variant="caption">
                  {copy.cameraDenied}
                </AppText>
              </Pressable>
            ) : null}
            <AppButton disabled={!shot} onPress={() => setStep(2)} title={copy.next} />
          </Stack>
        ) : null}

        {step === 2 ? (
          <Stack gap="md">
            <AppText variant="title">{copy.step2.title}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {copy.step2.body}
            </AppText>
            <TypeaheadSearch<EnrollmentSubject>
              accessibilityLabel={copy.step2.searchLabel}
              disabled={subjects.length >= MAX_SUBJECTS}
              excludeKeys={chosenKeys}
              keyExtractor={(item) => String(item.id)}
              onSelect={(item) => setSubjects((current) => [...current, item])}
              placeholder={copy.step2.placeholder}
              renderItem={(item) => (
                <View>
                  <AppText variant="label">{item.name}</AppText>
                  <AppText color="muted" variant="caption">
                    {[item.code, item.academic_year_name, item.semester_name]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                </View>
              )}
              search={search}
            />
            <AppText color="muted" variant="caption">
              {copy.step2.count(subjects.length)}
            </AppText>
            <View style={styles.chips}>
              {subjects.map((item) => (
                <Pressable
                  accessibilityLabel={`${copy.remove} ${item.name}`}
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => setSubjects((current) => current.filter((c) => c.id !== item.id))}
                  style={[
                    styles.chip,
                    { borderColor: brand.primary, backgroundColor: brand.primarySoft },
                  ]}
                >
                  <AppText color="brand" variant="label">
                    {item.name}
                  </AppText>
                  <Icon color={brand.primary} name="close" size={16} />
                </Pressable>
              ))}
            </View>
            <AppButton
              disabled={subjects.length === 0}
              onPress={() => setStep(3)}
              title={copy.next}
            />
            <AppButton onPress={() => setStep(1)} title={copy.back} variant="outline" />
          </Stack>
        ) : null}

        {step === 3 && shot ? (
          <Stack gap="md">
            <AppText variant="title">{copy.step3.title}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {copy.step3.body}
            </AppText>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={{ uri: shot.uri }}
              style={styles.previewSmall}
            />
            {subjects.map((item) => (
              <View key={item.id} style={styles.subjectRow}>
                <Icon color={brand.primary} name="book" size={18} />
                <AppText style={styles.flex} variant="label">
                  {item.name}
                </AppText>
              </View>
            ))}
            {error ? (
              <AppText accessibilityLiveRegion="polite" color="error" variant="caption">
                {error}
              </AppText>
            ) : null}
            <AppButton
              loading={busy}
              onPress={() => void submit()}
              title={busy && progress > 0 ? copy.sending(Math.round(progress * 100)) : copy.submit}
            />
            <AppButton
              disabled={busy}
              onPress={() => setStep(2)}
              title={copy.back}
              variant="outline"
            />
          </Stack>
        ) : null}
      </Stack>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        onBack={() => navigation.goBack()}
        showBack
        subtitle={copy.subtitle}
        title={copy.title}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {body}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg, paddingBottom: spacing.xxl },
  flex: { flex: 1 },
  steps: { flexDirection: 'row', gap: spacing.xs },
  stepBar: { flex: 1, height: 6, borderRadius: radius.full },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  preview: {
    width: '100%',
    height: 260,
    borderRadius: radius.lg,
    backgroundColor: colors.background.muted,
  },
  previewSmall: {
    width: '100%',
    height: 160,
    borderRadius: radius.lg,
    backgroundColor: colors.background.muted,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
