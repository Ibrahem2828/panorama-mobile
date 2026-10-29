/**
 * The decision behind the "unsaved changes" guard, kept free of React and navigation so it can be tested on its own.
 * `confirmDiscard` shows the dialog and calls `discard` only when the user chooses to leave.
 */
export type LeaveEvent = {
  preventDefault: () => void;
};

export function createLeaveHandler(options: {
  isDirty: () => boolean;
  confirmDiscard: (discard: () => void) => void;
}) {
  return (event: LeaveEvent, leave: () => void): void => {
    if (!options.isDirty()) {
      return;
    }

    event.preventDefault();
    options.confirmDiscard(leave);
  };
}
