import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppHeader, AppScreen, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LegalContentBlock } from '../components';

type PrivacyPolicyScreenProps = NativeStackScreenProps<ProfileStackParamList, 'PrivacyPolicy'>;

export function PrivacyPolicyScreen({ navigation }: PrivacyPolicyScreenProps) {
  const { t } = useTranslation();

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle={t.legal.privacy.subtitle} title={t.legal.privacy.title} />
          <AppButton onPress={() => navigation.goBack()} title={t.common.back} variant="ghost" />
        </Stack>

        {t.legal.privacy.sections.map((block) => (
          <LegalContentBlock key={block.title} paragraphs={block.paragraphs} title={block.title} />
        ))}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
