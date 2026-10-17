import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator } from 'react-native';

import { AppButton, AppText, CheckboxRow, Stack } from '../../../components';
import { env } from '../../../config/env';
import { useTranslation } from '../../../i18n';
import { useBrand } from '../../../theme';
import type { RegistrationConsent } from '../hooks/useRegistrationConsent';
import type { ConsentRequirement } from '../utils/consent';

function isHttps(url: string | null | undefined): url is string {
  return Boolean(url && url.startsWith('https://'));
}

/** One legal hub page lists both documents; falls back to the first published version's own link. */
function openLegal(requirements: ConsentRequirement[]) {
  const fallback = requirements.map((item) => item.contentUrl).find(isHttps);
  const url = isHttps(env.legalUrl) ? env.legalUrl : fallback;
  if (isHttps(url)) void WebBrowser.openBrowserAsync(url);
}

type ConsentSectionProps = {
  consent: RegistrationConsent;
  disabled?: boolean;
};

/** One consent checkbox for terms + privacy. Renders nothing when no policy is published. */
export function ConsentSection({ consent, disabled = false }: ConsentSectionProps) {
  const { t } = useTranslation();
  const brand = useBrand();

  if (consent.isLoading) {
    return (
      <Stack align="center" direction="horizontal" gap="sm">
        <ActivityIndicator color={brand.primary} size="small" />
        <AppText color="muted" variant="bodySmall">
          {t.auth.consent.loading}
        </AppText>
      </Stack>
    );
  }

  if (consent.loadFailed) {
    return (
      <Stack gap="sm">
        <AppText color="error" variant="bodySmall">
          {t.auth.consent.loadFailed}
        </AppText>
        <AppButton onPress={consent.retry} size="sm" title={t.common.retry} variant="outline" />
      </Stack>
    );
  }

  if (consent.requirements.length === 0) return null;

  const accepted = consent.requirements.every((item) => consent.checks[item.kind] === true);
  const hasError = consent.errors.length > 0;

  return (
    <Stack gap="xs">
      <CheckboxRow
        accessibilityLabel={`${t.auth.consent.combinedPrefix}${t.auth.consent.combinedLink}`}
        checked={accepted}
        disabled={disabled}
        error={hasError}
        onToggle={consent.toggleAll}
      >
        <AppText color={hasError ? 'error' : 'primary'} variant="bodySmall">
          {t.auth.consent.combinedPrefix}
          <AppText
            accessibilityRole="link"
            color="brand"
            onPress={() => openLegal(consent.requirements)}
            variant="bodySmall"
            weight="600"
          >
            {t.auth.consent.combinedLink}
          </AppText>
        </AppText>
      </CheckboxRow>
      {hasError ? (
        <AppText color="error" variant="caption">
          {t.auth.consent.combinedRequired}
        </AppText>
      ) : null}
    </Stack>
  );
}
