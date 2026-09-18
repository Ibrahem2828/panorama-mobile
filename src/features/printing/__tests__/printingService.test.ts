jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {
        apiBaseUrl: 'https://api.example.com',
        wsBaseUrl: 'wss://api.example.com',
      },
    },
  },
}));
import { ar } from '../../../i18n/locales/ar';
import { en } from '../../../i18n/locales/en';
import {
  buildCreatePrintOrderRequest,
  canCancelPrintOrder,
  getPrintOrderStatusPresentation,
  validatePrintDraft,
} from '../services/printingService';
import type { PrintDraft, PrintOrder } from '../types';

const draft: PrintDraft = {
  sourceFileId: 7,
  sourceFileTitle: 'المحاضرة الأولى',
  copies: 2,
  colorMode: 'black_white',
  paperSize: 'a4',
  sides: 'double',
  binding: 'spiral',
  pickupLocationId: 3,
  userNotes: 'يرجى التدقيق',
};

describe('printing contract', () => {
  it('sends options but never sends a client-computed price', () => {
    const request = buildCreatePrintOrderRequest(draft);
    expect(request).toEqual({
      items: [
        {
          source_file: 7,
          copies: 2,
          color_mode: 'black_white',
          paper_size: 'a4',
          sides: 'double',
          binding: 'spiral',
        },
      ],
      pickup_location: 3,
      user_notes: 'يرجى التدقيق',
    });
    expect(request).not.toHaveProperty('total_price');
  });

  it('rejects a draft without a source file', () => {
    expect(
      validatePrintDraft({ ...draft, sourceFileId: null }, ar.printing).sourceFileId,
    ).toBeTruthy();
  });

  it('limits cancellation to non-terminal workflow states', () => {
    const base: PrintOrder = { id: 1, status: 'submitted', items: [] };
    expect(canCancelPrintOrder({ ...base, status: 'under_review' })).toBe(true);
    expect(canCancelPrintOrder({ ...base, status: 'printing' })).toBe(false);
    expect(canCancelPrintOrder({ ...base, status: 'delivered' })).toBe(false);
  });

  it('maps a backend status through whichever catalog it is given', () => {
    expect(getPrintOrderStatusPresentation('ready', ar.printing, ar.common.unknown).label).toBe(
      ar.printing.status.ready.label,
    );
    expect(getPrintOrderStatusPresentation('ready', en.printing, en.common.unknown).label).toBe(
      en.printing.status.ready.label,
    );
  });

  it('falls back to the raw status when the backend sends an unmapped one', () => {
    const presentation = getPrintOrderStatusPresentation(
      'brand_new',
      ar.printing,
      ar.common.unknown,
    );
    expect(presentation.label).toBe('brand_new');
    expect(presentation.variant).toBe('neutral');
  });
});
