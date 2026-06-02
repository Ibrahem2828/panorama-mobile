import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../../theme';
import { AppText } from '../common';

type SuccessStateProps = {
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SuccessState({ title, message, action, icon, style }: SuccessStateProps) {
  return (
    <View style={[styles.container, style]}>
      {icon}
      <View style={styles.textBlock}>
        <AppText align="center" color="success" variant="title">
          {title}
        </AppText>
        {message ? (
          <AppText align="center" color="secondary" variant="bodySmall">
            {message}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  textBlock: {
    gap: spacing.xs,
  },
});
