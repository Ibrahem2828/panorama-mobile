import {
  MAX_PRINT_ITEMS,
  MAX_REQUEST_UPLOAD_BYTES,
  MAX_UPLOAD_BYTES,
  buildOrderBody,
  buildQuoteBody,
  createEmptyDraft,
  draftSignature,
  hasUploads,
  newCartItem,
  orderSignature,
  toLocalFile,
  totalCopies,
  uploadPercent,
  validateDraft,
  validateUploadCandidate,
} from '../services/printDraft';
import type { PrintCartItem, PrintDraft } from '../types';

function libraryItem(id: number, overrides: Partial<PrintCartItem> = {}): PrintCartItem {
  return {
    ...newCartItem({ kind: 'library', id, title: `ملف ${id}` }),
    ...overrides,
  };
}

function uploadItem(size: number | null = 1000): PrintCartItem {
  return newCartItem({
    kind: 'upload',
    file: { uri: 'file:///cache/a.jpg', name: 'a.jpg', size, mimeType: 'image/jpeg' },
  });
}

function draftOf(items: PrintCartItem[], overrides: Partial<PrintDraft> = {}): PrintDraft {
  return {
    items,
    pickupLocationId: 3,
    userNotes: ' يرجى التدقيق ',
    currency: 'SYP',
    ...overrides,
  };
}

describe('validateUploadCandidate', () => {
  it('accepts supported images within the size limit', () => {
    expect(
      validateUploadCandidate({ name: 'a.JPG', size: 1024, mimeType: 'image/jpeg' }),
    ).toBeNull();
    expect(validateUploadCandidate({ name: 'a.webp', size: null, mimeType: null })).toBeNull();
    expect(
      validateUploadCandidate({ name: 'a.png', size: MAX_UPLOAD_BYTES, mimeType: 'image/png' }),
    ).toBeNull();
  });

  it('rejects unsupported types, oversized and empty files', () => {
    expect(validateUploadCandidate({ name: 'a.exe', size: 10, mimeType: null })).toBe('type');
    expect(validateUploadCandidate({ name: 'a.heic', size: 10, mimeType: 'image/heic' })).toBe(
      'type',
    );
    expect(validateUploadCandidate({ name: 'a.jpg', size: 10, mimeType: 'text/html' })).toBe(
      'type',
    );
    expect(
      validateUploadCandidate({ name: 'a.jpg', size: MAX_UPLOAD_BYTES + 1, mimeType: null }),
    ).toBe('size');
    expect(validateUploadCandidate({ name: 'a.jpg', size: 0, mimeType: null })).toBe('empty');
  });

  it('accepts octet-stream mime types because the extension decides', () => {
    expect(
      validateUploadCandidate({ name: 'a.pdf', size: 10, mimeType: 'application/octet-stream' }),
    ).toBeNull();
  });
});

describe('toLocalFile', () => {
  it('keeps a good name and size', () => {
    expect(
      toLocalFile({
        uri: 'file:///x/photo.png',
        fileName: 'photo.png',
        fileSize: 99,
        mimeType: 'image/png',
      }),
    ).toEqual({ uri: 'file:///x/photo.png', name: 'photo.png', size: 99, mimeType: 'image/png' });
  });

  it('derives a name and extension when the platform gives none', () => {
    const file = toLocalFile({ uri: 'content://media/42', mimeType: 'image/webp' });

    expect(file.name.endsWith('.webp')).toBe(true);
    expect(file.size).toBeNull();
    expect(file.mimeType).toBe('image/webp');
  });

  it('falls back to jpg for an extensionless name without a mime type', () => {
    expect(toLocalFile({ uri: 'file:///x/IMG_001', fileName: 'IMG_001' }).name).toBe('IMG_001.jpg');
  });
});

describe('validateDraft', () => {
  it('flags items without a source and invalid copies', () => {
    const draft = draftOf([newCartItem(), libraryItem(1, { copies: 0 })]);
    const result = validateDraft(draft);

    expect(result.valid).toBe(false);
    expect(result.items[0]).toEqual({ source: true });
    expect(result.items[1]).toEqual({ copies: true });
  });

  it('enforces the item count and the shared upload budget', () => {
    expect(validateDraft(draftOf([])).count).toBe(true);
    expect(
      validateDraft(
        draftOf(Array.from({ length: MAX_PRINT_ITEMS + 1 }, (_, i) => libraryItem(i + 1))),
      ).count,
    ).toBe(true);

    const big = [uploadItem(MAX_UPLOAD_BYTES), uploadItem(MAX_UPLOAD_BYTES)];

    expect(MAX_UPLOAD_BYTES * 2).toBeGreaterThan(MAX_REQUEST_UPLOAD_BYTES);
    expect(validateDraft(draftOf(big)).uploadsTooLarge).toBe(true);
  });

  it('accepts a complete draft', () => {
    expect(validateDraft(draftOf([libraryItem(1), uploadItem()])).valid).toBe(true);
    expect(validateDraft(createEmptyDraft()).valid).toBe(false);
  });
});

describe('request bodies', () => {
  it('sends JSON without any price when every item is a library file', () => {
    const body = buildOrderBody(
      draftOf([libraryItem(7, { copies: 2, binding: 'spiral', sides: 'double_sided' })]),
    );

    expect(body).toEqual({
      currency: 'SYP',
      items: [
        {
          source_file: 7,
          copies: 2,
          color_mode: 'black_white',
          paper_size: 'A4',
          sides: 'double_sided',
          binding: 'spiral',
        },
      ],
      pickup_location: 3,
      user_notes: 'يرجى التدقيق',
    });
    expect(body).not.toHaveProperty('total_price');
  });

  it('switches to multipart with the DRF list naming once an item is an upload', () => {
    const body = buildOrderBody(draftOf([libraryItem(7), uploadItem()]));

    expect(body).toBeInstanceOf(FormData);

    const form = body as FormData;

    expect(form.get('items[0]source_file')).toBe('7');
    expect(form.has('items[1]uploaded_file')).toBe(true);
    expect(form.get('items[1]copies')).toBe('1');
    expect(form.get('items[1]color_mode')).toBe('black_white');
    expect(form.get('pickup_location')).toBe('3');
    expect(form.get('user_notes')).toBe('يرجى التدقيق');
  });

  it('quotes without order-level fields and refuses an incomplete draft', () => {
    const quote = buildQuoteBody(draftOf([libraryItem(7)]));

    expect(quote).not.toHaveProperty('pickup_location');
    expect(() => buildQuoteBody(draftOf([newCartItem()]))).toThrow();
    expect(() => buildQuoteBody(draftOf([]))).toThrow();
  });
});

describe('signatures', () => {
  it('changes whenever something that affects the price changes', () => {
    const base = draftOf([libraryItem(1)]);
    const first = base.items[0] as PrintCartItem;
    const changed = draftOf([{ ...first, copies: 2 }]);

    expect(draftSignature(base)).toBe(draftSignature(draftOf([first])));
    expect(draftSignature(base)).not.toBe(draftSignature(changed));
  });

  it('ignores local item keys and includes the order-level fields only in the order signature', () => {
    const a = draftOf([libraryItem(1)]);
    const b = draftOf([libraryItem(1)]);

    expect(draftSignature(a)).toBe(draftSignature(b));
    expect(orderSignature(a)).toBe(orderSignature(b));
    expect(orderSignature(a)).not.toBe(orderSignature({ ...a, pickupLocationId: 4 }));
    expect(orderSignature(a)).not.toBe(orderSignature({ ...a, userNotes: 'x' }));
    expect(draftSignature(a)).toBe(draftSignature({ ...a, userNotes: 'x' }));
  });

  it('identifies an upload by uri and size', () => {
    expect(draftSignature(draftOf([uploadItem(10)]))).not.toBe(
      draftSignature(draftOf([uploadItem(11)])),
    );
  });
});

describe('small helpers', () => {
  it('sums copies and detects uploads', () => {
    const draft = draftOf([libraryItem(1, { copies: 2 }), uploadItem()]);

    expect(totalCopies(draft)).toBe(3);
    expect(hasUploads(draft)).toBe(true);
    expect(hasUploads(draftOf([libraryItem(1)]))).toBe(false);
  });

  it('turns bytes sent into a clamped percentage', () => {
    expect(uploadPercent(50, 200)).toBe(25);
    expect(uploadPercent(300, 200)).toBe(100);
    expect(uploadPercent(10, 0)).toBe(0);
    expect(uploadPercent(-5, 100)).toBe(0);
  });
});

describe('currency', () => {
  it('is included in the JSON quote and order bodies', () => {
    const quote = buildQuoteBody(draftOf([libraryItem(1)], { currency: 'USD' })) as {
      currency: string;
    };
    const order = buildOrderBody(draftOf([libraryItem(1)])) as { currency: string };

    expect(quote.currency).toBe('USD');
    expect(order.currency).toBe('SYP');
  });

  it('is included in multipart bodies', () => {
    const form = buildOrderBody(draftOf([uploadItem()], { currency: 'USD' })) as FormData;
    expect(form.get('currency')).toBe('USD');
  });

  it('changes the quote and order signatures', () => {
    const a = draftOf([libraryItem(1)]);
    const b = { ...a, currency: 'USD' as const };

    expect(draftSignature(a)).not.toBe(draftSignature(b));
    expect(orderSignature(a)).not.toBe(orderSignature(b));
  });

  it('defaults an empty draft to SYP', () => {
    expect(createEmptyDraft().currency).toBe('SYP');
    expect(createEmptyDraft('USD').currency).toBe('USD');
  });
});
