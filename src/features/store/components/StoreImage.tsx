import { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

import { getDeviceHeaders } from '../../../api';
import { Icon } from '../../../components';
import { Skeleton } from '../../../components/feedback';
import { useTranslation } from '../../../i18n';
import { colors, radius } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import { storeImageUrl } from '../services/storeImage';

type StoreImageProps = {
  /** The `image_url` / `thumb_url` / `logo_url` of the payload. */
  uri: string | null | undefined;
  accessibilityLabel?: string;
  resizeMode?: 'cover' | 'contain';
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  /** Shown when there is no picture or it failed to load. */
  fallbackIcon?: 'bag' | 'image';
};

/**
 * A store picture: the API serves them only to signed-in users, so the request carries the student's token. Shows a
 * skeleton while it loads and a quiet placeholder when there is none or it fails.
 */
export function StoreImage({
  uri,
  accessibilityLabel,
  resizeMode = 'cover',
  style,
  borderRadius = radius.lg,
  fallbackIcon = 'bag',
}: StoreImageProps) {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const url = storeImageUrl(uri);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(url ? 'loading' : 'failed');

  useEffect(() => setState(url ? 'loading' : 'failed'), [url]);

  const source = useMemo(
    () =>
      url && accessToken
        ? { uri: url, headers: { Authorization: `Bearer ${accessToken}`, ...getDeviceHeaders() } }
        : null,
    [url, accessToken],
  );

  return (
    <View style={[styles.box, { borderRadius }, style]}>
      {source && state !== 'failed' ? (
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel={accessibilityLabel}
          accessible={!!accessibilityLabel}
          onError={() => setState('failed')}
          onLoad={() => setState('ready')}
          resizeMode={resizeMode}
          // Android forwards headers only when `source` is an array.
          source={[source]}
          style={styles.fill}
        />
      ) : (
        <View
          accessibilityLabel={t.store.card.imageFailed}
          accessible={false}
          style={styles.fallback}
        >
          <Icon color={colors.text.muted} name={fallbackIcon} size={28} />
        </View>
      )}
      {state === 'loading' && source ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Skeleton borderRadius={borderRadius} height={undefined} style={styles.fill} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', backgroundColor: colors.background.muted },
  fill: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
