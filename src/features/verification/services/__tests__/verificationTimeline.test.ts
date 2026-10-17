import { buildVerificationTimeline, toTimelineOutcome } from '../verificationTimeline';

const states = (status: string) => buildVerificationTimeline(status).map((s) => s.state);

describe('verification timeline', () => {
  it('maps each status', () => {
    expect(states('none')).toEqual(['current', 'upcoming', 'upcoming']);
    expect(states('pending')).toEqual(['done', 'current', 'upcoming']);
    expect(states('approved')).toEqual(['done', 'done', 'done']);
    expect(states('rejected')).toEqual(['done', 'done', 'attention']);
    expect(states('needs_update')).toEqual(['done', 'done', 'attention']);
  });

  it('treats unknown statuses as not submitted', () => {
    expect(toTimelineOutcome('weird')).toBe('none');
  });
});
