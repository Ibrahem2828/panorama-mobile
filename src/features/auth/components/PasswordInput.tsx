import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppTextInput, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors } from '../../../theme';

type PasswordInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  helperText?: string;
  autoComplete?: 'password' | 'new-password' | 'current-password';
};

/** Password field with an eye icon that shows or hides the text. */
export function PasswordInput({
  value,
  onChangeText,
  error,
  disabled = false,
  label,
  placeholder,
  helperText,
  autoComplete = 'password',
}: PasswordInputProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AppTextInput
      autoCapitalize="none"
      autoComplete={autoComplete}
      autoCorrect={false}
      disabled={disabled}
      error={error}
      helperText={helperText}
      label={label ?? t.auth.fields.password}
      onChangeText={onChangeText}
      placeholder={placeholder ?? t.auth.fields.passwordPlaceholder}
      rightIcon={
        <Pressable
          accessibilityLabel={isVisible ? t.auth.fields.hidePassword : t.auth.fields.showPassword}
          accessibilityRole="button"
          accessibilityState={{ checked: isVisible }}
          disabled={disabled}
          hitSlop={12}
          onPress={() => setIsVisible((current) => !current)}
          style={styles.toggle}
        >
          <Icon color={colors.text.secondary} name={isVisible ? 'eyeOff' : 'eye'} size={22} />
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
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
