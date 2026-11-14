import type { StoreReview } from '../../../api';

export const REVIEW_TEXT_MAX = 1000;

export type ReviewUiState =
  /** Still loading the student's own review: show nothing yet. */
  | 'loading'
  /** The student has no picked-up order for this product: a short hint, no form. */
  | 'locked'
  /** May write a first review. */
  | 'write'
  /** Has a review that can still be edited once. */
  | 'edit'
  /** Has a review and the single edit was used. */
  | 'done';

/**
 * What the product page's review block offers.
 * - not eligible (`can_review` false) and no review of their own: locked
 * - eligible, no review yet: write
 * - has a review: edit while it was never edited, otherwise done
 */
export function reviewUiState(input: {
  canReview: boolean;
  mine: StoreReview | null;
  mineLoaded: boolean;
}): ReviewUiState {
  if (input.mine) return input.mine.edited ? 'done' : 'edit';
  if (!input.canReview) return 'locked';

  return input.mineLoaded ? 'write' : 'loading';
}

export function isValidRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/** Whether the form can be sent: a 1-5 rating, text within the limit; for an edit, something must have changed. */
export function canSubmitReview(input: {
  rating: number;
  text: string;
  original?: Pick<StoreReview, 'rating' | 'text'> | null;
}): boolean {
  if (!isValidRating(input.rating) || input.text.length > REVIEW_TEXT_MAX) return false;
  if (!input.original) return true;

  return input.rating !== input.original.rating || input.text.trim() !== input.original.text.trim();
}

/** `Ahmad` stays, anything longer than the first word is cut (the server already sends the first name only). */
export function reviewerName(author: string | null | undefined): string {
  return (author ?? '').trim().split(/\s+/u)[0] ?? '';
}
