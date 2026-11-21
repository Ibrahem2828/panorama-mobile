import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Image, StyleSheet, View } from 'react-native';

import { getDeviceHeaders } from '../../api';
import { useAuthStore } from '../../features/auth/store';
import { authenticatedImageUrl } from '../../utils/authenticatedImageUrl';
import { Skeleton } from '../feedback';

type AuthenticatedImageProps = {
  /** `image` / `image_url` of a group, announcement or ready product (an authenticated API URL). */
  uri: string | null | undefined;
  /** Rendered when there is no picture, it is not an API picture, or it failed to load. */
  fallback: ReactNode;
  accessibilityLabel?: string;
  resizeMode?: 'cover' | 'contain';
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  borderRadius?: number;
};

/**
 * A picture the API serves only to signed-in users: the request carries the student's token and device headers. The
 * `?v=` in the URL is the cache-buster, so the native image cache keeps showing the last copy offline. Shows a skeleton
 * while loading and the caller's `fallback` (initials, icon) when there is none or it fails.
 */
export function AuthenticatedImage({
  uri,
  fallback,
  accessibilityLabel,
  resizeMode = 'cover',
  style,
  imageStyle,
  borderRadius,
}: AuthenticatedImageProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const url = authenticatedImageUrl(uri);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(url ? 'loading' : 'failed');

  useEffect(() => setState(url ? 'loading' : 'failed'), [url]);

  const source = useMemo(
    () =>
      url && accessToken
        ? { uri: url, headers: { Authorization: `Bearer ${accessToken}`, ...getDeviceHeaders() } }
        : null,
    [url, accessToken],
  );

  if (!source || state === 'failed') {
    return <View style={[styles.box, style]}>{fallback}</View>;
  }

  return (
    <View style={[styles.box, style]}>
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel={accessibilityLabel}
        accessible={!!accessibilityLabel}
        onError={() => setState('failed')}
        onLoad={() => setState('ready')}
        resizeMode={resizeMode}
        // Android forwards headers only when `source` is an array.
        source={[source]}
        style={[styles.fill, imageStyle]}
      />
      {state === 'loading' ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Skeleton borderRadius={borderRadius} height={undefined} style={styles.fill} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
  fill: { width: '100%', height: '100%' },
});
