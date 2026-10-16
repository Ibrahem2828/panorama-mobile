import { AppIconButton, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { getIsRTL } from '../../../utils/rtl';

type Props = { onPress: () => void; color?: string };

/** Header back button; the arrow follows the layout direction. */
export function BackButton({ onPress, color }: Props) {
  const { t } = useTranslation();
  return (
    <AppIconButton
      accessibilityLabel={t.common.back}
      icon={<Icon color={color} name={getIsRTL() ? 'chevronRight' : 'chevronLeft'} size={22} />}
      onPress={onPress}
      variant="ghost"
    />
  );
}
