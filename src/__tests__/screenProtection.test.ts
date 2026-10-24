import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { orderedOverlays, useOverlayStore } from '../components/overlay/overlayStore';
import { isScreenCaptureBlocked } from '../utils/screenCapturePolicy';

const SRC = path.resolve(__dirname, '..');

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);

    if (statSync(full).isDirectory()) {
      return name === '__tests__' || name === 'node_modules' ? [] : sourceFiles(full);
    }

    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('screenshot protection', () => {
  it('blocks every build except a non-production build that explicitly opts out', () => {
    expect(isScreenCaptureBlocked({ appEnv: 'production', allowScreenshots: false })).toBe(true);
    expect(isScreenCaptureBlocked({ appEnv: 'production', allowScreenshots: true })).toBe(true);
    expect(isScreenCaptureBlocked({ appEnv: 'preview', allowScreenshots: false })).toBe(true);
    expect(isScreenCaptureBlocked({ appEnv: 'development', allowScreenshots: false })).toBe(true);
    expect(isScreenCaptureBlocked({ appEnv: 'development', allowScreenshots: true })).toBe(false);
  });

  it('protects the whole app from the root provider', () => {
    const providers = readFileSync(path.join(SRC, 'providers', 'AppProviders.tsx'), 'utf8');

    expect(providers).toMatch(/useSecureScreen\('app'\)/);
    expect(providers).toMatch(/<OverlayHost \/>/);
  });

  it('never opens a React Native Modal: it is a separate Android window that the protection does not cover', () => {
    const offenders = sourceFiles(SRC).filter((file) => {
      const text = readFileSync(file, 'utf8');

      return /import\s*\{[^}]*\bModal\b[^}]*\}\s*from\s*'react-native'/.test(text);
    });

    expect(offenders.map((file) => path.relative(SRC, file))).toEqual([]);
  });
});

describe('overlay store', () => {
  beforeEach(() => useOverlayStore.setState({ entries: {} }));

  const entry = {
    node: null,
    onRequestClose: () => undefined,
    animation: 'none' as const,
    transparent: true,
  };

  it('keeps the order in which overlays opened, even when one is updated', () => {
    const { upsert } = useOverlayStore.getState();
    upsert('first', entry);
    upsert('second', entry);
    upsert('first', entry);

    expect(orderedOverlays(useOverlayStore.getState().entries).map(([id]) => id)).toEqual([
      'first',
      'second',
    ]);
  });

  it('removes a closed overlay and ignores an unknown id', () => {
    const { upsert, remove } = useOverlayStore.getState();
    upsert('only', entry);
    remove('missing');
    expect(Object.keys(useOverlayStore.getState().entries)).toEqual(['only']);
    remove('only');
    expect(useOverlayStore.getState().entries).toEqual({});
  });
});
