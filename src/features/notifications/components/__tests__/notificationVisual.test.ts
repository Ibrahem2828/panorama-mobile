import { getNotificationVisual } from '../notificationVisual';

describe('getNotificationVisual', () => {
  it('maps notification types to icons', () => {
    expect(getNotificationVisual('printing').icon).toBe('printer');
    expect(getNotificationVisual('group').icon).toBe('users');
    expect(getNotificationVisual('verification').tone).toBe('success');
  });

  it('falls back to the announcement icon', () => {
    expect(getNotificationVisual(undefined).icon).toBe('megaphone');
    expect(getNotificationVisual('system').icon).toBe('megaphone');
  });
});
