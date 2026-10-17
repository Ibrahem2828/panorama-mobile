import {
  buildStatusTimeline,
  getOrderProgress,
  isPrintOrderActive,
} from '../services/printTimeline';
import type { PrintOrder } from '../types';

function order(status: string, history: Array<[string, string]> = []): PrintOrder {
  return {
    id: 1,
    status,
    items: [],
    created_at: '2026-05-01T08:00:00Z',
    status_history: history.map(([newStatus, createdAt], index) => ({
      id: index + 1,
      new_status: newStatus,
      created_at: createdAt,
    })),
  };
}

describe('getOrderProgress', () => {
  it('marks earlier steps done and the current one active', () => {
    const progress = getOrderProgress(order('printing'));

    expect(progress.terminal).toBeNull();
    expect(progress.steps.map((step) => step.state)).toEqual([
      'done',
      'done',
      'done',
      'current',
      'todo',
      'todo',
    ]);
  });

  it('treats delivered as fully done', () => {
    expect(getOrderProgress(order('delivered')).steps.every((s) => s.state === 'done')).toBe(true);
  });

  it('starts at the first step for an unknown status', () => {
    expect(getOrderProgress(order('mystery')).steps[0]?.state).toBe('current');
  });

  it('shows how far a cancelled order got', () => {
    const progress = getOrderProgress(
      order('cancelled', [
        ['submitted', '2026-05-01T08:00:00Z'],
        ['under_review', '2026-05-01T09:00:00Z'],
        ['cancelled', '2026-05-01T10:00:00Z'],
      ]),
    );

    expect(progress.terminal).toBe('cancelled');
    expect(progress.steps.map((step) => step.state)).toEqual([
      'done',
      'done',
      'todo',
      'todo',
      'todo',
      'todo',
    ]);
  });

  it('shows only the first step for a rejected order without history', () => {
    const progress = getOrderProgress(order('rejected'));

    expect(progress.terminal).toBe('rejected');
    expect(progress.steps.filter((step) => step.state === 'done')).toHaveLength(1);
  });
});

describe('buildStatusTimeline', () => {
  it('lists history newest first', () => {
    const timeline = buildStatusTimeline(
      order('accepted', [
        ['accepted', '2026-05-01T10:00:00Z'],
        ['submitted', '2026-05-01T08:00:00Z'],
      ]),
    );

    expect(timeline.map((entry) => entry.new_status)).toEqual(['accepted', 'submitted']);
  });

  it('falls back to the creation time when there is no history', () => {
    const timeline = buildStatusTimeline(order('submitted'));

    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.id).toBe('created');
  });

  it('is empty when there is nothing to show', () => {
    expect(buildStatusTimeline({ id: 2, status: 'submitted', items: [] })).toEqual([]);
  });
});

describe('isPrintOrderActive', () => {
  it('keeps polling only while the order can still change', () => {
    expect(isPrintOrderActive('printing')).toBe(true);
    expect(isPrintOrderActive('ready')).toBe(true);
    expect(isPrintOrderActive('delivered')).toBe(false);
    expect(isPrintOrderActive('cancelled')).toBe(false);
  });
});
