jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { apiBaseUrl: 'https://api.example.com' } } },
}));

import { ApiClientError, resetIdempotencyKeys, runIdempotentAction } from '../../../api';
import { buildProductsQuery, checkoutFingerprint, storeImageUrl } from '../services';
import { intentFromPushData } from '../../notifications/services/notificationPrefs';

describe('product query', () => {
  it('sends only what is set', () => {
    expect(
      buildProductsQuery({
        search: '  ',
        filters: { brand: null, category: null, inStock: false, ordering: 'popular' },
        currency: 'SYP',
      }),
    ).toEqual({
      page: undefined,
      search: undefined,
      brand: undefined,
      category: undefined,
      in_stock: undefined,
      ordering: 'popular',
      currency: 'SYP',
    });
    expect(
      buildProductsQuery({
        search: ' قلم ',
        filters: { brand: 2, category: 3, inStock: true, ordering: 'price_asc' },
        currency: 'USD',
        page: 2,
      }),
    ).toMatchObject({
      search: 'قلم',
      brand: 2,
      category: 3,
      in_stock: true,
      ordering: 'price_asc',
      page: 2,
    });
  });
});

describe('store picture URLs', () => {
  it('keeps the path and joins it to the configured API address', () => {
    expect(storeImageUrl('http://evil.example/api/v1/store/images/5/?v=1&variant=thumb')).toBe(
      'https://api.example.com/api/v1/store/images/5/?v=1&variant=thumb',
    );
    expect(storeImageUrl('/api/v1/store/brands/3/logo/?v=9')).toBe(
      'https://api.example.com/api/v1/store/brands/3/logo/?v=9',
    );
  });

  it('refuses anything that is not a store picture', () => {
    expect(storeImageUrl('https://x.test/media/a.png')).toBeNull();
    expect(storeImageUrl('/api/v1/store/cart/')).toBeNull();
    expect(storeImageUrl(null)).toBeNull();
  });
});

describe('checkout retry', () => {
  beforeEach(() => resetIdempotencyKeys());
  const cart = {
    items: [{ variant: { id: 1 }, quantity: 2 }],
  } as unknown as Parameters<typeof checkoutFingerprint>[0];

  it('re-sends the same key after a network failure and a new one after a rejection', async () => {
    const keys: string[] = [];
    const fingerprint = checkoutFingerprint(cart, 'SYP', '');
    const attempt = (error?: ApiClientError) => async (key: string) => {
      keys.push(key);
      if (error) throw error;
      return 'ok';
    };

    await expect(
      runIdempotentAction(
        'c',
        fingerprint,
        attempt(new ApiClientError({ code: 'NETWORK_ERROR', message: 'x' })),
      ),
    ).rejects.toBeTruthy();
    await runIdempotentAction('c', fingerprint, attempt());
    expect(keys[1]).toBe(keys[0]);

    await expect(
      runIdempotentAction(
        'c',
        fingerprint,
        attempt(
          new ApiClientError({
            code: 'CONFLICT',
            status: 409,
            message: 'x',
            errorCode: 'INSUFFICIENT_STOCK',
          }),
        ),
      ),
    ).rejects.toBeTruthy();
    await runIdempotentAction('c', fingerprint, attempt());
    expect(keys[3]).not.toBe(keys[2]);
  });
});

describe('store push routing', () => {
  it('opens the order named by the push', () => {
    expect(
      intentFromPushData({ category: 'printing', kind: 'store_order_status', store_order_id: 12 }),
    ).toEqual({ kind: 'storeOrder', orderId: '12' });
  });
});
