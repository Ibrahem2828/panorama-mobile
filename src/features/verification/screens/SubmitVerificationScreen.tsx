import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppText,
  ErrorState,
  FormAlert,
  FormScreen,
  Icon,
  LoadingState,
  Stack,
} from '../../../components';
import { StudentSetupRoutes } from '../../../navigation/routes';
import type { StudentSetupStackParamList } from '../../../navigation/types';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { SetupHeader } from '../../student-profile/components';
import { VerificationCardImagePicker, VerificationStatusCard } from '../components';
import {
  canResubmitVerification,
  getVerificationStatus,
  isVerificationApproved,
} from '../services';
import { useVerificationStore } from '../store';
import { useTranslation } from '../../../i18n';

type SubmitVerificationNavigation = NativeStackNavigationProp<
  StudentSetupStackParamList,
  'SubmitVerification'
>;

export function SubmitVerificationScreen() {
  const { t } = useTranslation();
  const brand = useBrand();
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  const navigation = useNavigation<SubmitVerificationNavigation>();
  const verification = useVerificationStore((state) => state.verification);
  const selectedCardImage = useVerificationStore((state) => state.selectedCardImage);
  const hasLoadedVerification = useVerificationStore((state) => state.hasLoadedVerification);
  const isLoadingVerification = useVerificationStore((state) => state.isLoadingVerification);
  const isSubmitting = useVerificationStore((state) => state.isSubmitting);
  const uploadProgress = useVerificationStore((state) => state.uploadProgress);
  const errorMessage = useVerificationStore((state) => state.errorMessage);
  const loadVerification = useVerificationStore((state) => state.loadVerification);
  const setSelectedCardImage = useVerificationStore((state) => state.setSelectedCardImage);
  const submitVerification = useVerificationStore((state) => state.submitVerification);
  const resubmitVerification = useVerificationStore((state) => state.resubmitVerification);
  const verificationStatus = getVerificationStatus(verification);
  const shouldResubmit = canResubmitVerification(verification);
  const isReadOnlyStatus = verificationStatus === 'pending' || isVerificationApproved(verification);

  useEffect(() => {
    void loadVerification();
  }, [loadVerification]);

  async function handleSubmit() {
    try {
      if (shouldResubmit) {
        await resubmitVerification();
      } else {
        await submitVerification();
      }

      setSubmitSucceeded(true);
    } catch {
      // The verification store owns the user-facing error message.
    }
  }

  const title = shouldResubmit ? t.verificationFlow.resubmitTitle : t.verificationFlow.submitTitle;
  const goBack = () => navigation.goBack();

  if (isLoadingVerification && !hasLoadedVerification) {
    return (
      <FormScreen>
        <SetupHeader step={2} subtitle={t.verificationFlow.cardSubtitle} title={title} />
        <LoadingState message={t.verificationFlow.loading} />
      </FormScreen>
    );
  }

  if (submitSucceeded) {
    return (
      <FormScreen
        footer={
          <AppButton
            fullWidth
            onPress={() => navigation.replace(StudentSetupRoutes.VerificationStatus)}
            size="lg"
            title={t.verificationFlow.trackStatus}
          />
        }
      >
        <SetupHeader step={2} title={t.verificationFlow.sentTitle} />
        <View style={styles.success}>
          <View style={[styles.successBadge, { backgroundColor: colors.semantic.success }]}>
            <Icon color={colors.text.inverse} name="check" size={44} strokeWidth={2.5} />
          </View>
          <AppText align="center" variant="h2">
            {t.verificationFlow.sentHeading}
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            {t.verificationFlow.sentMessage}
          </AppText>
        </View>
      </FormScreen>
    );
  }

  if (errorMessage && !hasLoadedVerification) {
    return (
      <FormScreen>
        <SetupHeader step={2} subtitle={t.verificationFlow.cardSubtitle} title={title} />
        <ErrorState
          message={errorMessage}
          onRetry={() => {
            void loadVerification({ force: true });
          }}
        />
      </FormScreen>
    );
  }

  if (isReadOnlyStatus) {
    return (
      <FormScreen
        footer={
          <AppButton
            fullWidth
            onPress={() => navigation.replace(StudentSetupRoutes.VerificationStatus)}
            size="lg"
            title={t.verificationFlow.trackStatus}
          />
        }
      >
        <SetupHeader
          onBack={goBack}
          step={2}
          subtitle={t.verificationFlow.cardSubtitle}
          title={title}
        />
        <VerificationStatusCard verification={verification} />
        <AppText align="center" color="secondary" variant="bodySmall">
          {t.verificationFlow.lockedNote}
        </AppText>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      footer={
        <>
          {errorMessage ? <FormAlert message={errorMessage} /> : null}
          <AppButton
            disabled={!selectedCardImage || isSubmitting}
            fullWidth
            loading={isSubmitting}
            onPress={handleSubmit}
            size="lg"
            title={
              shouldResubmit ? t.verificationFlow.resubmitRequest : t.verificationFlow.submitRequest
            }
          />
        </>
      }
    >
      <SetupHeader
        onBack={goBack}
        step={2}
        subtitle={t.verificationFlow.cardSubtitle}
        title={title}
      />

      {verification && shouldResubmit ? (
        <VerificationStatusCard verification={verification} />
      ) : null}

      <VerificationCardImagePicker
        disabled={isSubmitting}
        isUploading={isSubmitting}
        onChange={setSelectedCardImage}
        progress={uploadProgress}
        selectedImage={selectedCardImage}
      />

      <View style={styles.why}>
        <Icon color={brand.primary} name="shield" size={22} />
        <Stack gap="xs" style={styles.whyText}>
          <AppText variant="subtitle" weight="600">
            {t.verificationFlow.whyTitle}
          </AppText>
          <AppText color="secondary" variant="bodySmall">
            {t.verificationFlow.whyDescription}
          </AppText>
        </Stack>
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  success: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  successBadge: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  why: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  whyText: {
    flex: 1,
  },
});
