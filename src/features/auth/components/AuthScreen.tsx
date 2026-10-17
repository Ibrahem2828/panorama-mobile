import type { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { AppCard, AppText, FormBackButton, FormScreen, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing } from '../../../theme';

type AuthScreenProps = {
  title: string;
  subtitle?: string;
  /** Shows a back button above the logo. */
  onBack?: () => void;
  /** Large logo (login) or compact (everything else). */
  logoSize?: 'lg' | 'sm';
  /** Primary action, pinned above the keyboard. */
  footer?: ReactNode;
  /** Content below the card (secondary links). */
  after?: ReactNode;
  /** Wrap children in a card (default). */
  card?: boolean;
  children: ReactNode;
};

/**
 * Shared layout for every signed-out screen: white background (the logo PNG has a white
 * background, so it blends seamlessly), logo header, title, form card, pinned primary button.
 */
export function AuthScreen({
  title,
  subtitle,
  onBack,
  logoSize = 'sm',
  footer,
  after,
  card = true,
  children,
}: AuthScreenProps) {
  const { t } = useTranslation();
  const large = logoSize === 'lg';

  return (
    <FormScreen footer={footer}>
      {onBack ? (
        <View style={styles.backRow}>
          <FormBackButton onPress={onBack} />
        </View>
      ) : null}
      <Stack align="center" gap="sm">
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={t.auth.logoAlt}
          resizeMode="contain"
          source={images.brand.logoFullAr}
          style={large ? styles.logoLarge : styles.logoSmall}
        />
        <AppText align="center" variant={large ? 'h1' : 'h2'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText align="center" color="secondary" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </Stack>
      {card ? (
        <AppCard padding="lg" variant="elevated">
          <Stack gap="md">{children}</Stack>
        </AppCard>
      ) : (
        <Stack gap="md">{children}</Stack>
      )}
      {after}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  backRow: {
    alignItems: 'flex-start',
    marginBottom: -spacing.sm,
  },
  logoLarge: {
    width: 190,
    height: 140,
  },
  logoSmall: {
    width: 108,
    height: 80,
  },
});
