import type { StoreOrder, StoreOrderHistoryEntry, StoreOrderStatus } from '../../../api';
import type { Locale } from '../../../i18n';

export const STORE_ORDER_FLOW = ['pending', 'confirmed', 'ready_for_pickup', 'picked_up'] as const;

export const STORE_ORDER_STATUSES: readonly StoreOrderStatus[] = [
  'pending',
  'confirmed',
  'ready_for_pickup',
  'picked_up',
  'cancelled',
];

export type StoreStatusVariant = 'warning' | 'info' | 'brand' | 'success' | 'neutral';

export type StoreStatusLabels = Record<StoreOrderStatus, { label: string; hint: string }>;

export type StoreStatusPresentation = {
  label: string;
  hint: string;
  variant: StoreStatusVariant;
};

const VARIANTS: Record<StoreOrderStatus, StoreStatusVariant> = {
  pending: 'warning',
  confirmed: 'info',
  ready_for_pickup: 'brand',
  picked_up: 'success',
  cancelled: 'neutral',
};

export function isKnownStoreStatus(status: unknown): status is StoreOrderStatus {
  return (STORE_ORDER_STATUSES as readonly unknown[]).includes(status);
}

/** Label, one-line "what happens next" and colour of a status; an unknown status keeps its raw text. */
export function storeStatusPresentation(
  status: string,
  labels: StoreStatusLabels,
  unknownLabel: string,
): StoreStatusPresentation {
  if (isKnownStoreStatus(status)) {
    return { ...labels[status], variant: VARIANTS[status] };
  }

  return { label: status || unknownLabel, hint: '', variant: 'neutral' };
}

/** An order the shop is still working on (the student can still be waiting for a status change). */
export function isStoreOrderActive(status: string): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'ready_for_pickup';
}

export function canCancelStoreOrder(order: Pick<StoreOrder, 'status' | 'can_cancel'>): boolean {
  return order.can_cancel && order.status === 'pending';
}

/** Newest first. An order with no history still shows its creation. */
export function storeTimeline(
  order: Pick<StoreOrder, 'history' | 'created_at'>,
): StoreOrderHistoryEntry[] {
  const history = [...(order.history ?? [])].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );

  if (history.length === 0 && order.created_at) {
    return [{ old_status: '', new_status: 'pending', note: '', created_at: order.created_at }];
  }

  return history.reverse();
}

export type StoreProgressStep = {
  status: (typeof STORE_ORDER_FLOW)[number];
  state: 'done' | 'current' | 'todo';
};

/** Where the order is on pending -> confirmed -> ready -> picked up; a cancelled order shows how far it got. */
export function storeProgress(order: Pick<StoreOrder, 'status' | 'history'>): StoreProgressStep[] {
  const flow = STORE_ORDER_FLOW as readonly string[];
  const cancelled = order.status === 'cancelled';
  const reached = cancelled
    ? Math.max(0, ...(order.history ?? []).map((entry) => flow.indexOf(entry.new_status)))
    : flow.indexOf(order.status);

  return STORE_ORDER_FLOW.map((status, index) => {
    if (cancelled) return { status, state: index <= reached ? 'done' : 'todo' };
    if (index < reached) return { status, state: 'done' };
    if (index === reached) return { status, state: status === 'picked_up' ? 'done' : 'current' };

    return { status, state: 'todo' };
  });
}

const DATE_LOCALES: Record<Locale, string> = { ar: 'ar-SY', en: 'en-GB' };

export function formatStoreDateTime(
  value: string | null | undefined,
  locale: Locale,
): string | null {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleString(DATE_LOCALES[locale], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

/** Whether a pushed status update concerns the store (`data.kind = store_order_status`). */
export function isStoreOrderPush(data: Record<string, unknown> | null | undefined): boolean {
  return data?.kind === 'store_order_status';
}

/** The order id a store push points at, only when it is a plain number. */
export function storeOrderIdFromPush(
  data: Record<string, unknown> | null | undefined,
): string | null {
  const value = data?.store_order_id;

  return typeof value === 'number' || (typeof value === 'string' && /^\d{1,12}$/u.test(value))
    ? String(value)
    : null;
}
