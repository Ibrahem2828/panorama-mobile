import { Pressable, StyleSheet } from 'react-native';

import { AppBadge, AppCard, AppText, Stack } from '../../../components';
import { opacity } from '../../../theme';
import { getSupportCategoryLabel } from '../services';
import type { SupportTicketCategory } from '../types';

const SUPPORT_CATEGORIES: SupportTicketCategory[] = [
  'technical',
  'account',
  'verification',
  'printing',
  'files',
  'groups',
  'other',
];

type SupportCategorySelectorProps = {
  value: SupportTicketCategory;
  error?: string;
  onChange: (category: SupportTicketCategory) => void;
};

export function SupportCategorySelector({ value, error, onChange }: SupportCategorySelectorProps) {
  return (
    <Stack gap="sm">
      <AppText variant="title">تصنيف التذكرة</AppText>
      <Stack direction="horizontal" gap="sm" wrap>
        {SUPPORT_CATEGORIES.map((category) => {
          const isSelected = category === value;

          return (
            <Pressable
              accessibilityRole="button"
              key={category}
              onPress={() => onChange(category)}
              style={({ pressed }) => [pressed ? styles.pressed : null]}
            >
              <AppBadge
                label={getSupportCategoryLabel(category)}
                size="md"
                variant={isSelected ? 'brand' : 'neutral'}
              />
            </Pressable>
          );
        })}
      </Stack>
      {error ? (
        <AppText color="error" variant="bodySmall">
          {error}
        </AppText>
      ) : null}
      <AppCard variant="muted">
        <AppText color="secondary" variant="caption">
          التصنيفات ثابتة محليا في MVP ولا يتم جلبها من API في هذه المرحلة.
        </AppText>
      </AppCard>
    </Stack>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: opacity.pressed,
  },
});
