import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTranslation } from '../../i18n';
import { colors, inputThemeProps, radius, spacing, typography, useBrand } from '../../theme';
import { AppText } from '../common';
import { OTP_LENGTH, activeOtpIndex, isOtpComplete, otpBoxes, sanitizeOtp } from './otpInput';

type OtpCodeInputProps = {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  length?: number;
  autoFocus?: boolean;
};

/**
 * Six visual boxes over one real input. A single input gives the OS everything it needs for
 * paste, long-press paste and SMS/clipboard autofill, while the boxes just render the digits
 * (so "auto-advance" is automatic and backspace always removes the last digit).
 */
export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
  loading = false,
  success = false,
  length = OTP_LENGTH,
  autoFocus = true,
}: OtpCodeInputProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const isDisabled = disabled || loading || success;
  const boxes = otpBoxes(value, length);
  const active = activeOtpIndex(value, length);

  useEffect(() => {
    if (autoFocus && !isDisabled) {
      const timer = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(timer);
    }
    return undefined;
    // Focus once on mount.
  }, []);

  function handleChange(text: string) {
    const next = sanitizeOtp(text, length);
    onChange(next);
    if (isOtpComplete(next, length)) onComplete?.(next);
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        accessibilityLabel={t.otpInput.inputLabel(length)}
        accessibilityRole="none"
        disabled={isDisabled}
        onPress={() => inputRef.current?.focus()}
        style={styles.container}
      >
        {boxes.map((char, index) => {
          const isActive = focused && !isDisabled && index === active;
          return (
            <View
              key={index}
              style={[
                styles.box,
                char ? { borderColor: brand.primary } : null,
                isActive ? [styles.boxActive, { borderColor: brand.primary }] : null,
                error ? styles.boxError : null,
                success ? styles.boxSuccess : null,
                isDisabled && !success ? styles.boxDisabled : null,
              ]}
            >
              <AppText style={styles.char} variant="h2">
                {char}
              </AppText>
            </View>
          );
        })}
        <TextInput
          {...inputThemeProps}
          ref={inputRef}
          autoComplete="sms-otp"
          caretHidden
          editable={!isDisabled}
          keyboardType="number-pad"
          maxLength={length * 2}
          onBlur={() => setFocused(false)}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          style={styles.hiddenInput}
          textContentType="oneTimeCode"
          value={value}
        />
      </Pressable>

      {error ? (
        <AppText align="center" color="error" variant="caption">
          {error}
        </AppText>
      ) : null}

      {success ? (
        <AppText align="center" color="success" variant="caption">
          {t.otpInput.verified}
        </AppText>
      ) : null}
    </View>
  );
}

const BOX_WIDTH = 46;
const BOX_HEIGHT = 56;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  container: {
    // Digits always read left to right.
    direction: 'ltr',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  box: {
    width: BOX_WIDTH,
    height: BOX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  boxActive: {
    borderWidth: 2,
    backgroundColor: colors.background.primary,
  },
  boxError: {
    borderColor: colors.semantic.error,
  },
  boxSuccess: {
    borderColor: colors.semantic.success,
    backgroundColor: colors.semantic.successSoft,
  },
  boxDisabled: {
    backgroundColor: colors.background.muted,
    opacity: 0.6,
  },
  char: {
    fontSize: typography.size.xl,
    lineHeight: 30,
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
    color: 'transparent',
  },
});
