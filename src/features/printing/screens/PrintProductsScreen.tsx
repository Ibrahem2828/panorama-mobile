import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  BrandRefreshControl,
  EmptyState,
  Icon,
  SkeletonList,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { radius, spacing, useBrand } from '../../../theme';
import { formatPrintMoney } from '../services';
import { usePrintingStore } from '../store';
import type { PrintProduct } from '../types';

type Props = NativeStackScreenProps<PrintingStackParamList, 'PrintProducts'>;

/** Ready-made printed products (notebooks and the like): specification and price are fixed by the shop. */
export function PrintProductsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const brand = useBrand();
  const products = usePrintingStore((state) => state.products);
  const isLoading = usePrintingStore((state) => state.isLoadingProducts);
  const loadProducts = usePrintingStore((state) => state.loadProducts);
  const draft = usePrintingStore((state) => state.draft);
  const addItem = usePrintingStore((state) => state.addItem);
  const updateItem = usePrintingStore((state) => state.updateItem);
  const copy = t.printing.products;

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  function order(product: PrintProduct) {
    const source = { kind: 'product', product } as const;
    const first = draft.items[0];

    // A fresh order starts with one empty line: the product takes it instead of adding a second line.
    if (draft.items.length === 1 && first && !first.source) {
      updateItem(first.key, { source });
    } else {
      addItem(source);
    }

    navigation.navigate(PrintingRoutes.CreatePrintOrder);
  }

  return (
    <AppScreen
      contentContainerStyle={styles.content}
      refreshControl={
        <BrandRefreshControl onRefresh={() => void loadProducts()} refreshing={isLoading} />
      }
      scroll
    >
      <Stack gap="lg">
        <AppHeader
          onBack={() => navigation.goBack()}
          showBack
          subtitle={copy.subtitle}
          title={copy.title}
        />
        {isLoading && products.length === 0 ? <SkeletonList count={3} /> : null}
        {!isLoading && products.length === 0 ? (
          <EmptyState message={copy.emptyMessage} title={copy.emptyTitle} />
        ) : null}
        {products.map((product) => (
          <AppCard key={product.id} variant="elevated">
            <Stack gap="md">
              <Stack direction="horizontal" gap="md">
                {product.image_url ? (
                  <Image
                    accessibilityIgnoresInvertColors
                    resizeMode="cover"
                    source={{ uri: product.image_url }}
                    style={styles.image}
                  />
                ) : (
                  <View
                    style={[styles.image, styles.imageIcon, { backgroundColor: brand.primarySoft }]}
                  >
                    <Icon color={brand.primary} name="book" size={30} />
                  </View>
                )}
                <Stack gap="xs" style={styles.body}>
                  <AppText variant="title">{product.name}</AppText>
                  {product.description ? (
                    <AppText color="secondary" numberOfLines={3} variant="bodySmall">
                      {product.description}
                    </AppText>
                  ) : null}
                  <AppText color="muted" variant="caption">
                    {copy.fixedSpec(product.pages_count, product.paper_size)}
                  </AppText>
                </Stack>
              </Stack>
              <Stack align="center" direction="horizontal" gap="md" justify="space-between">
                <AppText color="brand" variant="h3">
                  {formatPrintMoney(product.price, product.currency) ?? String(product.price)}
                </AppText>
                <AppButton onPress={() => order(product)} title={copy.order} />
              </Stack>
            </Stack>
          </AppCard>
        ))}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  image: { width: 84, height: 84, borderRadius: radius.md },
  imageIcon: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
});
