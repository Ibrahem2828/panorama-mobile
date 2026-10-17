import type { ArtworkTone, IconName } from '../../../components';
import { ListRow } from '../../../components';
import type { StatusVariant } from '../../../types/common';

type ProfileActionItemProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  tone?: ArtworkTone;
  badge?: string;
  badgeVariant?: StatusVariant;
  disabled?: boolean;
  onPress?: () => void;
};

export function ProfileActionItem({
  title,
  subtitle,
  icon,
  tone,
  badge,
  badgeVariant = 'neutral',
  disabled = false,
  onPress,
}: ProfileActionItemProps) {
  return (
    <ListRow
      disabled={disabled}
      icon={icon}
      onPress={onPress}
      subtitle={subtitle}
      title={title}
      tone={tone}
      value={badge}
      valueVariant={badgeVariant}
    />
  );
}
