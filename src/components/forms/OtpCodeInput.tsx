import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

import { AppText } from '../common';
import { colors, radius, spacing, typography } from '../../theme';

interface OtpCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  length?: number;
  autoFocus?: boolean;
}

const OTP_LENGTH = 6;

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
  const inputsRef = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const normalizedValue = (value || '').slice(0, length).padEnd(length, '');

  const focusInput = (index: number) => {
    if (index >= 0 && index < length && inputsRef.current[index]) {
      inputsRef.current[index]?.focus();
      setFocusedIndex(index);
    }
  };

  const handleChangeText = (text: string, index: number) => {
    if (disabled || loading) return;

    const digit = text.replace(/[^0-9]/g, '').slice(-1);

    const newValueArr = normalizedValue.split('');
    newValueArr[index] = digit;

    const newValue = newValueArr.join('').slice(0, length);
    onChange(newValue);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    } else if (digit && index === length - 1 && newValue.replace(/\s/g, '').length === length) {
      onComplete?.(newValue);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (disabled || loading) return;

    if (e.nativeEvent.key === 'Backspace') {
      if (normalizedValue[index]) {
        const newValueArr = normalizedValue.split('');
        newValueArr[index] = '';
        onChange(newValueArr.join(''));
      } else if (index > 0) {
        const prevIndex = index - 1;
        const newValueArr = normalizedValue.split('');
        newValueArr[prevIndex] = '';
        onChange(newValueArr.join(''));
        focusInput(prevIndex);
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handlePaste = (pasted: string, index: number) => {
    if (disabled || loading) return;

    const digits = pasted.replace(/[^0-9]/g, '').slice(0, length);
    if (!digits) return;

    const newValueArr = normalizedValue.split('');
    for (let i = 0; i < digits.length; i++) {
      if (index + i < length) {
        newValueArr[index + i] = digits[i] || '';
      }
    }

    const newValue = newValueArr.join('');
    onChange(newValue);

    const nextFocus = Math.min(index + digits.length, length - 1);
    if (digits.length > 1 || index < length - 1) {
      setTimeout(() => focusInput(nextFocus), 10);
    }

    if (newValue.replace(/\s/g, '').length === length) {
      onComplete?.(newValue);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {Array.from({ length }).map((_, index) => {
          const char = normalizedValue[index] || '';
          const isFocused = focusedIndex === index && !isDisabled && !success;

          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              accessibilityLabel={`الرقم ${index + 1} من ${length}`}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                !!error && styles.boxError,
                success && styles.boxSuccess,
                isDisabled && !success && styles.boxDisabled,
              ]}
              value={char}
              onChangeText={(text) => {
                if (text.length > 1) {
                  handlePaste(text, index);
                } else {
                  handleChangeText(text, index);
                }
              }}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => handleFocus(index)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!isDisabled && !success}
              selectTextOnFocus
              caretHidden
              textAlign="center"
              autoFocus={autoFocus && index === 0}
            />
          );
        })}
      </View>

      {error ? (
        <AppText color="error" variant="caption" style={styles.feedback}>
          {error}
        </AppText>
      ) : null}

      {success ? (
        <AppText color="success" variant="caption" style={styles.feedback}>
          تم التحقق بنجاح
        </AppText>
      ) : null}
    </View>
  );
}

const BOX_SIZE = 48;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    direction: 'ltr',
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.input,
    backgroundColor: colors.background.surface,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
    padding: 0,
  },
  boxFocused: {
    borderColor: colors.brand.primary,
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
  feedback: {
    textAlign: 'center',
  },
});
