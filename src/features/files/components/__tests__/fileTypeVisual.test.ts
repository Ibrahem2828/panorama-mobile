import { getFileTypeVisual } from '../fileTypeVisual';

describe('getFileTypeVisual', () => {
  it('shows a lock for protected files whatever the type', () => {
    expect(getFileTypeVisual('pdf', true)).toEqual({ icon: 'lock', tone: 'warning' });
  });

  it('uses a type specific icon otherwise', () => {
    expect(getFileTypeVisual('pdf', false).tone).toBe('error');
    expect(getFileTypeVisual('image', false).icon).toBe('image');
    expect(getFileTypeVisual('unknown', false).icon).toBe('file');
  });
});
