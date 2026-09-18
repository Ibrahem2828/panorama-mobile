import type { TranslationCatalog } from '../types';

export const en: TranslationCatalog = {
  appName: 'Panorama',

  common: {
    loading: 'Loading...',
    retry: 'Try again',
    error: 'Something went wrong',
    comingSoon: 'Later',
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
  },

  environment: {
    production: 'Production',
    preview: 'Preview',
    development: 'Development',
  },

  settings: {
    title: 'Settings',
    subtitle: 'Account and app settings',

    account: {
      title: 'Account and security',
      subtitle: 'Security actions for the current account',
      changePassword: 'Change password',
      changePasswordDescription: 'Update your password through the server',
    },

    app: {
      title: 'App',
      subtitle: 'App settings available in this release',
      notifications: 'Notifications',
      notificationsDescription: 'Open the in-app notification centre',
      darkMode: 'Dark mode',
      darkModeDescription: 'Dark mode will be supported once its scope is confirmed',
      version: 'App version',
      versionDescription: 'Current app version number',
      environment: 'Environment',
      environmentDescription: 'The environment this build points at',
    },

    language: {
      title: 'Language',
      description: 'Choose the language of the app interface',
      arabic: 'العربية',
      english: 'English',
      restartRequired: 'Language saved. Restart the app to finish switching the layout direction.',
    },

    legal: {
      title: 'Legal',
      subtitle: 'Fixed legal information for this release',
      privacy: 'Privacy policy',
      terms: 'Terms and conditions',
      about: 'About Panorama',
    },
  },
};
