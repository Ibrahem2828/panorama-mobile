import type { StoreCurrency, StoreOrdering, StoreProductsQuery } from '../../../api';

export type StoreFilterValues = {
  brand: number | null;
  category: number | null;
  inStock: boolean;
  ordering: StoreOrdering;
};

/** The product list request for a search text, the chosen filters and currency; unset values are left out. */
export function buildProductsQuery(input: {
  search: string;
  filters: StoreFilterValues;
  currency: StoreCurrency;
  page?: number;
}): StoreProductsQuery {
  const search = input.search.trim();

  return {
    page: input.page,
    search: search || undefined,
    brand: input.filters.brand ?? undefined,
    category: input.filters.category ?? undefined,
    in_stock: input.filters.inStock ? true : undefined,
    ordering: input.filters.ordering,
    currency: input.currency,
  };
}
