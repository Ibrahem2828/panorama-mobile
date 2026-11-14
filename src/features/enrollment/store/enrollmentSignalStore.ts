import { create } from 'zustand';

/**
 * A tiny "something changed" counter. The push handler bumps it when an enrollment decision arrives while the app is open,
 * and the enrollment screen reads it to refetch straight away instead of waiting for the next poll.
 */
type EnrollmentSignalState = {
  version: number;
  bump: () => void;
};

export const useEnrollmentSignalStore = create<EnrollmentSignalState>((set) => ({
  version: 0,
  bump: () => set((state) => ({ version: state.version + 1 })),
}));
