import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { PaginatedResult } from '../pagination';
import type {
  CreatePrintOrderRequest,
  EmptyResponse,
  PrintOrder,
  PrintPickupLocation,
  PrintQuoteRequest,
  PrintQuoteResponse,
} from '../types';

export function quotePrintOrder(request: PrintQuoteRequest, authToken: string) {
  return apiClient.post<PrintQuoteResponse, PrintQuoteRequest>(endpoints.printing.quote, request, {
    authToken,
  });
}
export function listPickupLocations(authToken: string) {
  return apiClient.get<PrintPickupLocation[]>(endpoints.printing.pickupLocations, { authToken });
}
export function createPrintOrder(request: CreatePrintOrderRequest, authToken: string) {
  return apiClient.post<PrintOrder, CreatePrintOrderRequest>(
    endpoints.printing.createOrder,
    request,
    { authToken },
  );
}
export function listMyPrintOrders(authToken: string) {
  return apiClient.get<PaginatedResult<PrintOrder>>(endpoints.printing.myOrders, { authToken });
}
export function getPrintOrderDetail(orderId: string | number, authToken: string) {
  return apiClient.get<PrintOrder>(endpoints.printing.orderDetail(orderId), { authToken });
}
export function cancelPrintOrder(orderId: string | number, authToken: string) {
  return apiClient.post<EmptyResponse, EmptyResponse>(
    endpoints.printing.cancelOrder(orderId),
    {},
    { authToken },
  );
}
