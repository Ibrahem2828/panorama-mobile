import { getPrintOrderStatusArtwork } from '../printOrderStatusArtwork';

describe('getPrintOrderStatusArtwork', () => {
  it('maps every order status family to an artwork', () => {
    expect(getPrintOrderStatusArtwork('pending')).toBe('printingPending');
    expect(getPrintOrderStatusArtwork('accepted')).toBe('printingPending');
    expect(getPrintOrderStatusArtwork('printing')).toBe('printingProcessing');
    expect(getPrintOrderStatusArtwork('ready')).toBe('printingReady');
    expect(getPrintOrderStatusArtwork('delivered')).toBe('printingCompleted');
    expect(getPrintOrderStatusArtwork('rejected')).toBe('printingCancelled');
    expect(getPrintOrderStatusArtwork('canceled')).toBe('printingCancelled');
  });
});
