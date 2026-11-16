import { Pressable, StyleSheet, View } from 'react-native';

import type { StoreCurrency } from '../../../api';
import { AppText } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, useBrand } from '../../../theme';
import { STORE_CURRENCIES } from '../services';

type CurrencySwitchProps = {
  value: StoreCurrency;
  onChange: (currency: StoreCurrency) => void;
};

/** Two-way switch between the shop's currencies (SYP / USD). */
export function CurrencySwitch({ value, onChange }: CurrencySwitchProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const labels: Record<StoreCurrency, { short: string; full: string }> = {
    SYP: { short: t.store.home.currencyOptionSyp, full: t.store.home.currencySypFull },
    USD: { short: t.store.home.currencyOptionUsd, full: t.store.home.currencyUsdFull },
  };

  return (
    <View
      accessibilityLabel={t.store.home.currencyLabel}
      accessibilityRole="radiogroup"
      style={styles.track}
    >
      {STORE_CURRENCIES.map((currency) => {
        const selected = currency === value;

        return (
          <Pressable
            accessibilityLabel={labels[currency].full}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            key={currency}
            onPress={() => !selected && onChange(currency)}
            style={[styles.option, selected ? { backgroundColor: brand.primary } : null]}
          >
            <AppText
              numberOfLines={1}
              style={{ color: selected ? brand.onPrimary : colors.text.secondary }}
              variant="bodySmall"
              weight="700"
            >
              {labels[currency].short}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  option: {
    minWidth: 64,
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
});
