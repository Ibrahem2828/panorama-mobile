import { formatBytes, percentOf } from '../formatBytes';

describe('formatBytes', () => {
  it('uses short units', () => {
    expect(formatBytes(0)).toBe('1 KB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(5.5 * 1024 * 1024)).toBe('5.5 MB');
    expect(formatBytes(250 * 1024 * 1024)).toBe('250 MB');
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    expect(formatBytes(-1)).toBe('0 KB');
  });

  it('computes a clamped percentage', () => {
    expect(percentOf(50, 200)).toBe(25);
    expect(percentOf(300, 200)).toBe(100);
    expect(percentOf(1, 0)).toBe(0);
  });
});
