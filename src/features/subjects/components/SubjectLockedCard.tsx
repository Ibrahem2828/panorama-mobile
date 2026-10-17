import { StyleSheet, View } from 'react-native';

import { AppButton, AppText, Icon } from '../../../components';
import { useTranslation } from '../../../i18n';
import { colors, radius, useBrand } from '../../../theme';
import type { MembershipKind } from '../../groups/services/membership';

type SubjectLockedCardProps = {
  /** Membership of the student's group for this subject (`notMember` when there is none). */
  membership: MembershipKind;
  onOpenGroups: () => void;
};

/** Shown instead of lectures/files until the student is an approved member of the subject's group. */
export function SubjectLockedCard({ membership, onOpenGroups }: SubjectLockedCardProps) {
  const { t } = useTranslation();
  const brand = useBrand();
  const copy = t.subjects.locked;
  const pending = membership === 'pending';
  const blocked = membership === 'blocked';
  const message =
    membership === 'pending'
      ? copy.pending
      : membership === 'rejected'
        ? copy.rejected
        : membership === 'blocked'
          ? copy.blocked
          : membership === 'left'
            ? copy.left
            : copy.message;
  const buttonTitle =
    pending || blocked
      ? copy.openGroup
      : membership === 'rejected' || membership === 'left'
        ? copy.rejoin
        : copy.join;

  return (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: brand.primarySoft }]}>
        <Icon color={brand.primary} name="lock" size={26} />
      </View>
      <AppText align="center" variant="title">
        {copy.title}
      </AppText>
      <AppText align="center" color="secondary" variant="bodySmall">
        {message}
      </AppText>
      <AppButton
        fullWidth
        onPress={onOpenGroups}
        title={buttonTitle}
        variant={pending || blocked ? 'outline' : 'primary'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
