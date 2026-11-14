/** Shapes of the stationery store API (`/api/v1/store/`). Prices are decimal strings; a currency the shop does not sell is null. */

export type StoreCurrency = 'SYP' | 'USD';

export type StorePriceMap = Record<StoreCurrency, string | null>;

export type StoreBrand = { id: number; name: string; logo_url: string | null };

export type StoreCategory = { id: number; name: string; slug: string };

export type StoreProductCard = {
  id: number;
  name: string;
  brand: { id: number; name: string } | null;
  category: StoreCategory | null;
  image_url: string | null;
  thumb_url: string | null;
  rating_avg: string | number;
  rating_count: number;
  price_from: StorePriceMap;
  in_stock: boolean;
};

export type StoreVariant = {
  id: number;
  sku: string;
  colour_name: string;
  colour_hex: string;
  size_label: string;
  prices: StorePriceMap;
  available: number;
  in_stock: boolean;
  max_per_order: number;
  image_id: number | null;
};

export type StoreProductImage = {
  id: number;
  url: string;
  thumb_url: string;
  alt_text: string;
  is_primary: boolean;
  variant: number | null;
};

export type StoreSpec = { label: string; value: string };

export type StoreProductDetail = StoreProductCard & {
  description: string;
  specs: StoreSpec[];
  prices: StorePriceMap;
  variants: StoreVariant[];
  images: StoreProductImage[];
  can_review: boolean;
};

export type StoreOrdering = 'popular' | 'newest' | 'rating' | 'price_asc' | 'price_desc';

export type StoreProductsQuery = {
  page?: number;
  brand?: number;
  category?: number;
  search?: string;
  in_stock?: boolean;
  currency?: StoreCurrency;
  ordering?: StoreOrdering;
};

export type StoreReview = {
  id: number;
  rating: number;
  text: string;
  author: string;
  edited: boolean;
  created_at: string;
  updated_at: string;
};

export type StoreReviewInput = { rating?: number; text?: string };

export type StoreCartItem = {
  id: number;
  variant: {
    id: number;
    sku: string;
    colour_name: string;
    colour_hex: string;
    size_label: string;
  };
  product: { id: number; name: string; brand: string };
  quantity: number;
  prices: StorePriceMap;
  orderable: boolean;
  available: number;
  thumb_url: string | null;
};

export type StoreCartTotals = {
  subtotal: string;
  rounding_adjustment: string;
  total: string;
};

export type StoreCart = {
  items: StoreCartItem[];
  items_count: number;
  max_lines: number;
  totals: Record<StoreCurrency, StoreCartTotals | null>;
  payment: string;
};

export type StoreOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'cancelled';

export type StoreOrderSummary = {
  id: number;
  code: string;
  status: StoreOrderStatus;
  currency: StoreCurrency;
  total: string;
  items_count: number;
  created_at: string;
};

export type StoreOrderItem = {
  id: number;
  product: number | null;
  variant: number | null;
  name: string;
  brand_name: string;
  variant_label: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  thumb_url: string | null;
};

export type StoreOrderHistoryEntry = {
  old_status: string;
  new_status: StoreOrderStatus;
  note: string;
  created_at: string;
};

export type StoreOrder = StoreOrderSummary & {
  subtotal: string;
  rounding_adjustment: string;
  notes: string;
  cancel_reason: string;
  cancelled_by_customer: boolean;
  confirmed_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  cancelled_at: string | null;
  can_cancel: boolean;
  payment: string;
  items: StoreOrderItem[];
  history: StoreOrderHistoryEntry[];
};

export type StoreCheckoutRequest = { currency: StoreCurrency; notes?: string };
