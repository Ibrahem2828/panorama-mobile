import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppHeader, AppScreen, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LegalContentBlock } from '../components';
import { getLegalUrl, openLegalPage } from '../services';

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
        {getLegalUrl('privacy') ? (
          <AppButton
            onPress={() => void openLegalPage('privacy')}
            title={t.legal.privacy.openOnline}
            variant="outline"
          />
        ) : null}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
});
