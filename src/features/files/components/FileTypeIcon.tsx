import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { useTranslation } from '../../../i18n';
import { colors } from '../../../theme';
import type { FileViewerType } from '../types';

type FileTypeIconProps = {
  type: FileViewerType;
  locked?: boolean;
  size?: 'sm' | 'md';
};

function getFileTypeImage(type: FileViewerType, locked: boolean) {
  if (locked) {
    return images.files.locked;
  }

  switch (type) {
    case 'pdf':
      return images.files.pdf;
    case 'image':
      return images.files.image;
    case 'document':
    case 'unknown':
      return images.files.document;
  }
}

export function FileTypeIcon({ type, locked = false, size = 'md' }: FileTypeIconProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, size === 'sm' ? styles.sm : styles.md]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={t.files.type.iconAlt}
        resizeMode="contain"
        source={getFileTypeImage(type, locked)}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.background.muted,
  },
  sm: {
    width: 44,
    height: 44,
  },
  md: {
    width: 56,
    height: 56,
  },
  image: {
    width: '78%',
    height: '78%',
  },
});
