import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { PublicStackParamList } from '../../../navigation/types';
import { RegistrationForm } from '../components/RegistrationForm';

type Props = NativeStackScreenProps<PublicStackParamList, 'NormalUserRegister'>;

export function NormalUserRegisterScreen({ navigation }: Props) {
  return <RegistrationForm navigation={navigation} variant="normal" />;
}
