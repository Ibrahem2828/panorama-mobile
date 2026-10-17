import { Children, Fragment } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import { AppText } from '../common';
import { AppCard } from './AppCard';

type ListGroupProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

/** A titled card holding rows separated by hairline dividers (inset past the icon column). */
export function ListGroup({ title, subtitle, children }: ListGroupProps) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.group}>
      {title || subtitle ? (
        <View style={styles.heading}>
          {title ? <AppText variant="title">{title}</AppText> : null}
          {subtitle ? (
            <AppText color="secondary" variant="bodySmall">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <AppCard padding="none">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.divider} /> : null}
            {row}
          </Fragment>
        ))}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.sm,
  },
  heading: {
    gap: spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
    backgroundColor: colors.gray[200],
  },
});
