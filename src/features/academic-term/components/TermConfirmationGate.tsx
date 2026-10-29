import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton, AppText, FormAlert, Stack } from '../../../components';
import { showToast } from '../../../components/feedback/toastStore';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { useNetworkStore } from '../../../offline/networkStore';
import { colors, spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { AcademicSelectField } from '../../student-profile/components/AcademicSelectField';
import { useStudentProfileStore } from '../../student-profile/store';
import {
  applyTermAnswerToProfile,
  getDefaultNextLevel,
  shouldShowTermSheet,
} from '../termPresentation';
import { useTermStore } from '../termStore';

type Step = 'ask' | 'pick';

/**
 * Asks the student, once per session and only until answered, whether they moved to the next year. Full screen and not
 * dismissible, but it never gets in the way of offline use: while the device is offline it is not shown, and when a
 * save fails for lack of connection the sheet stays with a retry and a "not now" that hides it until the next launch.
 * Mount once inside the signed-in navigation.
 */
export function TermConfirmationGate() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isStudent = useAuthStore((state) => state.user?.role?.toLowerCase() === 'student');
  const status = useAuthStore((state) => state.status);
  const profile = useStudentProfileStore((state) => state.profile);
  const years = useStudentProfileStore((state) => state.academicYears);
  const semesters = useStudentProfileStore((state) => state.semesters);
  const hasBootstrapped = useStudentProfileStore((state) => state.hasBootstrapped);
  const bootstrap = useStudentProfileStore((state) => state.bootstrap);
  const loadOptions = useStudentProfileStore((state) => state.loadBaseAcademicOptions);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const currentTerm = useTermStore((state) => state.currentTerm);
  const loadCurrentTerm = useTermStore((state) => state.loadCurrentTerm);
  const answered = useTermStore((state) => state.answered);
  const postponed = useTermStore((state) => state.postponed);
  const isSubmitting = useTermStore((state) => state.isSubmitting);
  const submitError = useTermStore((state) => state.submitError);
  const submit = useTermStore((state) => state.submit);
  const postpone = useTermStore((state) => state.postpone);
  const clearError = useTermStore((state) => state.clearError);
  const [step, setStep] = useState<Step>('ask');
  const [yearId, setYearId] = useState<string | number | null>(null);
  const [semesterId, setSemesterId] = useState<string | number | null>(null);
  const wasShown = useRef(false);
  const authenticated = status === 'authenticated' && isStudent;
  const needs = profile?.needs_term_confirmation;
  const copy = t.academicTerm.sheet;

  const visible =
    authenticated &&
    shouldShowTermSheet({
      isStudent,
      needsConfirmation: needs,
      answered,
      postponed,
      isOnline,
      sheetOpenWhenOffline: wasShown.current,
    });

  wasShown.current = visible;

  useEffect(() => {
    if (authenticated && !hasBootstrapped) {
      void bootstrap();
    }
  }, [authenticated, bootstrap, hasBootstrapped]);

  useEffect(() => {
    if (visible) {
      void loadCurrentTerm();
    }
  }, [visible, loadCurrentTerm]);

  function startPicking() {
    const defaults = getDefaultNextLevel({
      years,
      semesters,
      currentYearId: profile?.academic_year?.id ?? profile?.academicYear?.id,
      termSemesterId: currentTerm?.semester.id,
    });

    setYearId(defaults.academicYearId);
    setSemesterId(defaults.semesterId);
    clearError();
    setStep('pick');

    if (years.length === 0 || semesters.length === 0) {
      void loadOptions();
    }
  }

  async function answer(promoted: boolean) {
    const ok = await submit({
      promoted,
      academicYearId: promoted ? yearId : null,
      semesterId: promoted ? semesterId : null,
    });

    if (!ok) {
      return;
    }

    useStudentProfileStore.setState((state) => ({
      profile: applyTermAnswerToProfile(state.profile, {
        promoted,
        year: promoted ? (years.find((item) => String(item.id) === String(yearId)) ?? null) : null,
        semester: promoted
          ? (semesters.find((item) => String(item.id) === String(semesterId)) ?? null)
          : null,
      }),
      ...(promoted ? { selectedAcademicYearId: yearId, selectedSemesterId: semesterId } : {}),
    }));
    setStep('ask');
    showToast(copy.saved);
  }

  const errorText =
    submitError === 'network' ? copy.networkError : submitError ? copy.genericError : null;

  return (
    <AppModal animationType="slide" onRequestClose={() => undefined} visible={visible}>
      <View
        style={[
          styles.screen,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom },
        ]}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Stack gap="lg">
            {step === 'ask' ? (
              <>
                <AppText variant="h2">{copy.title}</AppText>
                <AppText color="secondary" variant="body">
                  {copy.body(currentTerm?.term_label ?? '')}
                </AppText>
                {errorText ? <FormAlert message={errorText} /> : null}
                <AppButton disabled={isSubmitting} onPress={startPicking} title={copy.yes} />
                <AppButton
                  loading={isSubmitting}
                  onPress={() => void answer(false)}
                  title={submitError ? copy.retry : copy.no}
                  variant="outline"
                />
              </>
            ) : (
              <>
                <AppText variant="h2">{copy.pickTitle}</AppText>
                <AppText color="secondary" variant="body">
                  {copy.pickBody}
                </AppText>
                <AcademicSelectField
                  label={copy.year}
                  onSelect={setYearId}
                  options={years}
                  placeholder={copy.yearPlaceholder}
                  selectedId={yearId}
                />
                <AcademicSelectField
                  label={copy.semester}
                  onSelect={setSemesterId}
                  options={semesters}
                  placeholder={copy.semesterPlaceholder}
                  selectedId={semesterId}
                />
                {errorText ? <FormAlert message={errorText} /> : null}
                <AppButton
                  disabled={yearId == null || semesterId == null}
                  loading={isSubmitting}
                  onPress={() => void answer(true)}
                  title={isSubmitting ? copy.saving : submitError ? copy.retry : copy.confirm}
                />
                <AppButton
                  disabled={isSubmitting}
                  onPress={() => {
                    clearError();
                    setStep('ask');
                  }}
                  title={copy.back}
                  variant="outline"
                />
              </>
            )}
            {submitError === 'network' ? (
              <AppButton onPress={postpone} title={copy.later} variant="ghost" />
            ) : null}
          </Stack>
        </ScrollView>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
});
