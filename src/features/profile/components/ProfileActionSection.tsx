import type { ReactNode } from 'react';

import { ListGroup } from '../../../components';

type ProfileActionSectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ProfileActionSection({ title, subtitle, children }: ProfileActionSectionProps) {
  return (
    <ListGroup subtitle={subtitle} title={title}>
      {children}
    </ListGroup>
  );
}
