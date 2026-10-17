import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard, AppText, Icon, Stack } from '../../../components';
import type { IconName } from '../../../components';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { colors, radius, spacing, useBrand } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import { AuthScreen } from '../components';

type Navigation = NativeStackNavigationProp<PublicStackParamList>;

type ChoiceCardProps = {
  icon: IconName;
  title: string;
  description: string;
  action: string;
  onPress: () => void;
};

function ChoiceCard({ icon, title, description, action, onPress }: ChoiceCardProps) {
  const brand = useBrand();

  return (
    <Pressable
      accessibilityHint={description}
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <AppCard padding="lg" variant="elevated">
        <View style={styles.cardRow}>
          <View style={[styles.badge, { backgroundColor: brand.primarySoft }]}>
            <Icon color={brand.primary} name={icon} size={28} />
          </View>
          <Stack gap="xs" style={styles.cardText}>
            <AppText variant="title">{title}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {description}
            </AppText>
            <AppText color="brand" variant="button">
              {action}
            </AppText>
          </Stack>
          <Icon
            color={colors.text.muted}
            name={getIsRTL() ? 'chevronLeft' : 'chevronRight'}
            size={20}
          />
        </View>
      </AppCard>
    </Pressable>
  );
}

export function AccountTypeChoiceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();

  return (
    <AuthScreen
      card={false}
      onBack={() => navigation.goBack()}
      subtitle={t.auth.accountType.description}
      title={t.auth.accountType.title}
    >
      <ChoiceCard
        action={t.auth.accountType.studentAction}
        description={t.auth.accountType.studentDescription}
        icon="cap"
        onPress={() => navigation.navigate(PublicRoutes.RegisterStudent)}
        title={t.auth.accountType.studentTitle}
      />
      <ChoiceCard
        action={t.auth.accountType.normalAction}
        description={t.auth.accountType.normalDescription}
        icon="user"
        onPress={() => navigation.navigate(PublicRoutes.NormalUserRegister)}
        title={t.auth.accountType.normalTitle}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  cardText: { flex: 1, minWidth: 0 },
  badge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
  },
});
