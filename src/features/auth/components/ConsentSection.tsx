import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator } from 'react-native';

import { AppButton, AppText, CheckboxRow, Stack } from '../../../components';
import { env } from '../../../config/env';
import { useTranslation } from '../../../i18n';
import { useBrand } from '../../../theme';
import type { RegistrationConsent } from '../hooks/useRegistrationConsent';
import type { ConsentKind, ConsentRequirement } from '../utils/consent';

function isHttps(url: string | null | undefined): url is string {
  return Boolean(url && url.startsWith('https://'));
}

/** The standalone legal page from the app config, else the version's own link; opened in-app. */
function openPolicy(requirement: ConsentRequirement) {
  const configured = requirement.kind === 'terms' ? env.termsUrl : env.privacyUrl;
  const url = isHttps(configured) ? configured : requirement.contentUrl;
  if (isHttps(url)) void WebBrowser.openBrowserAsync(url);
}

type ConsentSectionProps = {
  consent: RegistrationConsent;
  disabled?: boolean;
};

/** Terms / privacy checkboxes for registration. Renders nothing when no policy is published. */
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

  return (
    <Stack gap="xs">
      {consent.requirements.map((requirement) => {
        const kind: ConsentKind = requirement.kind;
        const hasError = consent.errors.includes(kind);
        const linkLabel = kind === 'terms' ? t.auth.consent.terms : t.auth.consent.privacy;
        const prefix = kind === 'terms' ? t.auth.consent.termsPrefix : t.auth.consent.privacyPrefix;

        return (
          <Stack gap="xs" key={kind}>
            <CheckboxRow
              accessibilityLabel={`${prefix}${linkLabel}`}
              checked={consent.checks[kind] === true}
              disabled={disabled}
              error={hasError}
              onToggle={() => consent.toggle(kind)}
            >
              <AppText color={hasError ? 'error' : 'primary'} variant="bodySmall">
                {prefix}
                <AppText
                  accessibilityRole="link"
                  color="brand"
                  onPress={() => openPolicy(requirement)}
                  variant="bodySmall"
                  weight="600"
                >
                  {linkLabel}
                </AppText>
              </AppText>
            </CheckboxRow>
            {hasError ? (
              <AppText color="error" variant="caption">
                {kind === 'terms' ? t.auth.consent.termsRequired : t.auth.consent.privacyRequired}
              </AppText>
            ) : null}
          </Stack>
        );
      })}
    </Stack>
  );
}
