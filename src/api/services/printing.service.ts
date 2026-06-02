import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ApiListParams, CreatePrintOrderRequest, EmptyResponse, PrintOrder } from '../types';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';

export function createPrintOrder(
  request: CreatePrintOrderRequest | FormData,
  authToken?: string | null,
) {
  return apiClient.post<PrintOrder, CreatePrintOrderRequest | FormData>(
    endpoints.printing.createOrder,
    request,
    { authToken },
  );
}

export function listMyPrintOrders(params?: ApiListParams, authToken?: string | null) {
  return apiClient.get<PaginatedResult<PrintOrder>>(endpoints.printing.myOrders, {
    authToken,
    query: toPaginationQuery(params),
  });
}

export function getPrintOrderDetail(orderId: string | number, authToken?: string | null) {
  return apiClient.get<PrintOrder>(endpoints.printing.orderDetail(orderId), {
    authToken,
  });
}

export function cancelPrintOrder(orderId: string | number, authToken?: string | null) {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.printing.cancelOrder(orderId),
    {},
    { authToken },
  );
}
