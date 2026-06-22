import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

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
  Stack,
} from '../../../components';
import { isNormalUser } from '../../../navigation/guards/navigationGuards';
import { StudentSetupRoutes } from '../../../navigation/routes';
import { isStudentProfileComplete } from '../services';
import type { StudentSetupStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import {
  AcademicSelectField,
  NormalUserIntroCard,
  StudentNumberPreviewCard,
  StudentSetupStepper,
} from '../components';
import { useStudentProfileStore } from '../store';

type AcademicProfileSetupNavigation = NativeStackNavigationProp<
  StudentSetupStackParamList,
  'AcademicProfileSetup'
>;

function canSubmitProfile(input: {
  selectedUniversityId: string | number | null;
  selectedFacultyId: string | number | null;
  selectedMajorId: string | number | null;
  selectedAcademicYearId: string | number | null;
  selectedSemesterId: string | number | null;
  studentNumber: string;
}): boolean {
  return Boolean(
    input.selectedUniversityId &&
    input.selectedFacultyId &&
    input.selectedMajorId &&
    input.selectedAcademicYearId &&
    input.selectedSemesterId &&
    input.studentNumber.trim(),
  );
}

export function AcademicProfileSetupScreen() {
  const navigation = useNavigation<AcademicProfileSetupNavigation>();
  const user = useAuthStore((state) => state.user);
  const bootstrap = useStudentProfileStore((state) => state.bootstrap);
  const universities = useStudentProfileStore((state) => state.universities);
  const faculties = useStudentProfileStore((state) => state.faculties);
  const majors = useStudentProfileStore((state) => state.majors);
  const academicYears = useStudentProfileStore((state) => state.academicYears);
  const semesters = useStudentProfileStore((state) => state.semesters);
  const subjects = useStudentProfileStore((state) => state.subjects);
  const selectedUniversityId = useStudentProfileStore((state) => state.selectedUniversityId);
  const selectedFacultyId = useStudentProfileStore((state) => state.selectedFacultyId);
  const selectedMajorId = useStudentProfileStore((state) => state.selectedMajorId);
  const selectedAcademicYearId = useStudentProfileStore((state) => state.selectedAcademicYearId);
  const selectedSemesterId = useStudentProfileStore((state) => state.selectedSemesterId);
  const studentNumber = useStudentProfileStore((state) => state.studentNumber);
  const parsedStudentNumber = useStudentProfileStore((state) => state.parsedStudentNumber);
  const hasBootstrapped = useStudentProfileStore((state) => state.hasBootstrapped);
  const isBootstrapping = useStudentProfileStore((state) => state.isBootstrapping);
  const isLoadingOptions = useStudentProfileStore((state) => state.isLoadingOptions);
  const isLoadingFaculties = useStudentProfileStore((state) => state.isLoadingFaculties);
  const isLoadingMajors = useStudentProfileStore((state) => state.isLoadingMajors);
  const isLoadingSubjects = useStudentProfileStore((state) => state.isLoadingSubjects);
  const isParsingStudentNumber = useStudentProfileStore((state) => state.isParsingStudentNumber);
  const isSubmitting = useStudentProfileStore((state) => state.isSubmitting);
  const errorMessage = useStudentProfileStore((state) => state.errorMessage);
  const parseErrorMessage = useStudentProfileStore((state) => state.parseErrorMessage);
  const selectUniversity = useStudentProfileStore((state) => state.selectUniversity);
  const selectFaculty = useStudentProfileStore((state) => state.selectFaculty);
  const selectMajor = useStudentProfileStore((state) => state.selectMajor);
  const selectAcademicYear = useStudentProfileStore((state) => state.selectAcademicYear);
  const selectSemester = useStudentProfileStore((state) => state.selectSemester);
  const setStudentNumber = useStudentProfileStore((state) => state.setStudentNumber);
  const parseCurrentStudentNumber = useStudentProfileStore(
    (state) => state.parseCurrentStudentNumber,
  );
  const submitProfile = useStudentProfileStore((state) => state.submitProfile);
  const profile = useStudentProfileStore((state) => state.profile);
  const initialLoading = isBootstrapping && universities.length === 0 && !hasBootstrapped;
  const hasProfileLoadError = Boolean(errorMessage && universities.length === 0 && hasBootstrapped);
  const showEmptyUniversities = hasBootstrapped && !isLoadingOptions && universities.length === 0;
  const canSubmit = canSubmitProfile({
    selectedUniversityId,
    selectedFacultyId,
    selectedMajorId,
    selectedAcademicYearId,
    selectedSemesterId,
    studentNumber,
  });

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  // Guard: if profile became complete (e.g. external update), advance
  useEffect(() => {
    if (hasBootstrapped && isStudentProfileComplete(profile)) {
      navigation.replace(StudentSetupRoutes.SubmitVerification);
    }
  }, [hasBootstrapped, profile, navigation]);

  function handleRetry() {
    void bootstrap({ force: true });
  }

  async function handleSubmit() {
    try {
      await submitProfile();
      navigation.replace(StudentSetupRoutes.SubmitVerification);
    } catch {
      // The student profile store owns the user-facing error message.
    }
  }

  if (initialLoading) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="إعداد الطالب" title="إكمال الملف الأكاديمي" />
        <StudentSetupStepper currentStep={1} />
        <LoadingState message="جاري تحميل بيانات الملف الأكاديمي..." />
      </AppScreen>
    );
  }

  if (hasProfileLoadError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle="إعداد الطالب" title="إكمال الملف الأكاديمي" />
        <StudentSetupStepper currentStep={1} />
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRetry} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <Stack gap="xl">
          <Stack gap="md">
            <AppHeader
              subtitle="اختر بياناتك الدراسية واربطها بالرقم الجامعي قبل إرسال بطاقة الطالب."
              title="إكمال الملف الأكاديمي"
            />
            <StudentSetupStepper currentStep={1} />
          </Stack>

          {isNormalUser(user) ? <NormalUserIntroCard /> : null}

          {showEmptyUniversities ? (
            <EmptyState
              message="تعذر تحميل الجامعات حاليا. حاول مرة أخرى أو تواصل مع إدارة الجامعة."
              title="لا توجد بيانات أكاديمية"
              action={<AppButton onPress={handleRetry} title="إعادة المحاولة" variant="outline" />}
            />
          ) : (
            <>
              <Stack gap="md">
                <AppText variant="title">الرقم الجامعي</AppText>
                <AppTextInput
                  accessibilityLabel="الرقم الجامعي"
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={isSubmitting}
                  error={parseErrorMessage ?? undefined}
                  helperText="أدخل رقمك الجامعي كما يظهر في بطاقة الطالب."
                  keyboardType="number-pad"
                  label="الرقم الجامعي"
                  onChangeText={setStudentNumber}
                  placeholder="2150094"
                  value={studentNumber}
                />
                <AppButton
                  loading={isParsingStudentNumber}
                  onPress={() => {
                    void parseCurrentStudentNumber();
                  }}
                  title="تحليل الرقم"
                  variant="outline"
                />
                <StudentNumberPreviewCard parsedStudentNumber={parsedStudentNumber} />
              </Stack>

              <AcademicSelectField
                emptyText="لا توجد جامعات متاحة حاليا."
                isLoading={isLoadingOptions}
                label="الجامعة"
                onSelect={selectUniversity}
                options={universities}
                selectedId={selectedUniversityId}
              />

              <AcademicSelectField
                disabled={!selectedUniversityId}
                emptyText="اختر الجامعة أولا لعرض الكليات."
                isLoading={isLoadingFaculties}
                label="الكلية"
                onSelect={selectFaculty}
                options={faculties}
                selectedId={selectedFacultyId}
              />

              <AcademicSelectField
                disabled={!selectedFacultyId}
                emptyText="اختر الكلية أولا لعرض الاختصاصات."
                isLoading={isLoadingMajors}
                label="الاختصاص"
                onSelect={selectMajor}
                options={majors}
                selectedId={selectedMajorId}
              />

              <AcademicSelectField
                emptyText="لا توجد سنوات أكاديمية متاحة حاليا."
                isLoading={isLoadingOptions}
                label="السنة الأكاديمية"
                onSelect={selectAcademicYear}
                options={academicYears}
                selectedId={selectedAcademicYearId}
              />

              <AcademicSelectField
                emptyText="لا توجد فصول دراسية متاحة حاليا."
                isLoading={isLoadingOptions}
                label="الفصل الدراسي"
                onSelect={selectSemester}
                options={semesters}
                selectedId={selectedSemesterId}
              />

              {selectedMajorId ? (
                <AppCard padding="md" variant="muted">
                  <Stack gap="xs">
                    <AppText variant="title">مواد الاختصاص</AppText>
                    <AppText color="secondary" variant="bodySmall">
                      {isLoadingSubjects
                        ? 'جاري تحميل المواد المرتبطة بالاختصاص...'
                        : subjects.length > 0
                          ? `تم تحميل ${subjects.length} مادة مرتبطة باختصاصك.`
                          : 'لا توجد مواد متاحة لهذا الاختصاص حاليا.'}
                    </AppText>
                  </Stack>
                </AppCard>
              ) : null}

              {errorMessage ? (
                <AppText color="error" variant="bodySmall">
                  {errorMessage}
                </AppText>
              ) : null}

              <AppButton
                disabled={!canSubmit || isSubmitting}
                fullWidth
                loading={isSubmitting}
                onPress={handleSubmit}
                title="حفظ ومتابعة التوثيق"
              />
            </>
          )}
        </Stack>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  keyboardAvoid: {
    flex: 1,
  },
});
