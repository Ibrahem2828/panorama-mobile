import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText, AppTextInput } from '../../../components';
import { spacing } from '../../../theme';

type PasswordInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled?: boolean;
};

export function PasswordInput({
  value,
  onChangeText,
  error,
  disabled = false,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AppTextInput
      autoCapitalize="none"
      autoCorrect={false}
      disabled={disabled}
      error={error}
      label="كلمة المرور"
      onChangeText={onChangeText}
      placeholder="أدخل كلمة المرور"
      rightIcon={
        <Pressable
          accessibilityLabel={isVisible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={spacing.sm}
          onPress={() => setIsVisible((currentValue) => !currentValue)}
          style={styles.toggle}
        >
          <AppText color="brand" variant="caption">
            {isVisible ? 'إخفاء' : 'إظهار'}
          </AppText>
        </Pressable>
      }
      secureTextEntry={!isVisible}
      textContentType="password"
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    minWidth: 44,
    alignItems: 'center',
  },
});
