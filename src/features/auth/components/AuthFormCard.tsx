import type { ReactNode } from 'react';

import { AppCard, AppText, Stack } from '../../../components';

type AuthFormCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthFormCard({ title, subtitle, children }: AuthFormCardProps) {
  return (
    <AppCard padding="lg" variant="elevated">
      <Stack gap="lg">
        <Stack gap="xs">
          <AppText variant="h2">{title}</AppText>
          {subtitle ? (
            <AppText color="secondary" variant="bodySmall">
              {subtitle}
            </AppText>
          ) : null}
        </Stack>
        {children}
      </Stack>
    </AppCard>
  );
}
