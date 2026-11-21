import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { spacing, useBrand } from '../../../theme';
import { getIsRTL } from '../../../utils/rtl';
import { entryKind } from './licenseLogic';
import { useOfflineLibrary } from './offlineLibrary';

/**
 * Home entry to what the student can study with no connection: saved lectures and files (counts), one tap to the Downloads
 * screen. It reads only local state, so it stays on screen when Home itself could not load.
 */
export function OfflineHomeCard({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation();
  const brand = useBrand();
  const entries = useOfflineLibrary((library) => library.entries);
  const copy = t.offlineHome;
  const counts = useMemo(() => {
    const complete = Object.values(entries).filter((entry) => entry.status === 'complete');

    return {
      files: complete.filter((entry) => entryKind(entry) === 'file').length,
      lectures: complete.filter((entry) => entryKind(entry) === 'lecture').length,
    };
  }, [entries]);
  const has = counts.files + counts.lectures > 0;
  const summary = has ? copy.summary(counts.lectures, counts.files) : copy.emptyHint;

  return (
    <AppCard accessibilityLabel={`${copy.title}. ${summary}`} onPress={onPress} variant="elevated">
      <View style={styles.row}>
        <View style={[styles.icon, { backgroundColor: brand.primarySoft }]}>
          <Icon color={brand.primary} name="download" size={26} />
        </View>
        <View style={styles.text}>
          <AppText variant="title">{copy.title}</AppText>
          <AppText color="secondary" variant="bodySmall">
            {summary}
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
