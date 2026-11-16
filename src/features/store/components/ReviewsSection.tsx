import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { storeService, type StoreReview } from '../../../api';
import {
  AppButton,
  AppCard,
  AppText,
  AppTextInput,
  Icon,
  useToastStore,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, spacing } from '../../../theme';
import { useAuthStore } from '../../auth/store';
import {
  REVIEW_TEXT_MAX,
  canSubmitReview,
  formatRatingValue,
  formatStoreDateTime,
  parseStoreError,
  reviewUiState,
  reviewerName,
  storeErrorMessage,
} from '../services';
import { RatingStars, STAR_COLOR } from './RatingStars';

type ReviewsSectionProps = {
  productId: number | string;
  canReview: boolean;
  ratingAverage: string | number;
  ratingCount: number;
  /** The product's rating changed (a review was posted or edited): the page reloads its summary. */
  onChanged: () => void;
};

function StarInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const { t } = useTranslation();

  return (
    <View
      accessibilityLabel={t.store.reviews.ratingLabel}
      accessibilityRole="radiogroup"
      style={styles.stars}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          accessibilityLabel={t.store.reviews.ratingStar(star)}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === star, checked: value === star }}
          hitSlop={2}
          key={star}
          onPress={() => onChange(star)}
          style={styles.starButton}
        >
          <Icon
            color={star <= value ? STAR_COLOR : colors.border.strong}
            filled={star <= value}
            name="star"
            size={32}
            strokeWidth={1.6}
          />
        </Pressable>
      ))}
    </View>
  );
}

function ReviewItem({ review }: { review: StoreReview }) {
  const { t, locale } = useTranslation();
  const when = formatStoreDateTime(review.created_at, locale);

  return (
    <View style={styles.review}>
      <View style={styles.reviewHead}>
        <AppText variant="bodySmall" weight="700">
          {reviewerName(review.author)}
        </AppText>
        <RatingStars size={13} value={review.rating} />
        {review.edited ? (
          <AppText color="muted" variant="caption">
            {t.store.reviews.editedNote}
          </AppText>
        ) : null}
      </View>
      {review.text ? (
        <AppText color="secondary" variant="bodySmall">
          {review.text}
        </AppText>
      ) : null}
      {when ? (
        <AppText color="muted" variant="caption">
          {when}
        </AppText>
      ) : null}
    </View>
  );
}

/** Rating summary, the list of reviews and — once the student collected the product — the form to write or edit theirs. */
export function ReviewsSection({
  productId,
  canReview,
  ratingAverage,
  ratingCount,
  onChanged,
}: ReviewsSectionProps) {
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const showToast = useToastStore((state) => state.show);
  const copy = t.store.reviews;
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [mine, setMine] = useState<StoreReview | null>(null);
  const [mineLoaded, setMineLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadList = useCallback(
    async (page: number) => {
      if (!accessToken) return;
      try {
        const result = await storeService.listReviews(productId, page, accessToken);
        setReviews((previous) => (page === 1 ? result.results : [...previous, ...result.results]));
        setNextPage(result.next ? page + 1 : null);
        setLoadFailed(false);
      } catch {
        setLoadFailed(true);
      } finally {
        setLoaded(true);
      }
    },
    [accessToken, productId],
  );

  const loadMine = useCallback(async () => {
    if (!accessToken) return;
    try {
      setMine(await storeService.getMyReview(productId, accessToken));
    } catch {
      // 404 REVIEW_NOT_FOUND (none yet) and any other failure both mean "nothing to show".
      setMine(null);
    } finally {
      setMineLoaded(true);
    }
  }, [accessToken, productId]);

  useEffect(() => {
    void loadList(1);
    void loadMine();
  }, [loadList, loadMine]);

  const ui = reviewUiState({ canReview, mine, mineLoaded });
  const formOpen = ui === 'write' || (ui === 'edit' && editing);

  function startEditing() {
    setRating(mine?.rating ?? 0);
    setText(mine?.text ?? '');
    setMessage(null);
    setEditing(true);
  }

  async function submit() {
    if (!accessToken || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const body = { rating, ...(text.trim() ? { text: text.trim() } : {}) };
      const saved = mine
        ? await storeService.updateMyReview(productId, { rating, text: text.trim() }, accessToken)
        : await storeService.createReview(productId, body, accessToken);
      showToast(mine ? copy.saved : copy.posted);
      setMine(saved);
      setEditing(false);
      await loadList(1);
      onChanged();
    } catch (error) {
      const info = parseStoreError(error);
      setMessage(storeErrorMessage(info, t.store));
      // Someone else's device already used the edit, or the review exists: show the real state.
      if (info.kind === 'reviewExists' || info.kind === 'reviewEditLimit') void loadMine();
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <AppText accessibilityRole="header" variant="title">
        {copy.title}
      </AppText>
      <View style={styles.summary}>
        <AppText variant="h2">{formatRatingValue(ratingAverage)}</AppText>
        <View style={styles.summaryRight}>
          <RatingStars size={18} value={ratingAverage} />
          <AppText color="muted" variant="caption">
            {ratingCount > 0
              ? copy.summary(formatRatingValue(ratingAverage), ratingCount)
              : copy.none}
          </AppText>
        </View>
      </View>

      {ui === 'locked' ? (
        <AppText color="secondary" variant="bodySmall">
          {copy.lockedHint}
        </AppText>
      ) : null}

      {formOpen ? (
        <AppCard variant="outlined">
          <View style={styles.form}>
            <AppText variant="label" weight="700">
              {mine ? copy.edit : copy.write}
            </AppText>
            <StarInput onChange={setRating} value={rating} />
            <AppTextInput
              accessibilityLabel={copy.textLabel}
              helperText={copy.charactersLeft(REVIEW_TEXT_MAX - text.length)}
              maxLength={REVIEW_TEXT_MAX}
              multiline
              onChangeText={setText}
              placeholder={copy.textPlaceholder}
              value={text}
            />
            {mine ? (
              <AppText color="muted" variant="caption">
                {copy.editOnceHint}
              </AppText>
            ) : null}
            {message ? (
              <AppText accessibilityLiveRegion="polite" color="error" variant="bodySmall">
                {message}
              </AppText>
            ) : null}
            <View style={styles.formActions}>
              <AppButton
                disabled={!canSubmitReview({ rating, text, original: mine })}
                loading={busy}
                onPress={() => void submit()}
                title={mine ? copy.save : copy.submit}
              />
              {mine ? (
                <AppButton
                  disabled={busy}
                  onPress={() => setEditing(false)}
                  title={copy.cancel}
                  variant="ghost"
                />
              ) : null}
            </View>
          </View>
        </AppCard>
      ) : null}

      {ui === 'edit' && !editing ? (
        <AppCard variant="muted">
          <View style={styles.form}>
            <AppText variant="label" weight="700">
              {copy.yourReview}
            </AppText>
            <RatingStars size={16} value={mine?.rating ?? 0} />
            {mine?.text ? (
              <AppText color="secondary" variant="bodySmall">
                {mine.text}
              </AppText>
            ) : null}
            <AppButton onPress={startEditing} size="sm" title={copy.edit} variant="outline" />
            <AppText color="muted" variant="caption">
              {copy.editOnceHint}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      {ui === 'done' ? (
        <AppCard variant="muted">
          <View style={styles.form}>
            <AppText variant="label" weight="700">
              {copy.yourReview}
            </AppText>
            <RatingStars size={16} value={mine?.rating ?? 0} />
            {mine?.text ? (
              <AppText color="secondary" variant="bodySmall">
                {mine.text}
              </AppText>
            ) : null}
            <AppText color="muted" variant="caption">
              {copy.doneHint}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      {loaded && loadFailed && reviews.length === 0 ? (
        <View style={styles.formActions}>
          <AppText color="secondary" variant="bodySmall">
            {copy.loadFailed}
          </AppText>
          <AppButton
            onPress={() => void loadList(1)}
            size="sm"
            title={t.common.retry}
            variant="outline"
          />
        </View>
      ) : null}

      <View style={styles.list}>
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </View>
      {nextPage !== null ? (
        <AppButton
          onPress={() => void loadList(nextPage)}
          size="sm"
          title={copy.loadMore}
          variant="outline"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryRight: { gap: 2 },
  stars: { flexDirection: 'row', gap: 2 },
  starButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  form: { gap: spacing.md },
  formActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
  list: { gap: spacing.md },
  review: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
});
