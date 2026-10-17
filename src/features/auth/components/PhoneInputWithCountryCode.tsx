import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText, Icon, OptionSheet } from '../../../components';
import type { SelectOption } from '../../../components';
import { FormField } from '../../../components/forms/FormField';
import { useTranslation, type TranslationCatalog } from '../../../i18n';
import { colors, layout, radius, spacing, typography } from '../../../theme';

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

  const options = useMemo<SelectOption[]>(
    () =>
      COUNTRIES.map((country) => ({
        id: country.id,
        label: `${country.flag}  ${t.auth.countries[country.id]}`,
        description: country.code,
      })),
    [t],
  );

  const localNumber = value.startsWith(selectedCountry.code)
    ? value.slice(selectedCountry.code.length)
    : value;

  function handleChangeLocal(text: string) {
    let digits = text.replace(/[^0-9]/g, '');
    // A pasted full number: drop the duplicate country prefix.
    const codeDigits = selectedCountry.code.replace(/\D/g, '');
    if (digits.startsWith(codeDigits) && digits.length > codeDigits.length + 6) {
      digits = digits.slice(codeDigits.length);
    }
    // National trunk zero (09xx...) is not part of the international number.
    digits = digits.replace(/^0+/u, '');
    onChangeText(digits ? selectedCountry.code + digits : '');
  }

  function handleSelectCountry(id: string | number) {
    const country = COUNTRIES.find((item) => item.id === id);
    if (!country) return;
    const digits = localNumber.replace(/\D/g, '');
    setSelectedCountry(country);
    onChangeText(digits ? country.code + digits : '');
    setTimeout(() => inputRef.current?.focus(), 150);
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
          accessibilityLabel={`${t.auth.countryPicker.selectCountry}: ${t.auth.countries[selectedCountry.id]}`}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => setShowPicker(true)}
          style={styles.countryButton}
        >
          <AppText variant="body">{selectedCountry.flag}</AppText>
          <AppText style={styles.codeText} variant="bodySmall" weight="600">
            {selectedCountry.code}
          </AppText>
          <Icon color={colors.text.muted} name="chevronDown" size={16} />
        </Pressable>

        <View style={styles.divider} />

        <TextInput
          ref={inputRef}
          autoComplete="tel"
          editable={!disabled}
          keyboardType="phone-pad"
          onChangeText={handleChangeLocal}
          placeholder={placeholder ?? t.auth.fields.phonePlaceholder}
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          textAlign="left"
          textContentType="telephoneNumber"
          value={localNumber}
        />
      </View>

      <OptionSheet
        onClose={() => setShowPicker(false)}
        onSelect={handleSelectCountry}
        options={options}
        searchThreshold={20}
        selectedId={selectedCountry.id}
        title={t.auth.countryPicker.selectCountry}
        visible={showPicker}
      />
    </FormField>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    minHeight: layout.inputMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
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
    minHeight: layout.touchTargetMinSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  codeText: {
    writingDirection: 'ltr',
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: spacing.md,
    backgroundColor: colors.border.default,
  },
  input: {
    ...typography.variants.input,
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: colors.text.primary,
    writingDirection: 'ltr',
  },
});
