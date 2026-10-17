export type TimelineStepKey = 'submitted' | 'review' | 'decision';
export type TimelineStepState = 'done' | 'current' | 'upcoming' | 'attention';
export type TimelineOutcome = 'none' | 'pending' | 'approved' | 'attention';

export type TimelineStep = { key: TimelineStepKey; state: TimelineStepState };

/** Collapses the backend status into what the timeline needs to show. */
export function toTimelineOutcome(status: string): TimelineOutcome {
  switch (status) {
    case 'approved':
      return 'approved';
    case 'pending':
      return 'pending';
    case 'rejected':
    case 'needs_update':
      return 'attention';
    default:
      return 'none';
  }
}

/** submitted -> under review -> decision (approved or needs an updated card). */
export function buildVerificationTimeline(status: string): TimelineStep[] {
  switch (toTimelineOutcome(status)) {
    case 'pending':
      return [
        { key: 'submitted', state: 'done' },
        { key: 'review', state: 'current' },
        { key: 'decision', state: 'upcoming' },
      ];
    case 'approved':
      return [
        { key: 'submitted', state: 'done' },
        { key: 'review', state: 'done' },
        { key: 'decision', state: 'done' },
      ];
    case 'attention':
      return [
        { key: 'submitted', state: 'done' },
        { key: 'review', state: 'done' },
        { key: 'decision', state: 'attention' },
      ];
    default:
      return [
        { key: 'submitted', state: 'current' },
        { key: 'review', state: 'upcoming' },
        { key: 'decision', state: 'upcoming' },
      ];
  }
}
