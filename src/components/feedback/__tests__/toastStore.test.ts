import { showToast, useToastStore } from '../toastStore';

beforeEach(() => {
  jest.useFakeTimers();
  useToastStore.getState().hide();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('toast store', () => {
  it('shows a message and hides it by itself', () => {
    showToast('تم الحفظ');

    expect(useToastStore.getState()).toMatchObject({ message: 'تم الحفظ', tone: 'success' });

    jest.advanceTimersByTime(3600);

    expect(useToastStore.getState().message).toBeNull();
  });

  it('replaces the current message and restarts the timer', () => {
    showToast('الأولى');
    const firstId = useToastStore.getState().id;
    jest.advanceTimersByTime(3000);
    showToast('الثانية', { tone: 'error', durationMs: 1000 });

    expect(useToastStore.getState()).toMatchObject({ message: 'الثانية', tone: 'error' });
    expect(useToastStore.getState().id).toBeGreaterThan(firstId);

    jest.advanceTimersByTime(1100);

    expect(useToastStore.getState().message).toBeNull();
  });

  it('can be hidden early', () => {
    showToast('مرحبا');
    useToastStore.getState().hide();

    expect(useToastStore.getState().message).toBeNull();
  });
});
