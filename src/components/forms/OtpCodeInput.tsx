import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

import { AppText } from '../common';
import { colors, spacing, typography } from '../../theme';

interface OtpCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  error?: string | null;
  disabled?: boolean;
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
    if (disabled) return;

    // Only digits
    const digit = text.replace(/[^0-9]/g, '').slice(-1);

    const newValueArr = normalizedValue.split('');
    newValueArr[index] = digit;

    const newValue = newValueArr.join('').slice(0, length);
    onChange(newValue);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    } else if (digit && index === length - 1 && newValue.length === length) {
      onComplete?.(newValue);
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (disabled) return;

    if (e.nativeEvent.key === 'Backspace') {
      if (normalizedValue[index]) {
        // Clear current
        const newValueArr = normalizedValue.split('');
        newValueArr[index] = '';
        onChange(newValueArr.join(''));
      } else if (index > 0) {
        // Move back and clear previous
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

  // Support paste into any box
  const handlePaste = (pasted: string, index: number) => {
    if (disabled) return;

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

    if (newValue.length === length) {
      onComplete?.(newValue);
    }
  };

  return (
    <View>
      <View style={styles.container}>
        {Array.from({ length }).map((_, index) => {
          const char = normalizedValue[index] || '';
          const isFocused = focusedIndex === index && !disabled;

          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                error && styles.boxError,
                disabled && styles.boxDisabled,
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
              editable={!disabled}
              selectTextOnFocus
              caretHidden
              textAlign="center"
              autoFocus={autoFocus && index === 0}
            />
          );
        })}
      </View>

      {error ? (
        <AppText color="error" variant="bodySmall" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const BOX_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: 8,
    backgroundColor: colors.background.surface,
    fontSize: typography.size.lg,
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
    borderColor: colors.status.blocked,
  },
  boxDisabled: {
    backgroundColor: colors.background.muted,
    opacity: 0.6,
  },
  errorText: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
