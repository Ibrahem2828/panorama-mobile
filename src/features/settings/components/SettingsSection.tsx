import type { ReactNode } from 'react';

import { AppCard, AppText, Stack } from '../../../components';

type SettingsSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <Stack gap="sm">
      <Stack gap="xs">
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText color="secondary" variant="bodySmall">
            {subtitle}
          </AppText>
        ) : null}
      </Stack>
      <AppCard variant="default">
        <Stack gap="sm">{children}</Stack>
      </AppCard>
    </Stack>
  );
}
