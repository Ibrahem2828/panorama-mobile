import { memo, useCallback } from 'react';
import { Image, Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, IconTile, Stack } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, opacity, radius, useBrand } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import { getAnnouncementDate, isEndingSoon } from '../services';
import type { AnnouncementItem } from '../types';

type AnnouncementListItemProps = {
  item: AnnouncementItem;
  isUnread: boolean;
  onPress: (id: AnnouncementItem['id']) => void;
};

const THUMBNAIL_SIZE = 72;

function AnnouncementListItemComponent({ item, isUnread, onPress }: AnnouncementListItemProps) {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const title = item.title ?? t.announcements.untitled;
  const dateText = formatDate(getAnnouncementDate(item), locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const endingSoon = isEndingSoon(item);
  const handlePress = useCallback(() => onPress(item.id), [item.id, onPress]);

  return (
    <Pressable
      accessibilityHint={isUnread ? t.announcements.newBadge : undefined}
      accessibilityLabel={t.announcements.openDetails(title)}
      accessibilityRole="button"
      android_ripple={{ color: colors.ripple, foreground: true }}
      onPress={handlePress}
      style={({ pressed }) => (pressed ? styles.pressed : null)}
    >
      <AppCard
        padding="md"
        style={isUnread ? { borderColor: brand.primary, borderWidth: 1.5 } : undefined}
        variant="default"
      >
        <Stack align="flex-start" direction="horizontal" gap="md">
          {item.imageUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="cover"
              source={{ uri: item.imageUrl }}
              style={styles.thumbnail}
            />
          ) : (
            <IconTile icon="megaphone" size="lg" style={styles.thumbnail} />
          )}
          <Stack gap="xs" style={styles.body}>
            <Stack align="center" direction="horizontal" gap="sm" wrap>
              {isUnread ? <AppBadge label={t.announcements.newBadge} variant="brand" /> : null}
              {endingSoon ? (
                <AppBadge label={t.announcements.endingSoon} variant="warning" />
              ) : null}
            </Stack>
            <AppText numberOfLines={2} variant="title" weight={isUnread ? '700' : '600'}>
              {title}
            </AppText>
            {item.body ? (
              <AppText color="secondary" numberOfLines={2} variant="bodySmall">
                {item.body}
              </AppText>
            ) : null}
            {dateText ? (
              <AppText color="muted" variant="caption">
                {dateText}
              </AppText>
            ) : null}
          </Stack>
        </Stack>
      </AppCard>
    </Pressable>
  );
}

export const AnnouncementListItem = memo(AnnouncementListItemComponent);

const styles = StyleSheet.create({
  pressed: { opacity: opacity.pressed },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radius.md,
  },
  body: { flex: 1, minWidth: 0 },
});
