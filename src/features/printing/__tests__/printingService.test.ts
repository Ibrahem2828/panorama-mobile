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
    expect(validatePrintDraft({ ...draft, sourceFileId: null }).sourceFileId).toBeTruthy();
  });

  it('limits cancellation to non-terminal workflow states', () => {
    const base: PrintOrder = { id: 1, status: 'submitted', items: [] };
    expect(canCancelPrintOrder({ ...base, status: 'under_review' })).toBe(true);
    expect(canCancelPrintOrder({ ...base, status: 'printing' })).toBe(false);
    expect(canCancelPrintOrder({ ...base, status: 'delivered' })).toBe(false);
  });

  it('maps backend statuses to Arabic presentation', () => {
    expect(getPrintOrderStatusPresentation('ready').label).toBe('جاهز للاستلام');
  });
});
