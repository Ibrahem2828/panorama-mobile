import { create } from 'zustand';

export type ToastTone = 'success' | 'error' | 'info';

type ToastState = {
  /** Changes on every call so the host can restart its animation for a repeated message. */
  id: number;
  message: string | null;
  tone: ToastTone;
  show: (message: string, options?: { tone?: ToastTone; durationMs?: number }) => void;
  hide: () => void;
};

const DEFAULT_DURATION_MS = 3500;

let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/** One message at a time, auto-hiding. The host (ToastHost) is mounted once, above every screen. */
export const useToastStore = create<ToastState>((set) => ({
  id: 0,
  message: null,
  tone: 'success',

  show(message, options) {
    clearTimer();
    set((state) => ({ id: state.id + 1, message, tone: options?.tone ?? 'success' }));
    timer = setTimeout(() => {
      timer = null;
      set({ message: null });
    }, options?.durationMs ?? DEFAULT_DURATION_MS);
  },

  hide() {
    clearTimer();
    set({ message: null });
  },
}));

export function showToast(
  message: string,
  options?: { tone?: ToastTone; durationMs?: number },
): void {
  useToastStore.getState().show(message, options);
}
