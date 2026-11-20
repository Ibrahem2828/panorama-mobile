import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { PaginatedResult } from '../pagination';
import type {
  StoreBrand,
  StoreCart,
  StoreCategory,
  StoreCheckoutRequest,
  StoreOrder,
  StoreOrderSummary,
  StoreProductCard,
  StoreProductDetail,
  StoreProductsQuery,
  StoreReview,
  StoreReviewInput,
} from '../storeTypes';

export function listBrands(authToken: string) {
  return apiClient.get<StoreBrand[]>(endpoints.store.brands, { authToken });
}

export function listCategories(authToken: string) {
  return apiClient.get<StoreCategory[]>(endpoints.store.categories, { authToken });
}

export function listProducts(query: StoreProductsQuery, authToken: string) {
  return apiClient.get<PaginatedResult<StoreProductCard>>(endpoints.store.products, {
    authToken,
    query: { ...query },
  });
}

export function getProduct(productId: string | number, authToken: string) {
  return apiClient.get<StoreProductDetail>(endpoints.store.productDetail(productId), {
    authToken,
  });
}

export function listReviews(productId: string | number, page: number, authToken: string) {
  return apiClient.get<PaginatedResult<StoreReview>>(endpoints.store.reviews(productId), {
    authToken,
    query: { page },
    noCache: true,
  });
}

export function getMyReview(productId: string | number, authToken: string) {
  return apiClient.get<StoreReview>(endpoints.store.myReview(productId), {
    authToken,
    noCache: true,
  });
}

export function createReview(
  productId: string | number,
  input: { rating: number; text?: string },
  authToken: string,
) {
  return apiClient.post<StoreReview, { rating: number; text?: string }>(
    endpoints.store.reviews(productId),
    input,
    { authToken },
  );
}

export function updateMyReview(
  productId: string | number,
  input: StoreReviewInput,
  authToken: string,
) {
  return apiClient.patch<StoreReview, StoreReviewInput>(
    endpoints.store.myReview(productId),
    input,
    { authToken },
  );
}

export function getCart(authToken: string) {
  return apiClient.get<StoreCart>(endpoints.store.cart, { authToken, noCache: true });
}

export function addCartItem(variant: number, quantity: number, authToken: string) {
  return apiClient.post<StoreCart, { variant: number; quantity: number }>(
    endpoints.store.cartItems,
    { variant, quantity },
    { authToken },
  );
}

export function setCartItemQuantity(itemId: string | number, quantity: number, authToken: string) {
  return apiClient.patch<StoreCart, { quantity: number }>(
    endpoints.store.cartItem(itemId),
    { quantity },
    { authToken },
  );
}

export function removeCartItem(itemId: string | number, authToken: string) {
  return apiClient.delete<StoreCart>(endpoints.store.cartItem(itemId), { authToken });
}

export function clearCart(authToken: string) {
  return apiClient.delete<StoreCart>(endpoints.store.cart, { authToken });
}

export function checkout(
  request: StoreCheckoutRequest,
  authToken: string,
  idempotencyKey?: string,
) {
  return apiClient.post<StoreOrder, StoreCheckoutRequest>(endpoints.store.checkout, request, {
    authToken,
    idempotencyKey,
  });
}

export function listOrders(page: number, authToken: string, status?: string) {
  return apiClient.get<PaginatedResult<StoreOrderSummary>>(endpoints.store.orders, {
    authToken,
    query: { page, status },
    noCache: true,
  });
}

export function getOrder(orderId: string | number, authToken: string) {
  return apiClient.get<StoreOrder>(endpoints.store.orderDetail(orderId), {
    authToken,
    noCache: true,
  });
}

export function cancelOrder(
  orderId: string | number,
  reason: string | undefined,
  authToken: string,
) {
  return apiClient.post<StoreOrder, { reason?: string }>(
    endpoints.store.cancelOrder(orderId),
    reason ? { reason } : {},
    { authToken },
  );
}
