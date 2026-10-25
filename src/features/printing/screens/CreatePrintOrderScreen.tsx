import { useCallback, useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppButton,
  AppCard,
  AppHeader,
  AppScreen,
  AppText,
  AppTextInput,
  ChoiceChips,
  Icon,
  Stack,
} from '../../../components';
import { useTranslation } from '../../../i18n';
import { PrintingRoutes } from '../../../navigation/routes';
import type { PrintingStackParamList } from '../../../navigation/types';
import { colors, spacing, useBrand } from '../../../theme';
import {
  PrintItemCard,
  PrintPickupSelector,
  PrintStickyBar,
  UploadProgressCard,
} from '../components';
import { MAX_PRINT_ITEMS, hasUploads, totalCopies } from '../services';
import { isQuoteFresh, usePrintingStore } from '../store';

type Props = NativeStackScreenProps<PrintingStackParamList, 'CreatePrintOrder'>;

function StepIndicator({ current }: { current: 1 | 2 }) {
  const { t } = useTranslation();
  const brand = useBrand();
  const steps = [t.printing.create.stepConfigure, t.printing.create.stepSummary];

  return (
    <View style={styles.steps}>
      {steps.map((label, index) => {
        const number = index + 1;
        const active = number === current;
        const done = number < current;

        return (
          <View
            accessibilityLabel={`${t.printing.create.stepsLabel(number, steps.length)}: ${label}`}
            accessible
            key={label}
            style={styles.step}
          >
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: active || done ? brand.primary : colors.background.muted,
                  borderColor: active || done ? brand.primary : colors.border.default,
                },
              ]}
            >
              {done ? (
                <Icon color={brand.onPrimary} name="check" size={14} strokeWidth={3} />
              ) : (
                <AppText color={active ? 'inverse' : 'muted'} variant="caption" weight="700">
                  {String(number)}
                </AppText>
              )}
            </View>
            <AppText color={active ? 'brand' : 'muted'} variant="caption" weight="700">
              {label}
            </AppText>
            {index < steps.length - 1 ? <View style={styles.stepLine} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export function CreatePrintOrderScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const draft = usePrintingStore((state) => state.draft);
  const validation = usePrintingStore((state) => state.validation);
  const locations = usePrintingStore((state) => state.pickupLocations);
  const isLoadingLocations = usePrintingStore((state) => state.isLoadingPickupLocations);
  const pickupError = usePrintingStore((state) => state.pickupError);
  const transfer = usePrintingStore((state) => state.transfer);
  const isQuoting = usePrintingStore((state) => state.isQuoting);
  const draftError = usePrintingStore((state) => state.draftError);
  const addItem = usePrintingStore((state) => state.addItem);
  const removeItem = usePrintingStore((state) => state.removeItem);
  const updateItem = usePrintingStore((state) => state.updateItem);
  const prefillLibraryFile = usePrintingStore((state) => state.prefillLibraryFile);
  const setPickupLocation = usePrintingStore((state) => state.setPickupLocation);
  const setNotes = usePrintingStore((state) => state.setNotes);
  const setCurrency = usePrintingStore((state) => state.setCurrency);
  const loadStoredCurrency = usePrintingStore((state) => state.loadStoredCurrency);
  const calculateQuote = usePrintingStore((state) => state.calculateQuote);
  const cancelTransfer = usePrintingStore((state) => state.cancelTransfer);
  const resetDraft = usePrintingStore((state) => state.resetDraft);
  const loadConfiguration = usePrintingStore((state) => state.loadPrintingConfiguration);
  const { fileId, fileTitle } = route.params ?? {};
  const atLimit = draft.items.length >= MAX_PRINT_ITEMS;
  const hasContent =
    draft.items.some((item) => item.source !== null) || draft.userNotes.trim().length > 0;
  const showErrors = validation !== null;

  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);
  useEffect(() => {
    void loadStoredCurrency();
  }, [loadStoredCurrency]);
  useEffect(() => {
    if (fileId !== undefined) {
      prefillLibraryFile(fileId, fileTitle ?? t.printing.library.unnamedFile(String(fileId)));
    }
  }, [fileId, fileTitle, prefillLibraryFile, t]);

  const handleCalculate = useCallback(async () => {
    // An unchanged draft already has its price: go straight to the summary.
    if (isQuoteFresh(usePrintingStore.getState())) {
      navigation.navigate(PrintingRoutes.PrintPriceSummary);
      return;
    }

    if (await calculateQuote()) {
      navigation.navigate(PrintingRoutes.PrintPriceSummary);
    }
  }, [calculateQuote, navigation]);

  const calculating = transfer && hasUploads(draft);

  return (
    <AppScreen horizontalPadding={false} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        style={styles.scroll}
      >
        <Stack gap="xl">
          <Stack gap="md">
            <AppHeader subtitle={t.printing.create.subtitle} title={t.printing.create.title} />
          </Stack>

          <StepIndicator current={1} />

          {fileId !== undefined ? (
            <AppCard variant="muted">
              <AppText color="secondary" variant="bodySmall">
                {t.printing.create.prefilledFile}
              </AppText>
            </AppCard>
          ) : null}

          <Stack gap="sm">
            <Stack align="center" direction="horizontal" gap="md" justify="space-between">
              <AppText variant="title">{t.printing.create.cartTitle}</AppText>
              <AppText color="muted" variant="caption">
                {t.printing.create.itemsCount(draft.items.length, MAX_PRINT_ITEMS)}
              </AppText>
            </Stack>
            <AppText color="secondary" variant="bodySmall">
              {t.printing.create.cartDescription(MAX_PRINT_ITEMS)}
            </AppText>
            {showErrors && validation?.count ? (
              <AppText color="error" variant="bodySmall">
                {t.printing.errors.noItems}
              </AppText>
            ) : null}
          </Stack>

          {draft.items.map((item, index) => (
            <PrintItemCard
              canRemove={draft.items.length > 1}
              index={index}
              item={item}
              key={item.key}
              onChange={updateItem}
              onRemove={removeItem}
              problems={validation?.items[index]}
              showErrors={showErrors}
            />
          ))}

          <Stack gap="xs">
            <AppButton
              disabled={atLimit || isQuoting}
              leftIcon={<Icon color={colors.text.secondary} name="plus" size={18} />}
              onPress={() => addItem()}
              title={t.printing.create.addItem}
              variant="outline"
            />
            {atLimit ? (
              <AppText color="muted" variant="caption">
                {t.printing.create.limitReached(MAX_PRINT_ITEMS)}
              </AppText>
            ) : null}
          </Stack>

          <PrintPickupSelector
            error={pickupError}
            isLoading={isLoadingLocations}
            locations={locations}
            onRetry={() => void loadConfiguration()}
            onSelect={setPickupLocation}
            selectedId={draft.pickupLocationId}
          />

          <AppTextInput
            helperText={t.printing.create.notesHelper}
            label={t.printing.create.notesLabel}
            maxLength={2000}
            multiline
            onChangeText={setNotes}
            placeholder={t.printing.create.notesPlaceholder}
            value={draft.userNotes}
          />

          <AppCard variant="muted">
            <Stack gap="xs">
              <AppText color="secondary" variant="caption">
                {t.printing.create.pricingNotice}
              </AppText>
              <AppText color="muted" variant="caption">
                {t.printing.create.uploadNote}
              </AppText>
            </Stack>
          </AppCard>

          {validation?.uploadsTooLarge ? (
            <AppText color="error" variant="bodySmall">
              {t.printing.errors.uploadsTooLarge}
            </AppText>
          ) : null}

          {draftError ? (
            <AppCard variant="muted">
              <Stack gap="sm">
                <AppText color="error" variant="bodySmall">
                  {draftError}
                </AppText>
                <AppButton
                  onPress={() => void handleCalculate()}
                  size="sm"
                  title={t.printing.errors.retry}
                  variant="outline"
                />
              </Stack>
            </AppCard>
          ) : null}

          <ChoiceChips
            label={t.printing.create.currencyLabel}
            onChange={setCurrency}
            options={[
              { value: 'SYP', label: t.printing.create.currencySyp },
              { value: 'USD', label: t.printing.create.currencyUsd },
            ]}
            value={draft.currency}
          />
        </Stack>
      </ScrollView>

      <PrintStickyBar>
        {calculating && transfer ? (
          <UploadProgressCard onCancel={cancelTransfer} transfer={transfer} />
        ) : (
          <>
            <View style={styles.barRow}>
              <View style={styles.barText}>
                <AppText variant="bodySmall" weight="700">
                  {t.printing.create.barSummary(draft.items.length, totalCopies(draft))}
                </AppText>
                <AppText color="muted" variant="caption">
                  {t.printing.create.barNote}
                </AppText>
              </View>
              {hasContent ? (
                <AppButton
                  onPress={resetDraft}
                  size="sm"
                  title={t.printing.create.startOver}
                  variant="ghost"
                />
              ) : null}
            </View>
            <AppButton
              fullWidth
              loading={isQuoting}
              onPress={() => void handleCalculate()}
              title={t.printing.create.calculatePrice}
            />
          </>
        )}
      </PrintStickyBar>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background.primary },
  scroll: { flex: 1 },
  content: { gap: spacing.xl, padding: spacing.lg, paddingBottom: spacing.xxl },
  steps: { flexDirection: 'row', alignItems: 'center' },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.border.default,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barText: { flex: 1, minWidth: 0, gap: 2 },
});
