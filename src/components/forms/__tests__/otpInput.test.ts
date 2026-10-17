import { activeOtpIndex, isOtpComplete, otpBoxes, sanitizeOtp } from '../otpInput';

describe('otpInput helpers', () => {
  it('keeps digits only and caps the length (paste support)', () => {
    expect(sanitizeOtp('12 34-56789')).toBe('123456');
    expect(sanitizeOtp('abc')).toBe('');
  });

  it('converts Arabic-Indic digits', () => {
    expect(sanitizeOtp('١٢٣٤٥٦')).toBe('123456');
    expect(sanitizeOtp('۱۲۳')).toBe('123');
  });

  it('detects a complete code', () => {
    expect(isOtpComplete('123456')).toBe(true);
    expect(isOtpComplete('12345')).toBe(false);
    expect(isOtpComplete('1234', 4)).toBe(true);
  });

  it('auto-advances the active box and stops at the last one', () => {
    expect(activeOtpIndex('')).toBe(0);
    expect(activeOtpIndex('123')).toBe(3);
    expect(activeOtpIndex('123456')).toBe(5);
  });

  it('splits the value into boxes', () => {
    expect(otpBoxes('12', 4)).toEqual(['1', '2', '', '']);
  });
});
