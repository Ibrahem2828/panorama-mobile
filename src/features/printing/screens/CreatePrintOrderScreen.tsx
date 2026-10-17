import { useCallback, useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';

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
import { colors, radius, spacing, useBrand } from '../../../theme';
import { PrintItemCard, PrintPickupSelector, UploadProgressCard } from '../components';
import { MAX_PRINT_ITEMS, hasUploads } from '../services';
import { isQuoteFresh, usePrintingStore } from '../store';

type Props = NativeStackScreenProps<PrintingStackParamList, 'CreatePrintOrder'>;

function StepIndicator({ current }: { current: 1 | 2 }) {
  const { t } = useTranslation();
  const brand = useBrand();
  const steps = [t.printing.create.stepConfigure, t.printing.create.stepSummary];

  return (
    <Stack direction="horizontal" gap="sm" style={styles.steps}>
      {steps.map((label, index) => {
        const active = index + 1 === current;

        return (
          <View
            accessibilityLabel={`${t.printing.create.stepsLabel(current, steps.length)}: ${label}`}
            accessible
            key={label}
            style={[
              styles.step,
              { backgroundColor: active ? brand.primarySoft : colors.background.muted },
            ]}
          >
            <AppText color={active ? 'brand' : 'muted'} variant="caption" weight="700">
              {`${index + 1}. ${label}`}
            </AppText>
          </View>
        );
      })}
    </Stack>
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

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
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

        {transfer && hasUploads(draft) ? (
          <UploadProgressCard onCancel={cancelTransfer} transfer={transfer} />
        ) : (
          <Stack gap="sm">
            <AppButton
              loading={isQuoting}
              onPress={() => void handleCalculate()}
              title={t.printing.create.calculatePrice}
            />
            {hasContent ? (
              <AppButton onPress={resetDraft} title={t.printing.create.startOver} variant="ghost" />
            ) : null}
          </Stack>
        )}
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  steps: { alignItems: 'stretch' },
  step: {
    flex: 1,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
