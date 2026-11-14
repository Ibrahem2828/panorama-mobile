import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
import { CHAT_POLICY, pickFromSource, type AttachmentSource } from '../../attachments';
import { ChatAttachSheet, type ChatAttachSource } from '../media/components/ChatAttachSheet';
import { MicRationale, VoiceRecorderBar } from '../media/components/VoiceRecorderBar';
import { useVoiceRecorder } from '../media/hooks/useVoiceRecorder';
import { buildWaveform } from '../media/logic/waveform';
import type { MediaProblem } from '../media/logic/validation';
import { deleteTemp, fileSize, pickAudioFile, prepareImage } from '../media/services/mediaPicker';
import { getRecordingPermissionsAsync } from 'expo-audio';
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
import { localFileToChatAttachment, validateChatAttachment } from '../logic/attachments';
import type { SendResult } from '../store/chatStore';
import { MAX_MESSAGE_LENGTH, type ChatAttachment, type ChatReplyTarget } from '../types';
import { formatMegabytes } from './chatFormat';
import { ReplyBar } from './ReplyBar';

type ChatComposerProps = {
  groupId: string | number;
  onSend: (input: { text: string; attachment: ChatAttachment | null }) => SendResult;
  /** The message being answered; the bar above the input shows it. The screen owns this state. */
  replyTo?: ChatReplyTarget | null;
  onCancelReply?: () => void;
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
export const ChatComposer = memo(function ChatComposer({
  groupId,
  onSend,
  replyTo = null,
  onCancelReply,
}: ChatComposerProps) {
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
  const [preparing, setPreparing] = useState(false);
  const [rationale, setRationale] = useState(false);
  const voice = useVoiceRecorder();
  const textRef = useRef(text);
  const inputRef = useRef<TextInput>(null);
  const replyId = replyTo?.id ?? null;

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

  // Choosing a message to reply to puts the cursor in the input right away.
  useEffect(() => {
    if (replyId !== null) inputRef.current?.focus();
  }, [replyId]);

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

  const mediaProblemMessage = useCallback(
    (problem: MediaProblem): string => {
      switch (problem) {
        case 'size':
          return t.chat.media.pick.audioSize;
        case 'webm':
          return t.chat.media.pick.audioWebm;
        case 'empty':
          return t.chat.media.pick.audioEmpty;
        case 'imageSize':
          return t.chat.media.pick.imageTooLarge;
        default:
          return t.chat.media.pick.audioType;
      }
    },
    [t],
  );

  const handleAudio = useCallback(async () => {
    setError(null);

    const result = await pickAudioFile();

    if (result.status === 'picked') {
      setAttachment(result.attachment);
    } else if (result.status === 'invalid') {
      setError(mediaProblemMessage(result.problem));
    } else if (result.status === 'error') {
      setError(t.chat.media.pick.audioError);
    }
  }, [mediaProblemMessage, t]);

  const handleSource = useCallback(
    async (source: AttachmentSource) => {
      setError(null);
      setCameraDenied(false);

      const result = await pickFromSource(source, CHAT_POLICY, { quality: 0.8 });

      if (result.status === 'picked') {
        const file = result.files[0];

        if (file) {
          const picked = localFileToChatAttachment(file);

          if (picked.kind === 'image') {
            // Photos are shrunk on the phone so they always fit the 10 MB server limit and upload fast.
            setPreparing(true);

            const prepared = await prepareImage(picked, { width: file.width, height: file.height });

            setPreparing(false);

            if (prepared.ok) {
              accept(prepared.attachment);
            } else {
              setError(mediaProblemMessage(prepared.problem));
            }
          } else {
            accept(picked);
          }
        }
      } else if (result.status === 'invalid') {
        setError(
          result.problem === 'size'
            ? t.chat.errors.attachmentSize
            : result.problem === 'empty'
              ? t.chat.errors.attachmentEmpty
              : t.chat.errors.attachmentType,
        );
      } else if (result.status === 'permission_denied') {
        setCameraDenied(true);
      } else if (result.status === 'error') {
        setError(
          source === 'document' ? t.chat.attachment.documentError : t.chat.attachment.pickError,
        );
      }
    },
    [accept, mediaProblemMessage, t],
  );

  const handleAttachSource = useCallback(
    (source: ChatAttachSource) => {
      if (source === 'audio') {
        void handleAudio();
      } else {
        void handleSource(source);
      }
    },
    [handleAudio, handleSource],
  );

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
  const voiceBusy =
    voice.state.phase === 'recording' ||
    voice.state.phase === 'stopping' ||
    voice.state.phase === 'review';

  const sendClip = useCallback(
    (clip: { uri: string; durationMs: number; levels: number[] }) => {
      const result = onSend({
        text: '',
        attachment: {
          uri: clip.uri,
          name: `voice-${Date.now()}.m4a`,
          mimeType: 'audio/mp4',
          size: fileSize(clip.uri),
          kind: 'voice',
          durationMs: clip.durationMs,
          waveform: buildWaveform(clip.levels),
        },
      });

      if (!result.ok) {
        setError(result.error);
        deleteTemp(clip.uri);
      }
    },
    [onSend],
  );

  const handleMic = useCallback(async () => {
    setError(null);

    const permission = await getRecordingPermissionsAsync().catch(() => null);

    if (permission && !permission.granted && permission.canAskAgain) {
      setRationale(true);
      return;
    }

    void voice.start();
  }, [voice]);

  // A recording stopped with "send" arrives here as a finished clip and goes out as a voice message.
  const { takeClip } = voice;

  useEffect(() => {
    if (voice.state.phase === 'idle' && voice.state.clip) {
      const clip = takeClip();

      if (clip) {
        sendClip(clip);
      }
    }
  }, [sendClip, takeClip, voice.state.clip, voice.state.phase]);

  const voiceNotice =
    voice.state.notice === 'tooShort'
      ? t.chat.media.tooShort
      : voice.state.notice === 'failed'
        ? t.chat.media.recordFailed
        : null;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: spacing.sm + (keyboardVisible ? 0 : insets.bottom) },
      ]}
    >
      {replyTo && onCancelReply ? <ReplyBar onCancel={onCancelReply} target={replyTo} /> : null}

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
              <Icon
                color={brand.primary}
                name={attachment.kind === 'audio' ? 'music' : 'file'}
                size={26}
              />
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

      {preparing ? (
        <AppText accessibilityLiveRegion="polite" color="muted" variant="caption">
          {t.chat.media.pick.preparingImage}
        </AppText>
      ) : null}

      {rationale ? (
        <MicRationale
          onAllow={() => {
            setRationale(false);
            void voice.start();
          }}
          onCancel={() => setRationale(false)}
        />
      ) : null}

      {voiceBusy ? (
        <VoiceRecorderBar
          onCancel={() => voice.stop('cancel')}
          onDiscard={voice.discardClip}
          onSend={() => {
            if (voice.state.phase === 'review') {
              const clip = takeClip();

              if (clip) {
                sendClip(clip);
              }
            } else {
              voice.stop('send');
            }
          }}
          state={voice.state}
        />
      ) : (
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
            ref={inputRef}
            style={styles.input}
            textAlign={getIsRTL() ? 'right' : 'left'}
            textAlignVertical="center"
            value={text}
          />
          {canSend || voice.state.phase === 'requesting' ? (
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
          ) : (
            <AppIconButton
              accessibilityLabel={t.chat.media.micLabel}
              icon={<Icon color={brand.onPrimary} name="mic" size={20} />}
              onPress={() => void handleMic()}
              shape="circle"
              variant="primary"
            />
          )}
        </View>
      )}

      {voice.state.phase === 'denied' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => (voice.state.canAskAgain ? void handleMic() : void Linking.openSettings())}
        >
          <AppText accessibilityLiveRegion="polite" color="error" variant="caption">
            {t.chat.media.micDenied}{' '}
            {voice.state.canAskAgain ? t.common.retry : t.chat.attachment.openSettings}
          </AppText>
        </Pressable>
      ) : null}
      {voiceNotice ? (
        <Pressable accessibilityLiveRegion="polite" onPress={voice.dismissNotice}>
          <AppText color="error" variant="caption">
            {voiceNotice}
          </AppText>
        </Pressable>
      ) : null}

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

      <ChatAttachSheet
        onClose={() => setMenuOpen(false)}
        onSelect={handleAttachSource}
        visible={menuOpen}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  documentThumb: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.surface,
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
