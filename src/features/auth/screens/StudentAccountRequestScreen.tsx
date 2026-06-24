import { useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  AppButton,
  AppCard,
  AppScreen,
  AppText,
  AppTextInput,
  Divider,
  SectionHeader,
  Stack,
} from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { colors, radius, spacing } from '../../../theme';
import { AuthFormCard } from '../components';
import { submitStudentAccountRequest, toSafeD1ErrorMessage } from '../services';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentAccountRequest'>;

type FormErrors = {
  fullName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  university?: string;
  faculty?: string;
  major?: string;
  studentNumber?: string;
  password?: string;
  passwordConfirm?: string;
  card?: string;
};

type CardAsset = {
  uri: string;
  name: string;
  type: string;
  fileSize?: number;
};

const PERMISSION_DENIED =
  'Ù„Ù… Ù†ØªÙ…ÙƒÙ† Ù…Ù† Ø§Ù„ÙˆØµÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„ØµÙˆØ±. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø³Ù…Ø§Ø­ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¬Ù‡Ø§Ø².';
const INVALID_ASSET = 'ØªØ¹Ø°Ø± Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù‡Ø°Ø§ Ø§Ù„Ù…Ù„Ù. Ø§Ø®ØªØ± ØµÙˆØ±Ø© Ø£Ø®Ø±Ù‰.';

export function StudentAccountRequestScreen({ navigation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [university, setUniversity] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [selectedCard, setSelectedCard] = useState<CardAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function clearErrors() {
    setError(null);
    setFieldErrors({});
  }

  function validate(): FormErrors {
    const errors: FormErrors = {};
    if (!fullName.trim()) errors.fullName = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„.';
    if (!phone.trim()) errors.phone = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„.';
    if (!university.trim()) errors.university = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ø³Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©.';
    if (!studentNumber.trim())
      errors.studentNumber = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ.';
    if (!password) errors.password = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±.';
    if (!passwordConfirm) errors.passwordConfirm = 'ÙŠØ±Ø¬Ù‰ ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±.';
    if (password && passwordConfirm && password !== passwordConfirm) {
      errors.passwordConfirm = 'ÙƒÙ„Ù…ØªØ§ Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…ØªØ·Ø§Ø¨Ù‚ØªÙŠÙ†.';
    }
    if (!selectedCard) errors.card = 'ÙŠØ±Ø¬Ù‰ Ø¥Ø±ÙØ§Ù‚ ØµÙˆØ±Ø© Ø§Ù„Ø¨Ø·Ø§Ù‚Ø© Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ©.';
    return errors;
  }

  function hasErrors(errors: FormErrors): boolean {
    return Object.keys(errors).length > 0;
  }

  async function pickCard() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(PERMISSION_DENIED);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset || !asset.uri) {
        setError(INVALID_ASSET);
        return;
      }
      const uri = asset.uri;
      const name = asset.fileName || uri.split('/').pop() || 'card.jpg';
      const type = asset.mimeType || 'image/jpeg';
      setSelectedCard({ uri, name, type, fileSize: asset.fileSize });
      if (fieldErrors.card) {
        setFieldErrors((prev) => ({ ...prev, card: undefined }));
      }
      setError(null);
    } catch {
      setError('ØªØ¹Ø°Ø± Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„ØµÙˆØ±Ø©. Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.');
    }
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    clearErrors();
    const errors = validate();
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      return;
    }
    setIsSubmitting(true);
    try {
      await submitStudentAccountRequest(
        {
          full_name: fullName.trim(),
          email: email.trim() || undefined,
          phone_number: phone.trim(),
          whatsapp_phone: whatsapp.trim() || undefined,
          university: university.trim(),
          faculty: faculty.trim() || undefined,
          major: major.trim() || undefined,
          student_number: studentNumber.trim(),
          password,
          password_confirm: passwordConfirm,
        },
        selectedCard!,
      );
      navigation.replace(PublicRoutes.StudentRequestSubmitted, {
        requestId: 'pending',
      });
    } catch (e) {
      setError(toSafeD1ErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <AppScreen contentContainerStyle={styles.content} scroll safeArea>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">
          <Stack gap="xl">
            <AuthFormCard
              title="Ø·Ù„Ø¨ Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ø·Ø§Ù„Ø¨"
              subtitle="Ù‚Ø¯Ù‘Ù… Ø·Ù„Ø¨Ùƒ ÙˆØ³ÙŠØªÙ… Ù…Ø±Ø§Ø¬Ø¹ØªÙ‡ Ù…Ù† Ù‚Ø¨Ù„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©."
            >
              <Stack gap="lg">
                {/* Section 1: Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ø§Ù„Ø¨ */}
                <Stack gap="sm">
                  <SectionHeader title="Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·Ø§Ù„Ø¨" />
                  <Stack gap="md">
                    <AppTextInput
                      label="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„"
                      value={fullName}
                      onChangeText={(v) => {
                        setFullName(v);
                        setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      autoCapitalize="words"
                      disabled={isSubmitting}
                      error={fieldErrors.fullName}
                    />
                    <AppTextInput
                      label="Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ"
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      disabled={isSubmitting}
                      helperText="Ø§Ø®ØªÙŠØ§Ø±ÙŠ"
                    />
                    <AppTextInput
                      label="Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„"
                      value={phone}
                      onChangeText={(v) => {
                        setPhone(v);
                        setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      keyboardType="phone-pad"
                      disabled={isSubmitting}
                      error={fieldErrors.phone}
                    />
                    <AppTextInput
                      label="Ø±Ù‚Ù… ÙˆØ§ØªØ³Ø§Ø¨ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"
                      value={whatsapp}
                      onChangeText={(v) => {
                        setWhatsapp(v);
                        setFieldErrors((prev) => ({ ...prev, whatsapp: undefined }));
                      }}
                      keyboardType="phone-pad"
                      disabled={isSubmitting}
                      helperText="Ù„Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§Ù„ØªÙØ¹ÙŠÙ„ Ø¨Ø¹Ø¯ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø©"
                    />
                  </Stack>
                </Stack>

                <Divider />

                {/* Section 2: Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹Ø© */}
                <Stack gap="sm">
                  <SectionHeader title="Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©" />
                  <Stack gap="md">
                    <AppTextInput
                      label="Ø§Ù„Ø¬Ø§Ù…Ø¹Ø©"
                      value={university}
                      onChangeText={(v) => {
                        setUniversity(v);
                        setFieldErrors((prev) => ({ ...prev, university: undefined }));
                      }}
                      disabled={isSubmitting}
                      error={fieldErrors.university}
                    />
                    <AppTextInput
                      label="Ø§Ù„ÙƒÙ„ÙŠØ© (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"
                      value={faculty}
                      onChangeText={setFaculty}
                      disabled={isSubmitting}
                    />
                    <AppTextInput
                      label="Ø§Ù„ØªØ®ØµØµ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"
                      value={major}
                      onChangeText={setMajor}
                      disabled={isSubmitting}
                    />
                    <AppTextInput
                      label="Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ"
                      value={studentNumber}
                      onChangeText={(v) => {
                        setStudentNumber(v);
                        setFieldErrors((prev) => ({ ...prev, studentNumber: undefined }));
                      }}
                      keyboardType="default"
                      disabled={isSubmitting}
                      error={fieldErrors.studentNumber}
                    />
                  </Stack>
                </Stack>

                <Divider />

                {/* Section 3: Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø·Ø§Ù„Ø¨ */}
                <Stack gap="sm">
                  <SectionHeader
                    title="Ø¥Ø«Ø¨Ø§Øª Ø§Ù„Ø·Ø§Ù„Ø¨"
                    subtitle="ÙŠØ¬Ø¨ Ø£Ù† ÙŠØ¸Ù‡Ø± Ø§Ù„Ø§Ø³Ù… ÙˆØ§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠ Ø¨ÙˆØ¶ÙˆØ­."
                  />
                  <AppCard padding="md" variant="outlined">
                    <Stack gap="md">
                      <AppText variant="bodySmall" color="secondary">
                        Ø£Ø±ÙÙ‚ ØµÙˆØ±Ø© Ø§Ù„Ø¨Ø·Ø§Ù‚Ø© Ø§Ù„Ø¬Ø§Ù…Ø¹ÙŠØ©
                      </AppText>

                      {!selectedCard ? (
                        <AppButton
                          fullWidth
                          onPress={pickCard}
                          title="Ø§Ø®ØªÙŠØ§Ø± ØµÙˆØ±Ø©"
                          variant="outline"
                          disabled={isSubmitting}
                        />
                      ) : (
                        <Stack gap="md">
                          <View style={styles.previewRow}>
                            <Image
                              source={{ uri: selectedCard.uri }}
                              style={styles.previewImage}
                              resizeMode="cover"
                            />
                            <Stack gap="xs" style={styles.previewInfo}>
                              <AppText variant="caption" numberOfLines={1}>
                                {selectedCard.name}
                              </AppText>
                              {selectedCard.fileSize ? (
                                <AppText variant="caption" color="muted">
                                  {formatFileSize(selectedCard.fileSize)}
                                </AppText>
                              ) : null}
                            </Stack>
                          </View>
                          <Stack direction="horizontal" gap="sm">
                            <AppButton
                              onPress={pickCard}
                              title="Ø§Ø³ØªØ¨Ø¯Ø§Ù„ Ø§Ù„ØµÙˆØ±Ø©"
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting}
                            />
                            <Pressable
                              onPress={() => {
                                setSelectedCard(null);
                                setFieldErrors((prev) => ({ ...prev, card: undefined }));
                              }}
                              style={styles.removeButton}
                              disabled={isSubmitting}
                            >
                              <AppText color="error" variant="button">
                                Ø¥Ø²Ø§Ù„Ø©
                              </AppText>
                            </Pressable>
                          </Stack>
                        </Stack>
                      )}

                      {fieldErrors.card ? (
                        <AppText color="error" variant="caption">
                          {fieldErrors.card}
                        </AppText>
                      ) : null}
                    </Stack>
                  </AppCard>
                </Stack>

                <Divider />

                {/* Section 4: ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± */}
                <Stack gap="sm">
                  <SectionHeader title="ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±" />
                  <Stack gap="md">
                    <AppTextInput
                      label="ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"
                      value={password}
                      onChangeText={(v) => {
                        setPassword(v);
                        setFieldErrors((prev) => ({ ...prev, password: undefined }));
                      }}
                      secureTextEntry
                      disabled={isSubmitting}
                      error={fieldErrors.password}
                    />
                    <AppTextInput
                      label="ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"
                      value={passwordConfirm}
                      onChangeText={(v) => {
                        setPasswordConfirm(v);
                        setFieldErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
                      }}
                      secureTextEntry
                      disabled={isSubmitting}
                      error={fieldErrors.passwordConfirm}
                    />
                  </Stack>
                </Stack>

                {error ? (
                  <AppText color="error" variant="bodySmall">
                    {error}
                  </AppText>
                ) : null}

                <AppButton
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  title="Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨"
                />
              </Stack>
            </AuthFormCard>

            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backLink}
              disabled={isSubmitting}
            >
              <AppText color="brand" variant="button">
                Ø§Ù„Ø¹ÙˆØ¯Ø©
              </AppText>
            </Pressable>
          </Stack>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.lg },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background.muted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  previewImage: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  previewInfo: {
    flex: 1,
  },
  removeButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
