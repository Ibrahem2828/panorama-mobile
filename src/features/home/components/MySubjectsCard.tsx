import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing, useBrand } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';

/** The one entry to the student's subjects, their lectures, files and offline downloads (the subjects have no tab of their own). */
export function MySubjectsCard({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const brand = useBrand();
  const copy = t.home.mySubjects;

  return (
    <AppCard
      accessibilityLabel={`${copy.title}. ${copy.description}`}
      onPress={onPress}
      variant="elevated"
    >
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: brand.primarySoft }]}>
          <Icon color={brand.primary} name="book" size={26} />
        </View>
        <View style={styles.text}>
          <AppText variant="title">{copy.title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            {copy.description}
          </AppText>
        </View>
        <Icon color={brand.primary} name={getIsRTL() ? 'chevronLeft' : 'chevronRight'} size={22} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  text: { flex: 1, gap: 2 },
});
