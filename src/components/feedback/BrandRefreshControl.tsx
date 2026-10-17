import { RefreshControl } from 'react-native';

import { useBrand } from '../../theme';

type BrandRefreshControlProps = {
  refreshing: boolean;
  onRefresh: () => void;
};

/** Pull-to-refresh tinted with the student's faculty colour. */
export function BrandRefreshControl({ refreshing, onRefresh }: BrandRefreshControlProps) {
  const brand = useBrand();
  return (
    <RefreshControl
      colors={[brand.primary]}
      onRefresh={onRefresh}
      progressBackgroundColor="#FFFFFF"
      refreshing={refreshing}
      tintColor={brand.primary}
    />
  );
}
