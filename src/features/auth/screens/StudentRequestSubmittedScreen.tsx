import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppScreen, AppText, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';

type Props = NativeStackScreenProps<PublicStackParamList, 'StudentRequestSubmitted'>;

export function StudentRequestSubmittedScreen({ route, navigation }: Props) {
  const { requestId } = route.params || {};
  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="xl" align="center">
        <AppText variant="h1" align="center">
          تم إرسال طلبك بنجاح
        </AppText>
        <AppText color="secondary" align="center">
          سيتم مراجعة بياناتك والبطاقة الجامعية من قبل الإدارة. عند الموافقة سيصلك رمز التفعيل عبر
          واتساب.
        </AppText>
        {requestId && <AppText variant="caption">رقم الطلب: {requestId}</AppText>}
        <AppButton
          fullWidth
          onPress={() =>
            navigation.replace(PublicRoutes.StudentRequestStatus, {
              requestId: requestId || 'unknown',
            })
          }
          title="متابعة حالة الطلب"
        />
        <AppButton
          fullWidth
          variant="outline"
          onPress={() => navigation.navigate(PublicRoutes.Login)}
          title="العودة لتسجيل الدخول"
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xl, gap: spacing.lg },
});
