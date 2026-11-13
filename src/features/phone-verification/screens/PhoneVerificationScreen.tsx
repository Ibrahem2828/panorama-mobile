import { useEffect, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  ErrorState,
  FormAlert,
  IconTile,
  LoadingState,
  OtpCodeInput,
  Stack,
} from '../../../components';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { PasswordInput } from '../../auth/components/PasswordInput';
import { useAuthStore } from '../../auth/store';
import { usePhoneVerificationSync } from '../hooks/usePhoneVerificationSync';
import {
  deriveView,
  formatCountdown,
  formatPhoneForDisplay,
  isCodeComplete,
  isOpenStatus,
  sanitizeCodeInput,
  validatePhoneForm,
  type PhoneFailure,
  type PhoneFormErrors,
} from '../services/phoneVerificationLogic';
import { usePhoneVerificationStore } from '../store/phoneVerificationStore';

type PhoneVerificationScreenProps = NativeStackScreenProps<
  ProfileStackParamList,
  'PhoneVerification'
>;

export function failureMessage(
  failure: PhoneFailure,
  errors: TranslationCatalog['phoneVerify']['errors'],
): string {
  switch (failure.kind) {
    case 'password_incorrect':
      return errors.passwordIncorrect;
    case 'phone_invalid':
      return errors.phoneInvalid;
    case 'phone_in_use':
      return errors.phoneInUse;
    case 'already_open':
      return errors.alreadyOpen;
    case 'already_verified':
      return errors.alreadyVerified;
    case 'code_invalid':
      return errors.codeInvalid(failure.attemptsRemaining);
    case 'attempts_exceeded':
      return errors.attemptsExceeded;
    case 'code_expired':
      return errors.codeExpired;
    case 'code_not_sent':
      return errors.codeNotSent;
    case 'not_found':
      return errors.notFound;
    case 'rate_limited':
      return errors.rateLimited;
    case 'network':
      return errors.network;
    default:
      return errors.generic;
  }
}

/**
 * Phone verification: enter the number and the account password, wait for staff to send the code on WhatsApp, type the
 * 6-digit code before it expires. The status refreshes on focus, on foreground, on a push and on a light timer.
 */
export function PhoneVerificationScreen({ navigation }: PhoneVerificationScreenProps) {
  const { t } = useTranslation();
  const copy = t.phoneVerify;
  usePhoneVerificationSync();

  const request = usePhoneVerificationStore((state) => state.request);
  const hasLoaded = usePhoneVerificationStore((state) => state.hasLoaded);
  const isLoading = usePhoneVerificationStore((state) => state.isLoading);
  const isSubmitting = usePhoneVerificationStore((state) => state.isSubmitting);
  const failure = usePhoneVerificationStore((state) => state.failure);
  const load = usePhoneVerificationStore((state) => state.load);
  const submit = usePhoneVerificationStore((state) => state.submit);
  const confirm = usePhoneVerificationStore((state) => state.confirm);
  const cancel = usePhoneVerificationStore((state) => state.cancel);
  const clearFailure = usePhoneVerificationStore((state) => state.clearFailure);
  const authUser = useAuthStore((state) => state.user);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<PhoneFormErrors>({});
  const [code, setCode] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const open = isOpenStatus(request?.status);
  const view = useMemo(() => {
    // The account is already verified (for example confirmed on another screen) and nothing is open.
    if (authUser?.is_phone_verified === true && !open && request?.status !== 'verified') {
      return { kind: 'verified', phone: authUser.phone_number ?? '' } as const;
    }

    return deriveView(request, now);
  }, [authUser?.is_phone_verified, authUser?.phone_number, now, open, request]);

  // Entering a different request (new code sent, new request) starts with an empty code box.
  const requestId = request?.id ?? null;
  const requestStatus = request?.status ?? null;
  useEffect(() => {
    setCode('');
  }, [requestId, requestStatus]);

  // One tick per second only while a code countdown is on screen.
  useEffect(() => {
    if (view.kind !== 'code') return undefined;

    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);

    return () => clearInterval(timer);
  }, [view.kind]);

  // The password never outlives a request that was sent.
  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  function updatePhone(value: string) {
    setPhone(value);
    setFormErrors((current) => ({ ...current, phone: undefined }));
    clearFailure();
  }

  function updatePassword(value: string) {
    setPassword(value);
    setFormErrors((current) => ({ ...current, password: undefined }));
    clearFailure();
  }

  async function handleSubmit() {
    const { errors, e164 } = validatePhoneForm({ phone, password });

    setFormErrors(errors);

    if (!e164 || errors.phone || errors.password) return;

    const ok = await submit(e164, password);

    if (ok) setPassword('');
  }

  async function handleConfirm(value: string) {
    if (!isCodeComplete(value)) return;

    const ok = await confirm(value);

    if (!ok) setCode('');
  }

  const phoneError =
    formErrors.phone === 'required'
      ? copy.form.phoneRequired
      : formErrors.phone === 'invalid'
        ? copy.form.phoneInvalid
        : failure?.kind === 'phone_invalid'
          ? copy.errors.phoneInvalid
          : failure?.kind === 'phone_in_use'
            ? copy.errors.phoneInUse
            : undefined;
  const passwordError =
    formErrors.password === 'required'
      ? copy.form.passwordRequired
      : failure?.kind === 'password_incorrect'
        ? copy.errors.passwordIncorrect
        : undefined;
  // Field-level failures show under their field; everything else goes to the banner.
  const bannerFailure =
    failure &&
    failure.kind !== 'phone_invalid' &&
    failure.kind !== 'phone_in_use' &&
    failure.kind !== 'password_incorrect' &&
    !(failure.kind === 'code_invalid' && view.kind === 'code')
      ? failureMessage(failure, copy.errors)
      : null;
  const codeError =
    failure?.kind === 'code_invalid' ? failureMessage(failure, copy.errors) : undefined;

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <AppHeader
          onBack={() => navigation.goBack()}
          showBack
          subtitle={copy.subtitle}
          title={copy.title}
        />

        {!hasLoaded && !failure ? <LoadingState message={copy.loading} /> : null}

        {!hasLoaded && failure ? (
          <ErrorState message={copy.loadFailed} onRetry={() => void load()} />
        ) : null}

        {hasLoaded ? (
          <>
            {bannerFailure ? <FormAlert message={bannerFailure} /> : null}

            {view.kind === 'form' ? (
              <Stack gap="lg">
                {view.notice === 'expired' ? (
                  <FormAlert message={copy.form.noticeExpired} tone="info" />
                ) : null}
                {view.notice === 'rejected' ? (
                  <FormAlert
                    message={
                      view.rejectionReason
                        ? `${copy.form.noticeRejected} ${view.rejectionReason}`
                        : copy.form.noticeRejected
                    }
                    tone="info"
                  />
                ) : null}

                <AppCard variant="muted">
                  <View style={styles.introRow}>
                    <IconTile icon="chat" tone="success" />
                    <AppText color="secondary" style={styles.introText} variant="bodySmall">
                      {copy.form.intro}
                    </AppText>
                  </View>
                </AppCard>

                <AppTextInput
                  autoComplete="tel"
                  autoCorrect={false}
                  disabled={isSubmitting}
                  error={phoneError}
                  helperText={phoneError ? undefined : copy.form.phoneHint}
                  keyboardType="phone-pad"
                  label={copy.form.phoneLabel}
                  onChangeText={updatePhone}
                  placeholder={copy.form.phonePlaceholder}
                  textContentType="telephoneNumber"
                  value={phone}
                />

                <PasswordInput
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  error={passwordError}
                  label={copy.form.passwordLabel}
                  onChangeText={updatePassword}
                  value={password}
                />
                <AppText color="muted" variant="caption">
                  {copy.form.passwordHint}
                </AppText>

                <AppButton
                  disabled={isSubmitting}
                  fullWidth
                  loading={isSubmitting}
                  onPress={() => void handleSubmit()}
                  size="lg"
                  title={isSubmitting ? copy.form.submitting : copy.form.submit}
                />
              </Stack>
            ) : null}

            {view.kind === 'waiting' ? (
              <Stack gap="lg">
                <AppCard padding="lg" variant="elevated">
                  <Stack align="center" gap="md">
                    <IconTile icon="clock" size="lg" tone="warning" />
                    <AppText align="center" variant="h3">
                      {copy.waiting.title}
                    </AppText>
                    <AppText align="center" color="secondary" variant="bodySmall">
                      {copy.waiting.description(formatPhoneForDisplay(view.phone))}
                    </AppText>
                  </Stack>
                </AppCard>
                <AppButton
                  disabled={isSubmitting || isLoading}
                  fullWidth
                  onPress={() => void load()}
                  title={copy.waiting.refresh}
                  variant="outline"
                />
                <AppButton
                  disabled={isSubmitting}
                  fullWidth
                  loading={isSubmitting}
                  onPress={() => void cancel()}
                  title={isSubmitting ? copy.waiting.cancelling : copy.waiting.cancel}
                  variant="ghost"
                />
              </Stack>
            ) : null}

            {view.kind === 'code' ? (
              <Stack gap="lg">
                <AppCard padding="lg" variant="elevated">
                  <Stack align="center" gap="md">
                    <IconTile icon="chat" size="lg" tone="success" />
                    <AppText align="center" variant="h3">
                      {copy.code.title}
                    </AppText>
                    <AppText align="center" color="secondary" variant="bodySmall">
                      {copy.code.description(formatPhoneForDisplay(view.phone))}
                    </AppText>
                    <OtpCodeInput
                      autoFocus
                      disabled={isSubmitting}
                      error={codeError}
                      loading={isSubmitting}
                      onChange={(value) => {
                        clearFailure();
                        setCode(sanitizeCodeInput(value));
                      }}
                      onComplete={(value) => void handleConfirm(value)}
                      value={code}
                    />
                    <View accessibilityLiveRegion="polite" accessible style={styles.meta}>
                      <AppText
                        align="center"
                        color={view.lapsed ? 'error' : 'secondary'}
                        variant="bodySmall"
                        weight="600"
                      >
                        {view.lapsed
                          ? copy.code.lapsed
                          : copy.code.countdown(formatCountdown(view.remainingSeconds))}
                      </AppText>
                      <AppText align="center" color="muted" variant="caption">
                        {copy.code.attempts(view.attemptsRemaining)}
                      </AppText>
                    </View>
                  </Stack>
                </AppCard>
                <AppButton
                  disabled={!isCodeComplete(code) || isSubmitting}
                  fullWidth
                  loading={isSubmitting}
                  onPress={() => void handleConfirm(code)}
                  size="lg"
                  title={isSubmitting ? copy.code.confirming : copy.code.confirm}
                />
                <Stack gap="xs">
                  <AppButton
                    disabled={isSubmitting}
                    fullWidth
                    onPress={() => void cancel()}
                    title={copy.code.newRequest}
                    variant="outline"
                  />
                  <AppText align="center" color="muted" variant="caption">
                    {copy.code.newRequestHint}
                  </AppText>
                </Stack>
              </Stack>
            ) : null}

            {view.kind === 'verified' ? (
              <Stack gap="lg">
                <AppCard padding="lg" variant="elevated">
                  <Stack align="center" gap="md">
                    <IconTile icon="checkCircle" size="lg" tone="success" />
                    <AppText align="center" variant="h3">
                      {copy.success.title}
                    </AppText>
                    {view.phone ? (
                      <AppText align="center" color="secondary" variant="bodySmall">
                        {copy.success.description(formatPhoneForDisplay(view.phone))}
                      </AppText>
                    ) : null}
                    <AppText align="center" color="secondary" variant="bodySmall">
                      {copy.success.community}
                    </AppText>
                  </Stack>
                </AppCard>
                <AppButton
                  fullWidth
                  onPress={() => navigation.goBack()}
                  size="lg"
                  title={copy.success.done}
                />
              </Stack>
            ) : null}
          </>
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  introRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  introText: { flex: 1 },
  meta: { gap: spacing.xxs, alignItems: 'center' },
});
