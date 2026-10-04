import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

import { images } from '../../../assets/images';
import { AppCard, AppScreen, AppText, Stack } from '../../../components';
import { Illustration } from '../../../components/media/Illustration';
import { useTranslation } from '../../../i18n';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';

type Navigation = NativeStackNavigationProp<PublicStackParamList>;

export function AccountTypeChoiceScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Navigation>();
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack align="center" gap="md">
          <Illustration
            accessibilityLabel={t.auth.accountType.illustrationAlt}
            size="lg"
            source={images.illustrations.universityBuilding}
          />
          <AppText align="center" variant="h1">
            {t.auth.accountType.title}
          </AppText>
          <AppText align="center" color="secondary" variant="body">
            {t.auth.accountType.description}
          </AppText>
        </Stack>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate(PublicRoutes.RegisterStudent)}
        >
          <AppCard padding="lg" variant="elevated">
            <Stack gap="sm">
              <Illustration
                accessibilityLabel={t.auth.accountType.studentAlt}
                size="sm"
                source={images.illustrations.studentMale}
              />
              <AppText variant="title">{t.auth.accountType.studentTitle}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {t.auth.accountType.studentDescription}
              </AppText>
              <AppText color="brand" variant="button">
                {t.auth.accountType.studentAction}
              </AppText>
            </Stack>
          </AppCard>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate(PublicRoutes.NormalUserRegister)}
        >
          <AppCard padding="lg" variant="elevated">
            <Stack gap="sm">
              <Illustration
                accessibilityLabel={t.auth.accountType.normalAlt}
                size="sm"
                source={images.illustrations.studyDesk}
              />
              <AppText variant="title">{t.auth.accountType.normalTitle}</AppText>
              <AppText color="secondary" variant="bodySmall">
                {t.auth.accountType.normalDescription}
              </AppText>
              <AppText color="brand" variant="button">
                {t.auth.accountType.normalAction}
              </AppText>
            </Stack>
          </AppCard>
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <AppText color="brand" variant="button">
            {t.auth.backToLogin}
          </AppText>
        </Pressable>
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xl, gap: spacing.xl },
  backLink: { alignItems: 'center', paddingVertical: spacing.md },
});
