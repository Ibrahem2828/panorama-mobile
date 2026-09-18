import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../components';
import { FormField } from '../../../components/forms/FormField';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { colors, layout, radius, spacing, typography } from '../../../theme';
import { getFlexDirection } from '../../../utils/rtl';

/** Dialling data only. The displayed name comes from the catalog, keyed by `id`. */
type CountryCode = {
  id: keyof TranslationCatalog['auth']['countries'];
  code: string;
  flag: string;
};

const COUNTRIES: CountryCode[] = [
  { id: 'sy', code: '+963', flag: '🇸🇾' },
  { id: 'iq', code: '+964', flag: '🇮🇶' },
  { id: 'jo', code: '+962', flag: '🇯🇴' },
  { id: 'lb', code: '+961', flag: '🇱🇧' },
  { id: 'sa', code: '+966', flag: '🇸🇦' },
  { id: 'ae', code: '+971', flag: '🇦🇪' },
  { id: 'eg', code: '+20', flag: '🇪🇬' },
  { id: 'tr', code: '+90', flag: '🇹🇷' },
  { id: 'us', code: '+1', flag: '🇺🇸' },
  { id: 'gb', code: '+44', flag: '🇬🇧' },
  { id: 'de', code: '+49', flag: '🇩🇪' },
  { id: 'fr', code: '+33', flag: '🇫🇷' },
];

type PhoneInputWithCountryCodeProps = {
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  placeholder?: string;
};

export function PhoneInputWithCountryCode({
  value,
  onChangeText,
  error,
  disabled = false,
  label,
  helperText,
  placeholder,
}: PhoneInputWithCountryCodeProps) {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRIES[0]!);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const localNumber = value.startsWith(selectedCountry.code)
    ? value.slice(selectedCountry.code.length)
    : value;

  function handleChangeLocal(text: string) {
    let digits = text.replace(/[^0-9]/g, '');
    // If user pastes a full number including the country code, strip the duplicate prefix
    const codeDigits = selectedCountry.code.replace(/\D/g, '');
    if (digits.startsWith(codeDigits) && digits.length > codeDigits.length) {
      digits = digits.slice(codeDigits.length);
    }
    onChangeText(selectedCountry.code + digits);
  }

  function handleSelectCountry(country: CountryCode) {
    const digits = value.replace(/^\+\d{1,4}/, '');
    setSelectedCountry(country);
    setShowPicker(false);
    onChangeText(country.code + digits);
    inputRef.current?.focus();
  }

  return (
    <FormField error={error} helperText={helperText} label={label}>
      <View
        style={[
          styles.inputWrapper,
          error ? styles.inputWrapperError : null,
          disabled ? styles.inputWrapperDisabled : null,
        ]}
      >
        <Pressable
          onPress={() => setShowPicker(true)}
          disabled={disabled}
          style={styles.countryButton}
          accessibilityLabel={t.auth.countryPicker.selectCountry}
          accessibilityRole="button"
        >
          <AppText variant="body">{selectedCountry.flag}</AppText>
          <AppText variant="body" weight="600" style={styles.codeText}>
            {selectedCountry.code}
          </AppText>
          <AppText variant="caption" color="muted">
            ▼
          </AppText>
        </Pressable>

        <View style={styles.divider} />

        <TextInput
          ref={inputRef}
          value={localNumber}
          onChangeText={handleChangeLocal}
          editable={!disabled}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          placeholder={placeholder ?? t.auth.fields.phonePlaceholder}
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          textAlign="left"
        />
      </View>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">{t.auth.countryPicker.selectCountry}</AppText>
              <Pressable onPress={() => setShowPicker(false)} hitSlop={spacing.sm}>
                <AppText color="brand" variant="button">
                  {t.auth.countryPicker.close}
                </AppText>
              </Pressable>
            </View>
            <ScrollView style={styles.countryList}>
              {COUNTRIES.map((country) => {
                const isSelected = selectedCountry.code === country.code;
                return (
                  <Pressable
                    key={country.code}
                    style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                    onPress={() => handleSelectCountry(country)}
                  >
                    <AppText variant="body">{country.flag}</AppText>
                    <AppText variant="body" weight="600" style={styles.countryCodeText}>
                      {country.code}
                    </AppText>
                    <AppText variant="body" style={styles.countryName}>
                      {t.auth.countries[country.id]}
                    </AppText>
                    {isSelected ? (
                      <AppText variant="body" color="brand">
                        ✓
                      </AppText>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </FormField>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    minHeight: layout.inputMinHeight + 4,
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderRadius: radius.input,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  inputWrapperError: {
    borderColor: colors.semantic.error,
  },
  inputWrapperDisabled: {
    backgroundColor: colors.background.muted,
    opacity: 0.72,
  },
  countryButton: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    minWidth: 88,
    minHeight: layout.touchTargetMinSize,
  },
  codeText: {
    marginHorizontal: spacing.xxs,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    ...typography.variants.input,
    color: colors.text.primary,
    padding: 0,
    minHeight: layout.touchTargetMinSize - spacing.sm,
    writingDirection: 'ltr',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalContent: {
    backgroundColor: colors.background.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xxxl + spacing.lg,
  },
  modalHeader: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  countryList: {
    paddingHorizontal: spacing.md,
  },
  countryItem: {
    flexDirection: getFlexDirection('row'),
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  countryItemSelected: {
    backgroundColor: colors.brand.primarySoft,
  },
  countryCodeText: {
    minWidth: 56,
  },
  countryName: {
    flex: 1,
  },
});
