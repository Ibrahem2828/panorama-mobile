import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, layout, radius, spacing, typography } from '../../theme';
import { getFlexDirection, getRTLTextAlign } from '../../utils/rtl';
import { FormField } from './FormField';

type AppTextInputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function AppTextInput({
  label,
  error,
  helperText,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  inputStyle,
  editable,
  multiline = false,
  placeholderTextColor = colors.text.muted,
  ...props
}: AppTextInputProps) {
  const isDisabled = disabled || editable === false;

  return (
    <FormField error={error} helperText={helperText} label={label} style={style}>
      <View
        style={[
          styles.inputWrapper,
          multiline ? styles.inputWrapperMultiline : null,
          error ? styles.inputWrapperError : null,
          isDisabled ? styles.inputWrapperDisabled : null,
        ]}
      >
        {leftIcon ? <View style={styles.iconSlot}>{leftIcon}</View> : null}
        <TextInput
          {...props}
          accessibilityState={{ disabled: isDisabled }}
          editable={!isDisabled}
          multiline={multiline}
          placeholderTextColor={placeholderTextColor}
          style={[styles.input, multiline ? styles.inputMultiline : null, inputStyle]}
          textAlign={getRTLTextAlign()}
        />
        {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
      </View>
    </FormField>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    minHeight: layout.inputMinHeight,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderRadius: radius.input,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  inputWrapperError: {
    borderColor: colors.semantic.error,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.background.muted,
    opacity: 0.72,
  },
  input: {
    ...typography.variants.input,
    flex: 1,
    minWidth: 0,
    color: colors.text.primary,
    writingDirection: 'rtl',
    padding: 0,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  iconSlot: {
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
