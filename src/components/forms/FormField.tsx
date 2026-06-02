import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from '../common';

type FormFieldProps = {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function FormField({
  label,
  error,
  helperText,
  required = false,
  children,
  style,
}: FormFieldProps) {
  return (
    <View style={[styles.container, style]}>
      {label ? (
        <AppText variant="label">
          {label}
          {required ? ' *' : ''}
        </AppText>
      ) : null}
      {children}
      {error ? (
        <AppText color="error" variant="caption">
          {error}
        </AppText>
      ) : null}
      {!error && helperText ? (
        <AppText color="muted" variant="caption">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
