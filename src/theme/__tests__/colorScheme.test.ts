const mockGetItem = jest.fn();
const mockGetColorScheme = jest.fn();

jest.mock('expo-secure-store', () => ({
  getItem: (...args: unknown[]) => mockGetItem(...args),
  setItem: jest.fn(),
}));
jest.mock('react-native', () => ({
  Appearance: { getColorScheme: () => mockGetColorScheme() },
}));

function load() {
  let mod: typeof import('../colorScheme');
  jest.isolateModules(() => {
    mod = require('../colorScheme');
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return mod!;
}

describe('colour scheme resolution', () => {
  beforeEach(() => {
    mockGetItem.mockReset();
    mockGetColorScheme.mockReset();
  });

  it('defaults to the system scheme', () => {
    mockGetItem.mockReturnValue(null);
    mockGetColorScheme.mockReturnValue('dark');
    const { themePreference, resolvedScheme } = load();
    expect(themePreference).toBe('system');
    expect(resolvedScheme).toBe('dark');
  });

  it('falls back to light when the system reports nothing', () => {
    mockGetItem.mockReturnValue(null);
    mockGetColorScheme.mockReturnValue(null);
    expect(load().resolvedScheme).toBe('light');
  });

  it('honours an explicit preference over the system scheme', () => {
    mockGetItem.mockReturnValue('light');
    mockGetColorScheme.mockReturnValue('dark');
    expect(load().resolvedScheme).toBe('light');

    mockGetItem.mockReturnValue('dark');
    mockGetColorScheme.mockReturnValue('light');
    expect(load().resolvedScheme).toBe('dark');
  });

  it('ignores garbage and survives storage errors', () => {
    mockGetItem.mockReturnValue('purple');
    mockGetColorScheme.mockReturnValue('dark');
    expect(load().themePreference).toBe('system');

    mockGetItem.mockImplementation(() => {
      throw new Error('keystore unavailable');
    });
    expect(load().themePreference).toBe('system');
  });
});
