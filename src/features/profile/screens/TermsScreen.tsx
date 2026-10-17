import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppHeader, AppScreen, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import type { ProfileStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';
import { LegalContentBlock } from '../components';
import { getLegalUrl, openLegalPage } from '../services';

type TermsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Terms'>;

export function TermsScreen(_props: TermsScreenProps) {
  const { t } = useTranslation();

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl">
        <Stack gap="md">
          <AppHeader subtitle={t.legal.terms.subtitle} title={t.legal.terms.title} />
        </Stack>

        {t.legal.terms.sections.map((block) => (
          <LegalContentBlock key={block.title} paragraphs={block.paragraphs} title={block.title} />
        ))}
        {getLegalUrl('terms') ? (
          <AppButton
            onPress={() => void openLegalPage('terms')}
            title={t.legal.terms.openOnline}
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
