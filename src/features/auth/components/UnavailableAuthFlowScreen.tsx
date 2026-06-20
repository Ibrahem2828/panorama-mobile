import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';

import { AppButton, AppScreen, EmptyState, Stack } from '../../../components';
import { PublicRoutes } from '../../../navigation/routes';
import type { PublicStackParamList } from '../../../navigation/types';
import { spacing } from '../../../theme';

type UnavailableAuthFlowScreenProps = {
  title: string;
  message: string;
};

type PublicNavigation = NativeStackNavigationProp<PublicStackParamList>;

export function UnavailableAuthFlowScreen({ title, message }: UnavailableAuthFlowScreenProps) {
  const navigation = useNavigation<PublicNavigation>();

  return (
    <AppScreen contentContainerStyle={styles.content} scroll>
      <Stack gap="lg">
        <EmptyState
          message={message}
          title={title}
          action={
            <AppButton
              fullWidth
              onPress={() => navigation.navigate(PublicRoutes.Login)}
              title="العودة لتسجيل الدخول"
            />
          }
        />
      </Stack>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    gap: spacing.xl,
    flexGrow: 1,
  },
});
