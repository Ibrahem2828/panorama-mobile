import type { TranslationCatalog } from '../../../i18n';
import type { StoreErrorInfo } from './storeErrors';

type StoreCatalog = TranslationCatalog['store'];

/** The sentence shown to the student for a failed store action. Server text is never shown. */
export function storeErrorMessage(info: StoreErrorInfo, t: StoreCatalog): string {
  const copy = t.errors;

  switch (info.kind) {
    case 'insufficientStock':
      return copy.insufficientStock(info.available);
    case 'quantityLimit':
      return copy.quantityLimit(info.maxPerOrder);
    case 'variantUnavailable':
      return copy.variantUnavailable;
    case 'priceUnavailable':
      return copy.priceUnavailable;
    case 'cartEmpty':
      return copy.cartEmpty;
    case 'cartFull':
      return copy.cartFull;
    case 'cartItemMissing':
      return copy.cartItemMissing;
    case 'tooManyOpenOrders':
      return copy.tooManyOpenOrders;
    case 'orderNotCancellable':
      return copy.orderNotCancellable;
    case 'reviewNotEligible':
      return copy.reviewNotEligible;
    case 'reviewExists':
      return copy.reviewExists;
    case 'reviewEditLimit':
      return copy.reviewEditLimit;
    case 'rateLimited':
      return copy.rateLimited;
    case 'offline':
      return copy.offline;
    case 'network':
      return copy.network;
    case 'unauthorized':
      return copy.unauthorized;
    case 'notFound':
      return copy.notFound;
    default:
      return copy.generic;
  }
}
