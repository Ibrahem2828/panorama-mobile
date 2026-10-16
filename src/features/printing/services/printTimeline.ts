import type {
  PrintOrder,
  PrintOrderProgress,
  PrintProgressStep,
  PrintStatusHistoryEntry,
} from '../types';

/** The normal life of an order, in order. Cancelled and rejected end it early. */
export const PRINT_HAPPY_PATH = [
  'submitted',
  'under_review',
  'accepted',
  'printing',
  'ready',
  'delivered',
] as const;

function happyIndex(status: string | null | undefined): number {
  return (PRINT_HAPPY_PATH as readonly string[]).indexOf(status ?? '');
}

/** History oldest first, so callers can decide how to present it. */
export function sortStatusHistory(history: PrintStatusHistoryEntry[] | undefined) {
  return [...(history ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

/**
 * The timeline shown to the student: newest first. An order the backend returned without
 * any history still gets its creation as the first entry.
 */
export function buildStatusTimeline(order: PrintOrder): PrintStatusHistoryEntry[] {
  const history = sortStatusHistory(order.status_history);

  if (history.length === 0 && order.created_at) {
    return [{ id: 'created', new_status: 'submitted', created_at: order.created_at }];
  }

  return history.reverse();
}

/**
 * Where the order is on the happy path. For a cancelled or rejected order the steps show
 * how far it got before it stopped.
 */
export function getOrderProgress(order: PrintOrder): PrintOrderProgress {
  const terminal =
    order.status === 'cancelled' || order.status === 'rejected' ? order.status : null;
  const reached = terminal
    ? Math.max(
        0,
        ...sortStatusHistory(order.status_history).map((entry) => happyIndex(entry.new_status)),
      )
    : happyIndex(order.status);
  const lastIndex = PRINT_HAPPY_PATH.length - 1;

  const steps: PrintProgressStep[] = PRINT_HAPPY_PATH.map((status, index) => {
    if (terminal) {
      return { status, state: index <= reached ? 'done' : 'todo' };
    }

    if (reached < 0) {
      return { status, state: index === 0 ? 'current' : 'todo' };
    }

    if (index < reached || (index === reached && reached === lastIndex)) {
      return { status, state: 'done' };
    }

    return { status, state: index === reached ? 'current' : 'todo' };
  });

  return { steps, terminal };
}

/** Orders that can still change, so the detail screen keeps refreshing them. */
export function isPrintOrderActive(status: string): boolean {
  return ['submitted', 'under_review', 'accepted', 'printing', 'ready'].includes(status);
}
