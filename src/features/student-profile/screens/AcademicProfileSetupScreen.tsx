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
import { useTranslation } from '../../../i18n';

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
  const { t } = useTranslation();
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
        <AppHeader subtitle={t.studentProfile.setupSubtitle} title={t.studentProfile.setupTitle} />
        <StudentSetupStepper currentStep={1} />
        <LoadingState message={t.studentProfile.loading} />
      </AppScreen>
    );
  }

  if (hasProfileLoadError) {
    return (
      <AppScreen contentContainerStyle={styles.content} scroll>
        <AppHeader subtitle={t.studentProfile.setupSubtitle} title={t.studentProfile.setupTitle} />
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
              subtitle={t.studentProfile.cardSubtitle}
              title={t.studentProfile.setupTitle}
            />
            <StudentSetupStepper currentStep={1} />
          </Stack>

          {isNormalUser(user) ? <NormalUserIntroCard /> : null}

          {showEmptyUniversities ? (
            <EmptyState
              message={t.studentProfile.noAcademicDataMessage}
              title={t.studentProfile.noAcademicDataTitle}
              action={<AppButton onPress={handleRetry} title={t.common.retry} variant="outline" />}
            />
          ) : (
            <>
              <Stack gap="md">
                <AppText variant="title">{t.studentProfile.studentNumberTitle}</AppText>
                <AppTextInput
                  accessibilityLabel={t.studentProfile.studentNumberTitle}
                  autoCapitalize="none"
                  autoCorrect={false}
                  disabled={isSubmitting}
                  error={parseErrorMessage ?? undefined}
                  helperText={t.studentProfile.studentNumberHelper}
                  keyboardType="number-pad"
                  label={t.studentProfile.studentNumberTitle}
                  onChangeText={setStudentNumber}
                  placeholder="2150094"
                  value={studentNumber}
                />
                <AppButton
                  loading={isParsingStudentNumber}
                  onPress={() => {
                    void parseCurrentStudentNumber();
                  }}
                  title={t.studentProfile.parseNumber}
                  variant="outline"
                />
                <StudentNumberPreviewCard parsedStudentNumber={parsedStudentNumber} />
              </Stack>

              <AcademicSelectField
                emptyText={t.studentProfile.universityEmpty}
                isLoading={isLoadingOptions}
                label={t.studentProfile.universityLabel}
                onSelect={selectUniversity}
                options={universities}
                selectedId={selectedUniversityId}
              />

              <AcademicSelectField
                disabled={!selectedUniversityId}
                emptyText={t.studentProfile.facultyEmpty}
                isLoading={isLoadingFaculties}
                label={t.studentProfile.facultyLabel}
                onSelect={selectFaculty}
                options={faculties}
                selectedId={selectedFacultyId}
              />

              <AcademicSelectField
                disabled={!selectedFacultyId}
                emptyText={t.studentProfile.majorEmpty}
                isLoading={isLoadingMajors}
                label={t.studentProfile.majorLabel}
                onSelect={selectMajor}
                options={majors}
                selectedId={selectedMajorId}
              />

              <AcademicSelectField
                emptyText={t.studentProfile.academicYearEmpty}
                isLoading={isLoadingOptions}
                label={t.studentProfile.academicYearLabel}
                onSelect={selectAcademicYear}
                options={academicYears}
                selectedId={selectedAcademicYearId}
              />

              <AcademicSelectField
                emptyText={t.studentProfile.semesterEmpty}
                isLoading={isLoadingOptions}
                label={t.studentProfile.semesterLabel}
                onSelect={selectSemester}
                options={semesters}
                selectedId={selectedSemesterId}
              />

              {selectedMajorId ? (
                <AppCard padding="md" variant="muted">
                  <Stack gap="xs">
                    <AppText variant="title">{t.studentProfile.majorSubjectsTitle}</AppText>
                    <AppText color="secondary" variant="bodySmall">
                      {isLoadingSubjects
                        ? t.studentProfile.majorSubjectsLoading
                        : subjects.length > 0
                          ? t.studentProfile.majorSubjectsLoaded(subjects.length)
                          : t.studentProfile.majorSubjectsEmpty}
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
                title={t.studentProfile.saveAndContinue}
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
