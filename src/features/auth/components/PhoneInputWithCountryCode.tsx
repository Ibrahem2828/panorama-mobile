import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../components';
import { FormField } from '../../../components/forms/FormField';
import { colors, layout, radius, spacing, typography } from '../../../theme';
import { getFlexDirection } from '../../../utils/rtl';

type CountryCode = {
  code: string;
  flag: string;
  name: string;
};

const COUNTRIES: CountryCode[] = [
  { code: '+963', flag: '🇸🇾', name: 'سوريا' },
  { code: '+964', flag: '🇮🇶', name: 'العراق' },
  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
  { code: '+961', flag: '🇱🇧', name: 'لبنان' },
  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
  { code: '+20', flag: '🇪🇬', name: 'مصر' },
  { code: '+90', flag: '🇹🇷', name: 'تركيا' },
  { code: '+1', flag: '🇺🇸', name: 'أمريكا' },
  { code: '+44', flag: '🇬🇧', name: 'بريطانيا' },
  { code: '+49', flag: '🇩🇪', name: 'ألمانيا' },
  { code: '+33', flag: '🇫🇷', name: 'فرنسا' },
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
  placeholder = 'أدخل رقم الجوال بدون مفتاح الدولة',
}: PhoneInputWithCountryCodeProps) {
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
          accessibilityLabel="اختر الدولة"
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
          placeholder={placeholder}
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
              <AppText variant="h3">اختر الدولة</AppText>
              <Pressable onPress={() => setShowPicker(false)} hitSlop={spacing.sm}>
                <AppText color="brand" variant="button">
                  إغلاق
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
                      {country.name}
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
