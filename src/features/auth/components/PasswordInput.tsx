import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText, AppTextInput } from '../../../components';
import { useTranslation } from '../../../i18n';
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
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AppTextInput
      autoCapitalize="none"
      autoCorrect={false}
      disabled={disabled}
      error={error}
      label={t.auth.fields.password}
      onChangeText={onChangeText}
      placeholder={t.auth.fields.passwordPlaceholder}
      rightIcon={
        <Pressable
          accessibilityLabel={isVisible ? t.auth.fields.hidePassword : t.auth.fields.showPassword}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={spacing.sm}
          onPress={() => setIsVisible((currentValue) => !currentValue)}
          style={styles.toggle}
        >
          <AppText color="brand" variant="caption">
            {isVisible ? t.auth.fields.hide : t.auth.fields.show}
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
