import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton, AppCard, AppText, Icon, Stack } from '../../../components';
import { env } from '../../../config/env';
import { useTranslation } from '../../../i18n';
import { colors, layout, radius, spacing, useBrand } from '../../../theme';
import { formatDate } from '../../../utils/formatDateTime';
import { useAuthStore } from '../../auth/store';
import { pendingFromStatus, type PendingPolicy } from '../services/policyModel';
import { usePoliciesStore } from '../store/policiesStore';
import { AppModal } from '../../../components/overlay';

const BOX_SIZE = 24;

function policyUrl(item: PendingPolicy): string | null {
  const candidates = [
    item.policy.contentUrl,
    item.kind === 'terms' ? env.termsUrl : env.privacyUrl,
  ];

  return (
    candidates.find((url): url is string => Boolean(url && url.startsWith('https://'))) ?? null
  );
}

/**
 * Blocks the signed-in app behind a modal while the server says this student must accept a
 * newly published terms or privacy version. Nothing published never blocks, and a failed
 * lookup never locks the student out. Mount it once inside the signed-in navigation.
 */
export function PolicyGate() {
  const { t, locale } = useTranslation();
  const brand = useBrand();
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);
  const policyStatus = usePoliciesStore((state) => state.status);
  const isAccepting = usePoliciesStore((state) => state.isAccepting);
  const errorMessage = usePoliciesStore((state) => state.errorMessage);
  const loadStatus = usePoliciesStore((state) => state.loadStatus);
  const accept = usePoliciesStore((state) => state.accept);
  const logout = useAuthStore((state) => state.logout);
  const [checked, setChecked] = useState(false);
  const [needCheck, setNeedCheck] = useState(false);
  const authenticated = status === 'authenticated' && Boolean(accessToken);
  const pending = authenticated ? pendingFromStatus(policyStatus) : [];

  useEffect(() => {
    if (authenticated) {
      void loadStatus();
    }
  }, [authenticated, loadStatus]);

  function handleAccept() {
    if (isAccepting) return;

    if (!checked) {
      setNeedCheck(true);
      return;
    }

    void accept();
  }

  return (
    <AppModal
      animationType="fade"
      onRequestClose={() => undefined}
      transparent
      visible={pending.length > 0}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <Stack gap="lg">
              <Stack gap="xs">
                <AppText variant="h3">{t.policies.title}</AppText>
                <AppText color="secondary" variant="bodySmall">
                  {t.policies.description}
                </AppText>
              </Stack>

              {pending.map((item) => {
                const url = policyUrl(item);
                const published = formatDate(item.policy.publishedAt, locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <AppCard key={item.kind} padding="sm" variant="default">
                    <Stack align="center" direction="horizontal" gap="md" justify="space-between">
                      <Stack gap="xs" style={styles.policyText}>
                        <AppText variant="bodySmall" weight="700">
                          {item.kind === 'terms' ? t.policies.terms : t.policies.privacy}
                        </AppText>
                        <AppText color="muted" variant="caption">
                          {[t.policies.version(item.policy.version), published]
                            .filter(Boolean)
                            .join(' · ')}
                        </AppText>
                      </Stack>
                      {url ? (
                        <AppButton
                          onPress={() => void WebBrowser.openBrowserAsync(url)}
                          size="sm"
                          title={t.policies.read}
                          variant="outline"
                        />
                      ) : null}
                    </Stack>
                  </AppCard>
                );
              })}

              <Pressable
                accessibilityLabel={t.policies.checkbox}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => {
                  setChecked((value) => !value);
                  setNeedCheck(false);
                }}
                style={styles.checkRow}
              >
                <View
                  style={[
                    styles.box,
                    checked ? { backgroundColor: brand.primary, borderColor: brand.primary } : null,
                  ]}
                >
                  {checked ? <Icon color={colors.text.inverse} name="check" size={16} /> : null}
                </View>
                <AppText style={styles.policyText} variant="bodySmall">
                  {t.policies.checkbox}
                </AppText>
              </Pressable>
              {needCheck && !checked ? (
                <AppText color="error" variant="bodySmall">
                  {t.policies.needCheckbox}
                </AppText>
              ) : null}
              {errorMessage ? (
                <AppText color="error" variant="bodySmall">
                  {errorMessage}
                </AppText>
              ) : null}

              <Stack gap="sm">
                <AppButton
                  loading={isAccepting}
                  onPress={handleAccept}
                  title={isAccepting ? t.policies.accepting : t.policies.accept}
                />
                <AppButton
                  disabled={isAccepting}
                  onPress={() => void logout()}
                  title={t.policies.logout}
                  variant="ghost"
                />
              </Stack>
            </Stack>
          </ScrollView>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '92%',
    borderRadius: radius.xl,
    backgroundColor: colors.background.surface,
  },
  sheetContent: { padding: spacing.xl },
  policyText: { flex: 1, minWidth: 0 },
  checkRow: {
    minHeight: layout.touchTargetMinSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.border.strong,
  },
});
