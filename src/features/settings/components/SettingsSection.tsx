import type { ReactNode } from 'react';

import { ListGroup } from '../../../components';

type SettingsSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <ListGroup subtitle={subtitle} title={title}>
      {children}
    </ListGroup>
  );
}
