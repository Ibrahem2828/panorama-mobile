import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppButton, AppText, AppTextInput } from '../../../components';
import { AppModal } from '../../../components/overlay';
import { useTranslation } from '../../../i18n';
import { colors, radius, shadows, spacing } from '../../../theme';

type CancelOrderSheetProps = {
  visible: boolean;
  busy: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

const REASON_MAX = 255;

function Body({ busy, error, onConfirm, onClose }: Omit<CancelOrderSheetProps, 'visible'>) {
  const { t } = useTranslation();
  const copy = t.store.orders.detail;
  const [reason, setReason] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.overlay}
    >
      <Pressable
        accessibilityLabel={copy.keep}
        accessibilityRole="button"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View accessibilityViewIsModal style={styles.sheet}>
        <View style={styles.grabber} />
        <AppText accessibilityRole="header" variant="title">
          {copy.cancelTitle}
        </AppText>
        <AppText color="secondary" variant="bodySmall">
          {copy.cancelMessage}
        </AppText>
        <AppTextInput
          label={copy.reasonLabel}
          maxLength={REASON_MAX}
          multiline
          onChangeText={setReason}
          placeholder={copy.reasonPlaceholder}
          value={reason}
        />
        {error ? (
          <AppText accessibilityLiveRegion="polite" color="error" variant="bodySmall">
            {error}
          </AppText>
        ) : null}
        <View style={styles.actions}>
          <AppButton
            fullWidth
            loading={busy}
            onPress={() => onConfirm(reason)}
            title={copy.confirmCancel}
            variant="danger"
          />
          <AppButton
            disabled={busy}
            fullWidth
            onPress={onClose}
            title={copy.keep}
            variant="outline"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Bottom sheet to cancel a pending order, with an optional reason. */
export function CancelOrderSheet({ visible, ...rest }: CancelOrderSheetProps) {
  return (
    <AppModal animationType="slide" onRequestClose={rest.onClose} transparent visible={visible}>
      {visible ? <Body {...rest} /> : <View />}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: {
    ...shadows.card,
    gap: spacing.md,
    padding: spacing.xl,
    borderTopStartRadius: radius.xxl,
    borderTopEndRadius: radius.xxl,
    backgroundColor: colors.background.surface,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.default,
  },
  actions: { gap: spacing.sm },
});
