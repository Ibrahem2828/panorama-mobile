import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  ErrorState,
  LoadingState,
  Stack,
} from '../../../components';
import { StudentSetupRoutes } from '../../../navigation/routes';
import type { StudentSetupStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { useVerificationStore } from '../../verification/store';
import { AcademicSelectField, StudentNumberPreviewCard, StudentSetupStepper } from '../components';
import { isStudentProfileComplete } from '../services';
import { useStudentProfileStore } from '../store';

type AcademicProfileSetupNavigation = NativeStackNavigationProp<
  StudentSetupStackParamList,
  'AcademicProfileSetup'
>;

export function AcademicProfileSetupScreen() {
  const navigation = useNavigation<AcademicProfileSetupNavigation>();
  const bootstrap = useStudentProfileStore((state) => state.bootstrap);
  const profile = useStudentProfileStore((state) => state.profile);
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
  const loadVerification = useVerificationStore((state) => state.loadVerification);
  const verification = useVerificationStore((state) => state.verification);
  const hasLoadedVerification = useVerificationStore((state) => state.hasLoadedVerification);
  const initialLoading = isBootstrapping && universities.length === 0 && !hasBootstrapped;
  const hasProfileLoadError = Boolean(errorMessage && universities.length === 0);
  const profileComplete = isStudentProfileComplete(profile);

  useEffect(() => {
    void bootstrap();
    void loadVerification();
  }, [bootstrap, loadVerification]);

  useEffect(() => {
    if (!hasBootstrapped || !profileComplete || !hasLoadedVerification) {
      return;
    }

    navigation.replace(
      verification ? StudentSetupRoutes.VerificationStatus : StudentSetupRoutes.SubmitVerification,
    );
  }, [hasBootstrapped, hasLoadedVerification, navigation, profileComplete, verification]);

  function handleRetry() {
    void bootstrap({ force: true });
    void loadVerification({ force: true });
  }

  async function handleSubmit() {
    try {
      await submitProfile();
      navigation.navigate(StudentSetupRoutes.SubmitVerification);
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
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader
            subtitle="اختر بياناتك الدراسية واربطها بالرقم الجامعي قبل إرسال بطاقة الطالب."
            title="إكمال الملف الأكاديمي"
          />
          <StudentSetupStepper currentStep={1} />
        </Stack>

        <Stack gap="md">
          <AppText variant="title">الرقم الجامعي</AppText>
          <AppTextInput
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isSubmitting}
            keyboardType="number-pad"
            label="الرقم الجامعي"
            onChangeText={setStudentNumber}
            placeholder="2150094"
            value={studentNumber}
          />
          {parseErrorMessage ? (
            <AppText color="error" variant="bodySmall">
              {parseErrorMessage}
            </AppText>
          ) : null}
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
          isLoading={isLoadingOptions}
          label="السنة الأكاديمية"
          onSelect={selectAcademicYear}
          options={academicYears}
          selectedId={selectedAcademicYearId}
        />

        <AcademicSelectField
          isLoading={isLoadingOptions}
          label="الفصل"
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
                  : `تم تحميل ${subjects.length} مادة كأساس للربط الأكاديمي لاحقا.`}
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
          fullWidth
          loading={isSubmitting}
          onPress={handleSubmit}
          title="حفظ ومتابعة التوثيق"
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
