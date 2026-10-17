import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { PaginatedResult } from '../pagination';
import { toPaginationQuery } from '../pagination';
import type {
  ApiListParams,
  CreatePrintOrderRequest,
  EmptyResponse,
  FileAccessTicket,
  PrintConversion,
  PrintOrder,
  PrintPickupLocation,
  PrintQuoteRequest,
  PrintQuoteResponse,
} from '../types';
import type { UploadProgress } from '../uploadTransport';

/** Uploads restart this stall timer on every progress event, so it is not a cap on the upload. */
export const PRINT_UPLOAD_STALL_TIMEOUT_MS = 60_000;

export type PrintUploadOptions = {
  signal?: AbortSignal;
  onUploadProgress?: (progress: UploadProgress) => void;
};

/** A JSON body when every item is an existing file, multipart when a local file is attached. */
export type PrintRequestBody<TJson> = TJson | FormData;

function uploadRequestOptions(authToken: string, options?: PrintUploadOptions) {
  return {
    authToken,
    timeoutMs: PRINT_UPLOAD_STALL_TIMEOUT_MS,
    signal: options?.signal,
    onUploadProgress: options?.onUploadProgress,
  };
}

export function quotePrintOrder(
  request: PrintRequestBody<PrintQuoteRequest>,
  authToken: string,
  options?: PrintUploadOptions,
) {
  return apiClient.post<PrintQuoteResponse, PrintRequestBody<PrintQuoteRequest>>(
    endpoints.printing.quote,
    request,
    uploadRequestOptions(authToken, options),
  );
}
/** Uploads a Word/PowerPoint file; the server converts it to PDF (it may answer `pending` for slow files). */
export function convertPrintDocument(
  form: FormData,
  authToken: string,
  options?: PrintUploadOptions,
) {
  return apiClient.post<PrintConversion, FormData>(
    endpoints.printing.convert,
    form,
    uploadRequestOptions(authToken, options),
  );
}
export function getPrintConversion(conversionId: string, authToken: string) {
  return apiClient.get<PrintConversion>(endpoints.printing.convertDetail(conversionId), {
    authToken,
  });
}
export function listPickupLocations(authToken: string) {
  return apiClient.get<PrintPickupLocation[]>(endpoints.printing.pickupLocations, { authToken });
}
export function createPrintOrder(
  request: PrintRequestBody<CreatePrintOrderRequest>,
  authToken: string,
  idempotencyKey?: string,
  options?: PrintUploadOptions,
) {
  return apiClient.post<PrintOrder, PrintRequestBody<CreatePrintOrderRequest>>(
    endpoints.printing.createOrder,
    request,
    { ...uploadRequestOptions(authToken, options), idempotencyKey },
  );
}
export function listMyPrintOrders(authToken: string, params?: ApiListParams & { status?: string }) {
  return apiClient.get<PaginatedResult<PrintOrder>>(endpoints.printing.myOrders, {
    authToken,
    query: { ...toPaginationQuery(params), status: params?.status },
  });
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
export function requestPrintItemAccessTicket(itemId: string | number, authToken: string) {
  return apiClient.post<FileAccessTicket, Record<string, never>>(
    endpoints.printing.itemAccessTicket(itemId),
    {},
    { authToken },
  );
}
