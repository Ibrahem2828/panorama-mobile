import type { ReactNode } from 'react';
import { create } from 'zustand';

export type OverlayAnimation = 'none' | 'fade' | 'slide';

export type OverlayEntry = {
  node: ReactNode;
  onRequestClose: () => void;
  animation: OverlayAnimation;
  transparent: boolean;
  /** Stacking order: a later overlay sits above an earlier one. */
  order: number;
};

type OverlayState = {
  entries: Record<string, OverlayEntry>;
  upsert: (id: string, entry: Omit<OverlayEntry, 'order'>) => void;
  remove: (id: string) => void;
};

let counter = 0;

/** What every open AppModal wants drawn on top of the app. The host (OverlayHost) renders it inside the main window. */
export const useOverlayStore = create<OverlayState>((set) => ({
  entries: {},
  upsert: (id, entry) =>
    set((state) => {
      const existing = state.entries[id];
      counter += 1;
      return {
        entries: { ...state.entries, [id]: { ...entry, order: existing?.order ?? counter } },
      };
    }),
  remove: (id) =>
    set((state) => {
      if (!(id in state.entries)) {
        return state;
      }
      const { [id]: _removed, ...rest } = state.entries;
      return { entries: rest };
    }),
}));

export function orderedOverlays(entries: Record<string, OverlayEntry>): [string, OverlayEntry][] {
  return Object.entries(entries).sort(([, first], [, second]) => first.order - second.order);
}
