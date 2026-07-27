import { useEffect, useRef, useState } from 'react';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
  Stack,
} from '../../../components';
import { GroupsRoutes, SharedRoutes, SubjectsRoutes, TabRoutes } from '../../../navigation/routes';
import type { AppTabsParamList, HomeStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { useFeedbackStore } from '../../feedback/store';
import { useStudentProfileStore } from '../../student-profile';
import { runGlobalSearch, toSafeSearchErrorMessage } from '../services';
import type { GlobalSearchResult, SearchResultItem } from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;

const EMPTY_RESULT: GlobalSearchResult = {
  subjects: [],
  groups: [],
  files: [],
  total: 0,
  partialFailure: false,
};

function SearchResultCard({ item, onPress }: { item: SearchResultItem; onPress: () => void }) {
  const label = item.kind === 'subject' ? 'مادة' : item.kind === 'group' ? 'مجموعة' : 'ملف';
  return (
    <AppCard variant="default">
      <Stack gap="sm">
        <AppText color="brand" variant="caption">
          {label}
        </AppText>
        <AppText variant="title">{item.title}</AppText>
        <AppText color="secondary" variant="bodySmall">
          {item.subtitle}
        </AppText>
        <AppButton onPress={onPress} size="sm" title="فتح" variant="outline" />
      </Stack>
    </AppCard>
  );
}

export function SearchScreen({ navigation, route }: Props) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.user?.role?.toLowerCase());
  const majorId = useStudentProfileStore((state) => state.selectedMajorId);
  const requestFeedbackPrompt = useFeedbackStore((state) => state.requestPrompt);
  const [query, setQuery] = useState(route.params?.query ?? '');
  const [result, setResult] = useState<GlobalSearchResult>(EMPTY_RESULT);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const isStudent = role === 'student';

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2 || !accessToken) {
      setResult(EMPTY_RESULT);
      setErrorMessage(null);
      return;
    }

    const sequence = ++requestSequence.current;
    const timer = setTimeout(() => {
      setIsLoading(true);
      setErrorMessage(null);
      void runGlobalSearch({ query: normalized, authToken: accessToken, isStudent, majorId })
        .then((nextResult) => {
          if (sequence !== requestSequence.current) return;
          setResult(nextResult);
          void requestFeedbackPrompt({
            context: 'search',
            actionKey: 'search.completed',
            metadata: { result_count: nextResult.total },
          });
        })
        .catch((error: unknown) => {
          if (sequence !== requestSequence.current) return;
          setErrorMessage(toSafeSearchErrorMessage(error));
          setResult(EMPTY_RESULT);
        })
        .finally(() => {
          if (sequence === requestSequence.current) setIsLoading(false);
        });
    }, 450);

    return () => clearTimeout(timer);
  }, [accessToken, isStudent, majorId, query, requestFeedbackPrompt]);

  function openResult(item: SearchResultItem) {
    if (item.kind === 'file') {
      navigation.navigate(SharedRoutes.FileDetails, { fileId: item.id });
      return;
    }
    const tabs = navigation.getParent<BottomTabNavigationProp<AppTabsParamList>>();
    if (item.kind === 'group') {
      tabs?.navigate(TabRoutes.Groups, {
        screen: GroupsRoutes.GroupDetails,
        params: { groupId: item.id },
      });
      return;
    }
    tabs?.navigate(TabRoutes.Subjects, {
      screen: SubjectsRoutes.SubjectDetails,
      params: { subjectId: item.id },
    });
  }

  const hasQuery = query.trim().length >= 2;
  const sections = [
    { title: 'المواد', items: result.subjects },
    { title: 'المجموعات', items: result.groups },
    { title: 'الملفات', items: result.files },
  ].filter((section) => section.items.length > 0);

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader subtitle="ابحث في المحتوى المسموح لحسابك" title="البحث" />
        <AppButton onPress={() => navigation.goBack()} title="رجوع" variant="ghost" />
        <AppTextInput
          autoCapitalize="none"
          autoCorrect={false}
          label="عبارة البحث"
          onChangeText={setQuery}
          placeholder="اسم مادة أو مجموعة أو ملف"
          returnKeyType="search"
          value={query}
        />

        {isLoading ? <LoadingState message="جاري البحث..." /> : null}
        {errorMessage ? <ErrorState message={errorMessage} /> : null}
        {result.partialFailure ? (
          <AppCard variant="muted">
            <AppText color="secondary" variant="bodySmall">
              ظهرت نتائج جزئية لأن أحد مصادر البحث لم يستجب. يمكنك المحاولة مجددًا.
            </AppText>
          </AppCard>
        ) : null}

        {!hasQuery ? (
          <EmptyState
            message="اكتب حرفين على الأقل. تظهر فقط النتائج التي يسمح بها Backend لحسابك."
            title="ابدأ البحث"
          />
        ) : !isLoading && !errorMessage && result.total === 0 ? (
          <EmptyState message="جرّب كلمات أقل أو اسمًا مختلفًا." title="لا توجد نتائج مطابقة" />
        ) : (
          sections.map((section) => (
            <Stack gap="md" key={section.title}>
              <SectionHeader subtitle={`${section.items.length} نتيجة`} title={section.title} />
              {section.items.map((item) => (
                <SearchResultCard
                  item={item}
                  key={`${item.kind}-${String(item.id)}`}
                  onPress={() => openResult(item)}
                />
              ))}
            </Stack>
          ))
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.xl } });
