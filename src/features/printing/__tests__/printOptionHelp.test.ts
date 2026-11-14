jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

const mockStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    }),
  },
}));

import {
  PRINT_HELP_REFRESH_MS,
  PRINT_HELP_STORAGE_KEY,
  PRINT_HELP_TOPICS,
  asyncPrintHelpStorage,
  buildHelpIndex,
  extraHelpTopic,
  hasHelp,
  helpEntries,
  isHelpFresh,
  isSafeImageUrl,
  normalizeHelpItems,
  resolveHelp,
  syncPrintHelp,
  type PrintHelpCache,
  type PrintHelpStorage,
} from '../services/printOptionHelp';

function raw(partial: Record<string, unknown>) {
  return {
    id: 1,
    topic: 'print_size',
    key: '',
    title: 'Title',
    body: 'Body',
    image_url: null,
    image_caption: '',
    sort_order: 0,
    updated_at: '2026-11-01T00:00:00Z',
    ...partial,
  };
}

function memoryStorage(initial: PrintHelpCache | null = null) {
  let saved = initial;
  const storage: PrintHelpStorage & { writes: number } = {
    writes: 0,
    read: async () => saved,
    write: async (cache) => {
      storage.writes += 1;
      saved = cache;
    },
  };

  return storage;
}

describe('lookup by topic and key', () => {
  const index = buildHelpIndex(
    normalizeHelpItems([
      raw({ id: 3, key: 'A3', title: 'A3', sort_order: 2 }),
      raw({ id: 2, key: 'A4', title: 'A4', sort_order: 1 }),
      raw({ id: 1, key: '', title: 'Paper size' }),
      raw({ id: 4, topic: 'binding', key: 'spiral', title: 'Spiral' }),
      raw({ id: 5, topic: extraHelpTopic('paper-type'), key: '', title: 'Paper type' }),
    ]),
  );

  it('lists a topic with its topic-level entry first, then by sort order', () => {
    expect(helpEntries(index, PRINT_HELP_TOPICS.size).map((entry) => entry.key)).toEqual([
      '',
      'A4',
      'A3',
    ]);
  });

  it('finds the entry of the chosen option', () => {
    expect(resolveHelp(index, 'print_size', 'A3')?.id).toBe(3);
    expect(resolveHelp(index, 'binding', 'spiral')?.title).toBe('Spiral');
  });

  it('falls back to the topic-level entry when the option has none', () => {
    expect(resolveHelp(index, 'print_size', 'A5')?.id).toBe(1);
    expect(resolveHelp(index, 'print_size', '')?.id).toBe(1);
    expect(resolveHelp(index, 'print_size')?.id).toBe(1);
  });

  it('opens the first entry when the topic has no topic-level help and the option has none', () => {
    expect(resolveHelp(index, 'binding', 'staple')?.id).toBe(4);
  });

  it('is generic for sectioned extras', () => {
    expect(hasHelp(index, extraHelpTopic('paper-type'))).toBe(true);
    expect(resolveHelp(index, 'extra:paper-type', 'glossy')?.title).toBe('Paper type');
    expect(hasHelp(index, extraHelpTopic('other'))).toBe(false);
  });

  it('gives nothing for a topic without help, so no button is drawn', () => {
    expect(resolveHelp(index, 'cover', 'red')).toBeNull();
    expect(hasHelp(index, 'cover')).toBe(false);
  });
});

describe('empty and malformed input', () => {
  it('drops entries with neither a title nor a body, and entries without a topic', () => {
    const items = normalizeHelpItems([
      raw({ id: 1, title: '  ', body: '' }),
      raw({ id: 2, topic: '' }),
      raw({ id: 3, title: '', body: 'Only a body' }),
      null,
      'text',
      raw({ id: 4, title: 'Only a title', body: '' }),
    ]);

    expect(items.map((item) => item.id)).toEqual([3, 4]);
  });

  it('tolerates anything that is not a list', () => {
    expect(normalizeHelpItems(undefined)).toEqual([]);
    expect(normalizeHelpItems({})).toEqual([]);
    expect(hasHelp(buildHelpIndex([]), 'print_size')).toBe(false);
  });

  it('only loads http(s) and server-relative illustration URLs', () => {
    expect(isSafeImageUrl('https://x.test/a.png')).toBe(true);
    expect(isSafeImageUrl('/media/a.png')).toBe(true);
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeImageUrl('file:///a.png')).toBe(false);
    expect(isSafeImageUrl(null)).toBe(false);
    expect(isSafeImageUrl('')).toBe(false);
  });
});

describe('freshness', () => {
  it('reuses what it holds within the refresh window and asks again after it', () => {
    expect(isHelpFresh(null, 1000)).toBe(false);
    expect(isHelpFresh(1000, 1000 + PRINT_HELP_REFRESH_MS - 1)).toBe(true);
    expect(isHelpFresh(1000, 1000 + PRINT_HELP_REFRESH_MS)).toBe(false);
  });
});

describe('syncPrintHelp (cache and updated_at)', () => {
  const answer = (updatedAt: string | null, ids: number[]) => ({
    updated_at: updatedAt,
    count: ids.length,
    items: ids.map((id) => raw({ id, key: `k${id}` })),
  });

  it('stores a fresh answer', async () => {
    const storage = memoryStorage();
    const result = await syncPrintHelp(
      { fetchHelp: async () => answer('t1', [1, 2]), storage },
      null,
    );

    expect(result.fetched).toBe(true);
    expect(result.cache?.items).toHaveLength(2);
    expect(storage.writes).toBe(1);
  });

  it('keeps the saved entries and does not rewrite them when updated_at is unchanged', async () => {
    const storage = memoryStorage();
    const first = await syncPrintHelp(
      { fetchHelp: async () => answer('t1', [1, 2]), storage },
      null,
    );
    const second = await syncPrintHelp(
      { fetchHelp: async () => answer('t1', [1, 2]), storage },
      first.cache,
    );

    expect(second.cache?.items).toEqual(first.cache?.items);
    expect(storage.writes).toBe(1);
  });

  it('replaces the saved entries when updated_at changes', async () => {
    const storage = memoryStorage();
    const first = await syncPrintHelp({ fetchHelp: async () => answer('t1', [1]), storage }, null);
    const second = await syncPrintHelp(
      { fetchHelp: async () => answer('t2', [1, 2, 3]), storage },
      first.cache,
    );

    expect(second.cache?.items).toHaveLength(3);
    expect(second.cache?.updatedAt).toBe('t2');
    expect(storage.writes).toBe(2);
  });

  it('serves the saved copy when the request fails (offline), and never throws', async () => {
    const saved: PrintHelpCache = {
      updatedAt: 't1',
      items: normalizeHelpItems([raw({ id: 9 })]),
      savedAt: 1,
    };
    const storage = memoryStorage(saved);
    const result = await syncPrintHelp(
      {
        fetchHelp: async () => {
          throw new Error('offline');
        },
        storage,
      },
      null,
    );

    expect(result.fetched).toBe(false);
    expect(result.cache).toEqual(saved);
    expect(storage.writes).toBe(0);
  });

  it('gives no help (and no error) when there is no saved copy and the request fails', async () => {
    const result = await syncPrintHelp(
      {
        fetchHelp: async () => {
          throw new Error('500');
        },
        storage: memoryStorage(),
      },
      null,
    );

    expect(result).toEqual({ cache: null, fetched: false });
  });

  it('treats a malformed answer as an empty list without crashing', async () => {
    const result = await syncPrintHelp(
      { fetchHelp: async () => 'not json', storage: memoryStorage() },
      null,
    );

    expect(result.cache?.items).toEqual([]);
  });
});

describe('AsyncStorage persistence', () => {
  beforeEach(() => mockStore.clear());

  it('round-trips the cache and re-validates entries on read', async () => {
    const cache: PrintHelpCache = {
      updatedAt: 't1',
      items: normalizeHelpItems([raw({ id: 1 })]),
      savedAt: 5,
    };

    await asyncPrintHelpStorage.write(cache);

    expect(await asyncPrintHelpStorage.read()).toEqual(cache);
  });

  it('ignores a corrupted saved copy', async () => {
    mockStore.set(PRINT_HELP_STORAGE_KEY, '{oops');

    expect(await asyncPrintHelpStorage.read()).toBeNull();
  });
});
