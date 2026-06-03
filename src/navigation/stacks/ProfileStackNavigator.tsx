import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { NotificationsScreen } from '../../features/notifications/screens/NotificationsScreen';
import { AboutScreen } from '../../features/profile/screens/AboutScreen';
import { AcademicInfoScreen } from '../../features/profile/screens/AcademicInfoScreen';
import { EditProfileScreen } from '../../features/profile/screens/EditProfileScreen';
import { PrivacyPolicyScreen } from '../../features/profile/screens/PrivacyPolicyScreen';
import { ProfileHomeScreen } from '../../features/profile/screens/ProfileHomeScreen';
import { TermsScreen } from '../../features/profile/screens/TermsScreen';
import { ChangePasswordScreen } from '../../features/settings/screens/ChangePasswordScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { CreateSupportTicketScreen } from '../../features/support/screens/CreateSupportTicketScreen';
import { SupportTicketsScreen } from '../../features/support/screens/SupportTicketsScreen';
import { TicketDetailsScreen } from '../../features/support/screens/TicketDetailsScreen';
import { hiddenStackScreenOptions } from '../config/screenOptions';
import { ProfileRoutes } from '../routes';
import type { ProfileStackParamList } from '../types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName={ProfileRoutes.ProfileHome}
      screenOptions={hiddenStackScreenOptions}
    >
      <Stack.Screen component={ProfileHomeScreen} name={ProfileRoutes.ProfileHome} />
      <Stack.Screen component={EditProfileScreen} name={ProfileRoutes.EditProfile} />
      <Stack.Screen component={AcademicInfoScreen} name={ProfileRoutes.AcademicInfo} />
      <Stack.Screen component={SettingsScreen} name={ProfileRoutes.Settings} />
      <Stack.Screen component={ChangePasswordScreen} name={ProfileRoutes.ChangePassword} />
      <Stack.Screen component={NotificationsScreen} name={ProfileRoutes.Notifications} />
      <Stack.Screen component={SupportTicketsScreen} name={ProfileRoutes.SupportTickets} />
      <Stack.Screen
        component={CreateSupportTicketScreen}
        name={ProfileRoutes.CreateSupportTicket}
      />
      <Stack.Screen component={TicketDetailsScreen} name={ProfileRoutes.TicketDetails} />
      <Stack.Screen component={PrivacyPolicyScreen} name={ProfileRoutes.PrivacyPolicy} />
      <Stack.Screen component={TermsScreen} name={ProfileRoutes.Terms} />
      <Stack.Screen component={AboutScreen} name={ProfileRoutes.About} />
    </Stack.Navigator>
  );
}
