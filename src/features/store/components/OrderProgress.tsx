import { StyleSheet, View } from 'react-native';

import type { StoreOrder } from '../../../api';
import { AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing, useBrand } from '../../../theme';
import { storeProgress, storeStatusPresentation } from '../services';

/** pending → confirmed → ready → collected as four dots with labels; a cancelled order shows how far it got. */
export function OrderProgress({ order }: { order: Pick<StoreOrder, 'status' | 'history'> }) {
  const { t } = useTranslation();
  const brand = useBrand();
  const steps = storeProgress(order);
  const cancelled = order.status === 'cancelled';

  return (
    <View accessibilityLabel={t.store.orders.detail.progressLabel} accessible style={styles.row}>
      {steps.map((step, index) => {
        const done = step.state === 'done';
        const current = step.state === 'current';
        const label = storeStatusPresentation(step.status, t.store.orders.status, '').label;
        const fill = cancelled ? colors.border.strong : brand.primary;

        return (
          <View key={step.status} style={styles.step}>
            <View style={styles.dotRow}>
              <View
                style={[
                  styles.line,
                  index === 0
                    ? styles.hidden
                    : { backgroundColor: done || current ? fill : colors.border.default },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  done || current
                    ? { backgroundColor: fill, borderColor: fill }
                    : {
                        backgroundColor: colors.background.surface,
                        borderColor: colors.border.strong,
                      },
                  current ? { borderWidth: 3, backgroundColor: colors.background.surface } : null,
                ]}
              >
                {done ? (
                  <Icon color={colors.text.inverse} name="check" size={12} strokeWidth={3} />
                ) : null}
              </View>
              <View
                style={[
                  styles.line,
                  index === steps.length - 1
                    ? styles.hidden
                    : { backgroundColor: done ? fill : colors.border.default },
                ]}
              />
            </View>
            <AppText
              align="center"
              color={current || done ? 'primary' : 'muted'}
              numberOfLines={2}
              style={styles.label}
              variant="caption"
              weight={current ? '700' : '600'}
            >
              {label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  dotRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 2 },
  hidden: { backgroundColor: 'transparent' },
  dot: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 2,
  },
  label: { paddingHorizontal: 2 },
});
