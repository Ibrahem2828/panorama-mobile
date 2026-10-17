import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '../../../components';
import { AppCard, AppText, Icon, IconTile } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, opacity } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';

type SubjectLinkedSectionCardProps = {
  title: string;
  description: string;
  icon?: IconName;
  disabled?: boolean;
  onPress?: () => void;
};

function SubjectLinkedSectionCardComponent({
  title,
  description,
  icon = 'folder',
  disabled = false,
  onPress,
}: SubjectLinkedSectionCardProps) {
  const { t } = useTranslation();
  const isDisabled = disabled || !onPress;

  return (
    <AppCard
      accessibilityLabel={`${title}. ${description}`}
      onPress={isDisabled ? undefined : onPress}
      padding="md"
      style={isDisabled ? styles.disabled : undefined}
    >
      <View style={styles.row}>
        <IconTile icon={icon} />
        <View style={styles.textBlock}>
          <AppText variant="title">{title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            {isDisabled ? t.common.comingSoon : description}
          </AppText>
        </View>
        <Icon
          color={colors.text.muted}
          name={getIsRTL() ? 'chevronLeft' : 'chevronRight'}
          size={20}
        />
      </View>
    </AppCard>
  );
}

export const SubjectLinkedSectionCard = memo(SubjectLinkedSectionCardComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  disabled: {
    opacity: opacity.disabled,
  },
});
