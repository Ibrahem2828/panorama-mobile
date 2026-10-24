import { memo, useCallback, useEffect, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  Image,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconButton, AppText, Icon } from '../../../components';
import { AppModal } from '../../../components/overlay';
import {
  colors,
  inputThemeProps,
  layout,
  radius,
  spacing,
  typography,
  useBrand,
} from '../../../theme';
import { useTranslation } from '../../../i18n';
import { getIsRTL, isolateLtr } from '../../../utils/rtl';
import { toChatAttachment, toChatDocument, validateChatAttachment } from '../logic/attachments';
import type { SendResult } from '../store/chatStore';
import { MAX_MESSAGE_LENGTH, type ChatAttachment } from '../types';
import { formatMegabytes } from './chatFormat';

type ChatComposerProps = {
  groupId: string | number;
  onSend: (input: { text: string; attachment: ChatAttachment | null }) => SendResult;
};

const IMAGE_PICKER_OPTIONS = {
  mediaTypes: 'images' as const,
  allowsMultipleSelection: false,
  allowsEditing: false,
  exif: false,
  // JPEG re-encoding is the only downsizing available without extra packages.
  quality: 0.8,
};

/** Unsent text survives leaving and re-entering the room (memory only, never persisted). */
const drafts = new Map<string, string>();

/** The counter only appears when the limit is getting close. */
const COUNTER_THRESHOLD = Math.floor(MAX_MESSAGE_LENGTH * 0.8);

function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

/**
 * The composer owns its text, attachment and error state, so typing re-renders only this
 * component and never the message list.
 */
export const ChatComposer = memo(function ChatComposer({ groupId, onSend }: ChatComposerProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const draftKey = String(groupId);
  const [text, setText] = useState(() => drafts.get(draftKey) ?? '');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const textRef = useRef(text);

  textRef.current = text;

  useEffect(
    () => () => {
      const remaining = textRef.current;

      if (remaining.trim()) {
        drafts.set(draftKey, remaining);
      } else {
        drafts.delete(draftKey);
      }
    },
    [draftKey],
  );

  const handleChangeText = useCallback((value: string) => {
    setText(value);
    setError((current) => (current ? null : current));
  }, []);

  const accept = useCallback(
    (picked: ChatAttachment) => {
      const problem = validateChatAttachment(picked);

      if (problem) {
        setError(
          problem === 'size'
            ? t.chat.errors.attachmentSize
            : problem === 'empty'
              ? t.chat.errors.attachmentEmpty
              : t.chat.errors.attachmentType,
        );
        return;
      }

      setAttachment(picked);
    },
    [t],
  );

  const handlePickImage = useCallback(async () => {
    setMenuOpen(false);
    setError(null);

    try {
      // The system photo picker needs no storage permission on current Android / iOS.
      const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);
      const asset = result.canceled ? null : result.assets[0];

      if (asset) {
        accept(toChatAttachment(asset));
      }
    } catch {
      setError(t.chat.attachment.pickError);
    }
  }, [accept, t]);

  const handleTakePhoto = useCallback(async () => {
    setMenuOpen(false);
    setError(null);
    setCameraDenied(false);

    try {
      let permission = await ImagePicker.getCameraPermissionsAsync();

      if (!permission.granted && permission.canAskAgain) {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      }

      if (!permission.granted) {
        setCameraDenied(true);
        return;
      }

      const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTIONS);
      const asset = result.canceled ? null : result.assets[0];

      if (asset) {
        accept(toChatAttachment(asset));
      }
    } catch {
      setError(t.chat.attachment.pickError);
    }
  }, [accept, t]);

  const handlePickDocument = useCallback(async () => {
    setMenuOpen(false);
    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });
      const asset = result.canceled ? null : result.assets[0];

      if (asset) {
        accept(toChatDocument(asset));
      }
    } catch {
      setError(t.chat.attachment.documentError);
    }
  }, [accept, t]);

  const handleSend = useCallback(() => {
    const result = onSend({ text, attachment });

    if (result.ok) {
      setText('');
      setAttachment(null);
      setError(null);
      drafts.delete(draftKey);
      return;
    }

    setError(result.error);
  }, [attachment, draftKey, onSend, text]);

  const canSend = text.trim().length > 0 || attachment !== null;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: spacing.sm + (keyboardVisible ? 0 : insets.bottom) },
      ]}
    >
      {attachment ? (
        <View style={styles.attachmentPreview}>
          {attachment.kind === 'image' ? (
            <Image
              accessibilityIgnoresInvertColors
              source={{ uri: attachment.uri }}
              style={styles.thumbnail}
            />
          ) : (
            <View style={[styles.thumbnail, styles.documentThumb]}>
              <Icon color={brand.primary} name="file" size={26} />
            </View>
          )}
          <View style={styles.attachmentInfo}>
            <AppText numberOfLines={1} variant="label">
              {isolateLtr(attachment.name)}
            </AppText>
            {attachment.size > 0 ? (
              <AppText color="muted" variant="caption">
                {t.chat.attachment.sizeLabel(formatMegabytes(attachment.size))}
              </AppText>
            ) : null}
          </View>
          <AppIconButton
            accessibilityLabel={t.chat.attachment.remove}
            icon={<Icon color={colors.text.secondary} name="close" size={20} />}
            onPress={() => setAttachment(null)}
            size="sm"
          />
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <AppIconButton
          accessibilityLabel={t.chat.attachment.attach}
          icon={<Icon color={brand.primary} name="paperclip" />}
          onPress={() => setMenuOpen(true)}
        />
        <TextInput
          {...inputThemeProps}
          accessibilityLabel={t.chat.composerLabel}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
          onChangeText={handleChangeText}
          placeholder={t.chat.inputPlaceholder}
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          textAlign={getIsRTL() ? 'right' : 'left'}
          textAlignVertical="center"
          value={text}
        />
        <AppIconButton
          accessibilityLabel={t.chat.send}
          disabled={!canSend}
          icon={
            <View style={getIsRTL() ? styles.mirrored : undefined}>
              <Icon color={brand.onPrimary} name="send" size={20} />
            </View>
          }
          onPress={handleSend}
          shape="circle"
          variant="primary"
        />
      </View>

      {text.length >= COUNTER_THRESHOLD ? (
        <AppText align="auto" color="muted" variant="caption">
          {t.chat.charCount(text.length, MAX_MESSAGE_LENGTH)}
        </AppText>
      ) : null}
      {cameraDenied ? (
        <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()}>
          <AppText color="error" variant="caption">
            {t.chat.attachment.cameraDenied} {t.chat.attachment.openSettings}
          </AppText>
        </Pressable>
      ) : null}
      {error ? (
        <Pressable accessibilityLiveRegion="polite" onPress={() => setError(null)}>
          <AppText color="error" variant="caption">
            {error}
          </AppText>
        </Pressable>
      ) : null}

      <AppModal
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
        transparent
        visible={menuOpen}
      >
        <Pressable
          accessibilityLabel={t.chat.actions.close}
          onPress={() => setMenuOpen(false)}
          style={styles.menuBackdrop}
        >
          <Pressable accessible={false} style={styles.menu}>
            <AppText align="center" color="muted" variant="caption">
              {t.chat.attachment.menuTitle}
            </AppText>
            {(
              [
                ['image', t.chat.attachment.photo, handlePickImage],
                ['camera', t.chat.attachment.camera, handleTakePhoto],
                ['file', t.chat.attachment.document, handlePickDocument],
              ] as const
            ).map(([icon, label, onPress]) => (
              <Pressable
                accessibilityRole="button"
                key={icon}
                onPress={() => void onPress()}
                style={styles.menuRow}
              >
                <Icon color={brand.primary} name={icon} size={22} />
                <AppText variant="label" weight="600">
                  {label}
                </AppText>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </AppModal>
    </View>
  );
});

const styles = StyleSheet.create({
  documentThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
  },
  menuBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(16, 24, 40, 0.45)',
  },
  menu: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderTopStartRadius: radius.xl,
    borderTopEndRadius: radius.xl,
    backgroundColor: colors.background.surface,
  },
  menuRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  container: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  input: {
    ...typography.variants.input,
    flex: 1,
    minHeight: layout.iconButton.md,
    maxHeight: 132,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xxl,
    backgroundColor: colors.background.muted,
    color: colors.text.primary,
  },
  mirrored: {
    transform: [{ scaleX: -1 }],
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.background.muted,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
  },
  attachmentInfo: {
    flex: 1,
  },
});
