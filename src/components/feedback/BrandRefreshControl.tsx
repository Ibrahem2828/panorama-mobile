import type { ReactNode } from 'react';
import type { RefreshControlProps } from 'react-native';
import { RefreshControl } from 'react-native';

import { colors, useBrand } from '../../theme';

type BrandRefreshControlProps = Omit<RefreshControlProps, 'colors' | 'tintColor'> & {
  /** ScrollView/FlatList clone this element and pass the scrollable as its child. */
  children?: ReactNode;
};

/**
 * Pull-to-refresh tinted with the student's faculty colour.
 *
 * ScrollView and FlatList clone the `refreshControl` element, injecting the scrollable as
 * `children` (and a `style`), so every remaining prop must be forwarded or the list disappears.
 */
export function BrandRefreshControl(props: BrandRefreshControlProps) {
  const brand = useBrand();

  return (
    <RefreshControl
      progressBackgroundColor={colors.background.elevated}
      {...props}
      colors={[brand.primary]}
      tintColor={brand.primary}
    />
  );
}
