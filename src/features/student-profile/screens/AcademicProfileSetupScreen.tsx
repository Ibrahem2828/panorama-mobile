import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppText,
  AppTextInput,
  EmptyState,
  ErrorState,
  FormAlert,
  FormScreen,
  Icon,
  LoadingState,
  Stack,
} from '../../../components';
import { isNormalUser } from '../../../navigation/guards/navigationGuards';
import { StudentSetupRoutes } from '../../../navigation/routes';
import { isStudentProfileComplete } from '../services';
import type { StudentSetupStackParamList } from '../../../navigation/types';
import { spacing, useBrand } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import {
  AcademicSelectField,
  NormalUserIntroCard,
  SetupHeader,
  StudentNumberPreviewCard,
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
  selectedAcademicYearId: string | number | null;
  selectedSemesterId: string | number | null;
  studentNumber: string;
}): boolean {
  return Boolean(
    input.selectedUniversityId &&
      input.selectedFacultyId &&
      input.selectedAcademicYearId &&
      input.selectedSemesterId &&
      input.studentNumber.trim(),
  );
}

export function AcademicProfileSetupScreen() {
  const { t } = useTranslation();
  const brand = useBrand();
  const navigation = useNavigation<AcademicProfileSetupNavigation>();
  const user = useAuthStore((state) => state.user);
  const bootstrap = useStudentProfileStore((state) => state.bootstrap);
  const universities = useStudentProfileStore((state) => state.universities);
  const faculties = useStudentProfileStore((state) => state.faculties);
  const majors = useStudentProfileStore((state) => state.majors);
  const academicYears = useStudentProfileStore((state) => state.academicYears);
  const semesters = useStudentProfileStore((state) => state.semesters);
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
  const facultySubjectsCount = useStudentProfileStore((state) => state.facultySubjectsCount);
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

  const header = (
    <SetupHeader
      step={1}
      subtitle={t.studentProfile.cardSubtitle}
      title={t.studentProfile.setupTitle}
    />
  );

  if (initialLoading) {
    return (
      <FormScreen>
        {header}
        <LoadingState message={t.studentProfile.loading} />
      </FormScreen>
    );
  }

  if (hasProfileLoadError) {
    return (
      <FormScreen>
        {header}
        <ErrorState message={errorMessage ?? undefined} onRetry={handleRetry} />
      </FormScreen>
    );
  }

  if (showEmptyUniversities) {
    return (
      <FormScreen>
        {header}
        <EmptyState
          action={<AppButton onPress={handleRetry} title={t.common.retry} variant="outline" />}
          message={t.studentProfile.noAcademicDataMessage}
          title={t.studentProfile.noAcademicDataTitle}
        />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      footer={
        <>
          {errorMessage ? <FormAlert message={errorMessage} /> : null}
          <AppButton
            disabled={!canSubmit || isSubmitting}
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit}
            size="lg"
            title={t.studentProfile.saveAndContinue}
          />
        </>
      }
    >
      {header}

      {isNormalUser(user) ? <NormalUserIntroCard /> : null}

      <AppCard padding="lg" variant="elevated">
        <Stack gap="md">
          <View style={styles.sectionTitle}>
            <Icon color={brand.primary} name="idCard" size={22} />
            <AppText variant="title">{t.studentProfile.studentNumberTitle}</AppText>
          </View>
          <AppTextInput
            accessibilityLabel={t.studentProfile.studentNumberTitle}
            autoCapitalize="none"
            autoCorrect={false}
            disabled={isSubmitting}
            error={parseErrorMessage ?? undefined}
            helperText={t.studentProfile.studentNumberHelper}
            keyboardType="number-pad"
            onChangeText={setStudentNumber}
            placeholder={t.studentProfile.studentNumberPlaceholder}
            value={studentNumber}
          />
          <AppButton
            disabled={!studentNumber.trim()}
            loading={isParsingStudentNumber}
            onPress={() => {
              void parseCurrentStudentNumber();
            }}
            size="sm"
            title={t.studentProfile.parseNumber}
            variant="outline"
          />
          <StudentNumberPreviewCard parsedStudentNumber={parsedStudentNumber} />
        </Stack>
      </AppCard>

      <AppCard padding="lg" variant="elevated">
        <Stack gap="md">
          <View style={styles.sectionTitle}>
            <Icon color={brand.primary} name="cap" size={22} />
            <AppText variant="title">{t.studentProfile.academicSectionTitle}</AppText>
          </View>

          <AcademicSelectField
            autoSelect
            emptyText={t.studentProfile.universityEmpty}
            isLoading={isLoadingOptions}
            label={t.studentProfile.universityLabel}
            onSelect={selectUniversity}
            options={universities}
            placeholder={t.studentProfile.universityPlaceholder}
            selectedId={selectedUniversityId}
          />

          <AcademicSelectField
            autoSelect
            disabled={!selectedUniversityId}
            emptyText={
              selectedUniversityId ? t.studentProfile.facultyNone : t.studentProfile.facultyEmpty
            }
            isLoading={isLoadingFaculties}
            label={t.studentProfile.facultyLabel}
            onSelect={selectFaculty}
            options={faculties}
            placeholder={t.studentProfile.facultyPlaceholder}
            selectedId={selectedFacultyId}
          />

          <AcademicSelectField
            autoSelect
            emptyText={t.studentProfile.academicYearEmpty}
            isLoading={isLoadingOptions}
            label={t.studentProfile.academicYearLabel}
            onSelect={selectAcademicYear}
            options={academicYears}
            placeholder={t.studentProfile.academicYearPlaceholder}
            selectedId={selectedAcademicYearId}
          />

          <AcademicSelectField
            autoSelect
            emptyText={t.studentProfile.semesterEmpty}
            isLoading={isLoadingOptions}
            label={t.studentProfile.semesterLabel}
            onSelect={selectSemester}
            options={semesters}
            placeholder={t.studentProfile.semesterPlaceholder}
            selectedId={selectedSemesterId}
          />

          <AcademicSelectField
            clearLabel={t.studentProfile.majorNone}
            disabled={!selectedFacultyId || (majors.length === 0 && !isLoadingMajors)}
            emptyText={
              selectedFacultyId ? t.studentProfile.majorNoneAvailable : t.studentProfile.majorEmpty
            }
            hint={t.studentProfile.majorOptionalHint}
            isLoading={isLoadingMajors}
            label={t.studentProfile.majorLabel}
            onClear={() => selectMajor(null)}
            onSelect={selectMajor}
            options={majors}
            placeholder={t.studentProfile.majorNone}
            selectedId={selectedMajorId}
          />
        </Stack>
      </AppCard>

      {selectedFacultyId ? (
        <View style={styles.subjects}>
          <Icon color={brand.primary} name="book" size={20} />
          <AppText color="secondary" style={styles.subjectsText} variant="bodySmall">
            {isLoadingSubjects
              ? t.studentProfile.majorSubjectsLoading
              : facultySubjectsCount > 0
                ? t.studentProfile.majorSubjectsLoaded(facultySubjectsCount)
                : t.studentProfile.majorSubjectsEmpty}
          </AppText>
        </View>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subjects: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  subjectsText: {
    flex: 1,
  },
});
