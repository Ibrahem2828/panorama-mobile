import type { ArtworkTone, IconName } from '../../../components';
import { ListRow } from '../../../components';
import type { StatusVariant } from '../../../types/common';

type SettingsOptionRowProps = {
  title: string;
  description?: string;
  icon?: IconName;
  tone?: ArtworkTone;
  value?: string;
  badgeVariant?: StatusVariant;
  disabled?: boolean;
  onPress?: () => void;
};

export function SettingsOptionRow({
  title,
  description,
  icon,
  tone,
  value,
  badgeVariant = 'neutral',
  disabled = false,
  onPress,
}: SettingsOptionRowProps) {
  return (
    <ListRow
      disabled={disabled && !value}
      icon={icon}
      onPress={disabled ? undefined : onPress}
      subtitle={description}
      title={title}
      tone={tone}
      value={value}
      valueVariant={badgeVariant}
    />
  );
}
