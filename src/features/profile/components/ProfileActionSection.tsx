import type { ReactNode } from 'react';

import { AppCard, AppText, Stack } from '../../../components';

type ProfileActionSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ProfileActionSection({ title, subtitle, children }: ProfileActionSectionProps) {
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
