import { ar } from '../../../i18n';
import {
  getAnnouncementIcon,
  getStudentStatusView,
  isFreshAnnouncement,
} from '../services/homePresentation';

const NOW = Date.parse('2026-05-10T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

describe('isFreshAnnouncement', () => {
  it('is fresh within three days of the start date', () => {
    expect(isFreshAnnouncement({ start_date: new Date(NOW - 2 * DAY).toISOString() }, NOW)).toBe(
      true,
    );
  });

  it('falls back to created_at and expires after the window', () => {
    expect(isFreshAnnouncement({ created_at: new Date(NOW - 5 * DAY).toISOString() }, NOW)).toBe(
      false,
    );
    expect(isFreshAnnouncement({ created_at: new Date(NOW - DAY).toISOString() }, NOW)).toBe(true);
  });

  it('ignores missing or malformed dates', () => {
    expect(isFreshAnnouncement({}, NOW)).toBe(false);
    expect(isFreshAnnouncement({ created_at: 'not-a-date' }, NOW)).toBe(false);
  });
});

describe('getAnnouncementIcon', () => {
  it('maps known types and defaults to megaphone', () => {
    expect(getAnnouncementIcon('urgent')).toBe('alert');
    expect(getAnnouncementIcon('عاجل')).toBe('alert');
    expect(getAnnouncementIcon('exam')).toBe('calendar');
    expect(getAnnouncementIcon('general')).toBe('megaphone');
    expect(getAnnouncementIcon(undefined)).toBe('megaphone');
  });
});

describe('getStudentStatusView', () => {
  const base = {
    profileComplete: true,
    verificationStatus: 'pending',
    hasProfileState: true,
    hasVerificationState: true,
  };

  it('hides while loading and when verified', () => {
    expect(
      getStudentStatusView({ ...base, hasVerificationState: false }, ar.home.studentStatus).visible,
    ).toBe(false);
    expect(
      getStudentStatusView({ ...base, verificationStatus: 'approved' }, ar.home.studentStatus)
        .visible,
    ).toBe(false);
  });

  it('asks to complete the profile first', () => {
    const view = getStudentStatusView({ ...base, profileComplete: false }, ar.home.studentStatus);
    expect(view.visible).toBe(true);
    expect(view.variant).toBe('warning');
  });

  it('shows pending, rejected and needs-update states', () => {
    expect(getStudentStatusView(base, ar.home.studentStatus).variant).toBe('info');
    expect(
      getStudentStatusView({ ...base, verificationStatus: 'rejected' }, ar.home.studentStatus)
        .variant,
    ).toBe('error');
    expect(
      getStudentStatusView({ ...base, verificationStatus: 'needs_update' }, ar.home.studentStatus)
        .icon,
    ).toBe('upload');
  });
});
