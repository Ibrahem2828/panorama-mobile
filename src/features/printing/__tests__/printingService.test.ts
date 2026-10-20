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
  canCancelPrintOrder,
  formatMoneyAmount,
  formatPrintMoney,
  formatRounding,
  getPrintOrderItemFileLabel,
  getPrintOrderStatusPresentation,
} from '../services/printingService';
import type { PrintOrder } from '../types';

describe('printing service helpers', () => {
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

  it('formats money the way a student reads it', () => {
    expect(formatMoneyAmount('15000.00')).toBe('15,000');
    expect(formatMoneyAmount('1250.5')).toBe('1,250.5');
    expect(formatMoneyAmount(null)).toBeNull();
    expect(formatMoneyAmount('abc')).toBe('abc');
    expect(formatPrintMoney('300', 'SYP')).toBe('300 ل.س');
    expect(formatPrintMoney('300', null)).toBe('300 ل.س');
    expect(formatPrintMoney('15000.00', 'SYP')).toBe('15,000 ل.س');
    expect(formatPrintMoney('12.3', 'USD')).toBe('$12.30');
    expect(formatPrintMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatPrintMoney(null, 'USD')).toBeNull();
  });

  it('names an item by its library title, original name, or a generic uploaded label', () => {
    const t = ar.printing;
    expect(getPrintOrderItemFileLabel({ copies: 1, source_file_title: 'محاضرة' }, t)).toBe(
      'محاضرة',
    );
    expect(getPrintOrderItemFileLabel({ copies: 1, original_file_name: 'scan.jpg' }, t)).toBe(
      'scan.jpg',
    );
    expect(getPrintOrderItemFileLabel({ copies: 1, has_uploaded_file: true }, t)).toBe(
      t.order.uploadedFile,
    );
    expect(getPrintOrderItemFileLabel({ copies: 1 }, t)).toBe(t.order.fallbackFileTitle);
  });
});

describe('formatRounding', () => {
  it('shows how much a total was rounded, with its sign and currency', () => {
    expect(formatRounding('6.00', 'SYP')).toBe('+6 ل.س');
    expect(formatRounding(-4, 'SYP')).toBe('-4 ل.س');
    expect(formatRounding('-0.02', 'USD')).toBe('-$0.02');
  });

  it('shows nothing when the total was not rounded or the value is unusable', () => {
    for (const value of ['0.00', 0, '', null, undefined, 'abc']) {
      expect(formatRounding(value, 'SYP')).toBeNull();
    }
  });
});
