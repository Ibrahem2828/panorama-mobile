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

  auth: {
    backToLogin: 'Back to sign in',
    back: 'Back',
    logoAlt: 'Panorama logo',

    fields: {
      identifier: 'Email or phone number',
      identifierPlaceholder: 'student@example.com',
      email: 'Email',
      fullName: 'Full name',
      phone: 'Phone number',
      phonePlaceholder: 'Enter your number without the country code',
      studentNumber: 'Student number',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      passwordConfirm: 'Confirm password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      show: 'Show',
      hide: 'Hide',
      otpCode: 'Verification code',
    },

    login: {
      title: 'Sign in',
      tagline: 'Your subjects, groups, files and campus services in one place.',
      cardSubtitle: 'You can use either your email or your phone number.',
      submit: 'Sign in',
      createAccount: 'Create an account',
      forgotPassword: 'Forgot your password?',
      missingCredentials: 'Enter your email or phone number and your password.',
    },

    accountType: {
      illustrationAlt: 'Create an account',
      title: 'Choose an account type',
      description: 'A student account can be upgraded once the academic profile is verified.',
      studentAlt: 'Student',
      studentTitle: 'Student account',
      studentDescription: 'Access subjects, groups and academic files once verified.',
      studentAction: 'Continue as a student',
      normalAlt: 'General user',
      normalTitle: 'General account',
      normalDescription: 'For public services, printing and support, subject to permissions.',
      normalAction: 'Continue as a general user',
    },

    registerStudent: {
      title: 'Create a student account',
      subtitle: 'The verification code will be sent to your email.',
      cardTitle: 'Account details',
      cardSubtitle:
        'After verification you will complete your academic profile and upload your university card.',
      submit: 'Create account',
      haveAccount: 'Already have an account? Sign in',
    },

    registerNormal: {
      title: 'Create a general account',
      subtitle: 'Verification is done by email.',
      cardTitle: 'Account details',
      cardSubtitle: 'Public services are available according to system permissions.',
      submit: 'Create account',
    },

    otp: {
      title: 'Confirm your account',
      sentTo: (destination: string, identifier: string) =>
        `Enter the code sent to your ${destination}: ${identifier}`,
      destinationEmail: 'email',
      destinationPhone: 'phone number',
      cardTitle: 'Verification code',
      cardSubtitle: 'The code expires shortly and must not be shared with anyone.',
      submit: 'Confirm code',
      resend: 'Resend code',
      resendIn: (seconds: number) => `Resend in ${seconds}s`,
    },

    forgotPassword: {
      title: 'Reset your password',
      subtitle:
        'We will send a code to the email linked to the account, without revealing whether it exists.',
      cardTitle: 'Email',
      cardSubtitle: 'Enter the email you use with Panorama.',
      submit: 'Send reset code',
    },

    resetPassword: {
      title: 'New password',
      subtitle: 'Choose a strong password and do not reuse it on other services.',
      cardTitle: 'Reset',
      cardSubtitle: (identifier: string) => `Enter the code sent to ${identifier}.`,
      submit: 'Save password',
    },

    bootstrap: {
      checkingSession: 'Checking your session...',
      preparingStudentAccount: 'Preparing your student account...',
    },

    roleDenied: {
      title: 'This app is not available for your account',
      message:
        'The Panorama mobile app is for students. Please use the dashboard for administrative work.',
      dashboardLabel: 'Dashboard:',
      logout: 'Log out',
    },

    validation: {
      fullNameRequired: 'Enter your full name.',
      emailInvalid: 'Enter a valid email address.',
      studentNumberRequired: 'Enter your student number.',
      phoneRequired: 'Enter your phone number.',
      phoneFormat: 'Invalid phone number. It must start with a country code.',
      phoneDigitsOnly: 'The phone number may contain digits only.',
      phoneTooShort:
        'Phone number is too short. It needs at least 8 digits after the country code.',
      phoneTooLong: 'Phone number is too long.',
      passwordTooShort: 'Password must be at least 8 characters.',
      passwordMismatch: 'Password confirmation does not match.',
      otpInvalid: 'Enter a valid verification code.',
    },

    errors: {
      network: 'Could not reach the server. Check your internet connection.',
      registrationGeneric: 'Could not complete registration. Please try again.',
      passwordResetGeneric: 'Could not reset your password. Please try again.',
      rateLimited: 'Too many attempts.',
      rateLimitedRetryAfter: (seconds: number) => `Wait ${seconds} seconds and try again.`,
      passwordResetRateLimited: 'Too many attempts. Try again later.',
      invalidCredentials: 'Incorrect sign-in details.',
      sessionExpired: 'Your session has expired. Please sign in again.',
      forbidden: 'You do not have permission to do this.',
      generic: 'Could not complete the action. Please try again.',
    },

    countryPicker: {
      selectCountry: 'Select a country',
      close: 'Close',
    },

    countries: {
      sy: 'Syria',
      iq: 'Iraq',
      jo: 'Jordan',
      lb: 'Lebanon',
      sa: 'Saudi Arabia',
      ae: 'United Arab Emirates',
      eg: 'Egypt',
      tr: 'Türkiye',
      us: 'United States',
      gb: 'United Kingdom',
      de: 'Germany',
      fr: 'France',
    },
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
