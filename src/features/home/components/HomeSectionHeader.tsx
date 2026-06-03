import type { ReactNode } from 'react';

import { SectionHeader } from '../../../components';

type HomeSectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function HomeSectionHeader({ title, subtitle, action }: HomeSectionHeaderProps) {
  return <SectionHeader action={action} subtitle={subtitle} title={title} />;
}
