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
    refresh: 'Refresh',
    notSpecified: 'Not set',
    notAvailable: 'Not available',
    unknown: 'Unknown',
    open: 'Open',
    searchLocal: 'Search',
    retryVerify: 'Check again',
    lastUpdatedAt: (time: string) => `Last updated: ${time}`,
    noSearchResultsAlt: 'Illustration showing no search results',
  },

  verification: {
    verified: 'Verified',
    pending: 'Under review',
    rejected: 'Rejected',
    needsUpdate: 'Needs an update',
    notSubmitted: 'Not submitted',
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

  profile: {
    title: 'My account',
    subtitle: 'Account and personal services',
    loadingAccount: 'Loading your account...',
    defaultName: 'Panorama user',
    noContactDetails: 'No confirmed contact details yet',

    roles: {
      student: 'Student',
      normalUser: 'User',
      admin: 'Administrator',
      itSupport: 'IT support',
      printStaff: 'Print staff',
      fallback: 'User account',
    },

    summary: {
      title: 'Student summary',
      university: 'University',
      faculty: 'Faculty',
      verification: 'Verification',
      note: 'Open the academic information screen for full details.',
      emailVerified: 'Email confirmed',
      emailUnverified: 'Email not confirmed',
      phoneVerified: 'Phone confirmed',
      phoneUnverified: 'Phone not confirmed',
    },

    accountSection: {
      title: 'Account',
      subtitle: 'Manage your details and account services',
      editProfile: 'Edit profile',
      editProfileSubtitle: 'Name and username only',
      academicInfo: 'Academic information',
      academicInfoSubtitle: 'View university and verification details',
      settings: 'Settings',
      settingsSubtitle: 'Security and legal information',
    },

    servicesSection: {
      title: 'Services',
      subtitle: 'Services available to students',
      printOrders: 'Print orders',
      printOrdersSubtitle: 'Track your print orders',
      notifications: 'Notifications',
      notificationsSubtitle: 'Read your account notifications',
      support: 'Support',
      supportSubtitle: 'Create and follow support tickets',
      feedback: 'Your feedback',
      feedbackSubtitle: 'Rate the app and share suggestions',
    },

    legalSection: {
      title: 'Legal',
      subtitle: 'App information',
    },

    logout: {
      action: 'Log out',
      confirmTitle: 'Log out of Panorama?',
      confirmDescription:
        'Your session tokens will be cleared from secure storage and you will return to the sign-in screen.',
      confirm: 'Confirm log out',
    },

    security: {
      title: 'Account and security',
      description: 'Your password is managed by the server and is never stored in the app.',
      changePassword: 'Change password',
    },

    edit: {
      title: 'Edit profile',
      subtitle: 'Edit the fields the server allows',
      notice:
        'Only your full name and username can be edited. Email, phone and role are shown for reference and are not sent with the update.',
      fullName: 'Full name',
      fullNamePlaceholder: 'Enter your full name',
      username: 'Username',
      usernamePlaceholder: 'Enter your username',
      readOnlyTitle: 'Read-only fields',
      email: (value: string) => `Email: ${value}`,
      phone: (value: string) => `Phone: ${value}`,
      role: (value: string) => `Role: ${value}`,
      save: 'Save changes',
      fullNameRequired: 'Enter your full name.',
      updateSuccess: 'Your profile has been updated.',
    },

    academic: {
      title: 'Academic information',
      subtitle: 'Student details returned by the server',
      loading: 'Loading academic information...',
      university: 'University',
      faculty: 'Faculty',
      major: 'Major',
      year: 'Year',
      semester: 'Semester',
      studentNumber: 'Student number',
      verifiedNote:
        'Your account is verified. Sensitive academic fields are locked and cannot be edited here.',
      readOnlyNote:
        'This screen is read-only. Academic details are edited in the student setup flow, following the server rules.',
      privacyNote: 'The verification card image and its links are not shown here, for privacy.',
      incompleteTitle: 'Academic information is incomplete',
      incompleteMessage:
        'No complete academic profile was found. Sign in again, or contact the administration if this persists.',
      cardVerified: 'Your university card has been verified.',
      cardStatusFromServer: 'University card verification status as returned by the server.',
      contactConfirmed: 'Contact details confirmed',
      contactConfirmedDescription: 'A confirmed email or phone number is on the account.',
      contactUnconfirmed: 'Contact details not confirmed',
      contactUnconfirmedDescription: 'The app shows the account status as the server returns it.',
      accountNotLoaded: 'Account details not loaded',
      accountNotLoadedDescription: 'Reload your profile to see the account status.',
      confirmed: 'Confirmed',
      unconfirmed: 'Not confirmed',
    },

    about: {
      title: 'About Panorama',
      subtitle: 'App information',
      version: (value: string) => `Version ${value}`,
      purposeTitle: 'What this app is for',
      purpose: [
        'Panorama brings subjects, groups, files, printing, notifications and support together in one organised student experience.',
        'It focuses on day-to-day academic services, while permissions and operational data stay under the server’s control.',
        'This is an MVP aimed at practical, clear access to the core services, without overstating what it does.',
      ],
    },

    errors: {
      network: 'Could not load your account. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      validation: 'Please check the profile details you entered.',
      update: 'Could not update your profile. Please try again.',
    },
  },

  legal: {
    privacy: {
      title: 'Privacy policy',
      subtitle: 'A short privacy statement for the MVP',
      sections: [
        {
          title: 'The data we use',
          paragraphs: [
            'Panorama uses account details such as your name, username and contact methods to provide a clear and secure account experience.',
            'Academic details, verification status and the student card image are used to confirm eligibility for academic services.',
          ],
        },
        {
          title: 'Services that use your data',
          paragraphs: [
            'The app may use file access, print orders, support tickets and notifications to deliver Panorama services and track their status.',
            'User data is never sold. It is used only to run and operate the services and to make the experience clearer.',
          ],
        },
        {
          title: 'Privacy inside the app',
          paragraphs: [
            'The academic information screen does not display verification image links or sensitive files that are not needed.',
            'Permissions and available data are decided by the server; the app shows only what the current user is allowed to see.',
          ],
        },
      ],
    },

    terms: {
      title: 'Terms and conditions',
      subtitle: 'Short terms of use for the MVP',
      sections: [
        {
          title: 'Acceptable use',
          paragraphs: [
            'Panorama is for responsible access to academic services, files, groups, printing and support.',
            'Misusing files, groups or support tickets, or attempting to reach data belonging to another account, is not allowed.',
          ],
        },
        {
          title: 'Permissions and the server',
          paragraphs: [
            'The server is the source of truth for permissions, verification status and the availability of files and services.',
            'Available services may differ depending on account status, verification and academic details.',
          ],
        },
        {
          title: 'Responsibility',
          paragraphs: [
            'You are responsible for keeping your password confidential and for reviewing print orders before submitting them.',
            'Please give support accurate information so the team can resolve the issue.',
          ],
        },
      ],
    },
  },

  home: {
    title: 'Home',
    subtitle: 'Student dashboard',
    loading: 'Loading your home screen...',

    greeting: {
      withName: (name: string) => `Hello, ${name}`,
      generic: 'Welcome to Panorama',
      tagline: 'Your student dashboard — your whole university in one place',
      unread: (count: number) => `${count} new`,
      accountType: (role: string) => `Account type: ${role}`,
    },

    academicSummary: {
      title: 'Your academic summary',
      university: (value: string) => `University: ${value}`,
      faculty: (value: string) => `Faculty: ${value}`,
      major: (value: string) => `Major: ${value}`,
    },

    studentStatus: {
      title: 'Student status',
      loadingLabel: 'Updating',
      loadingDescription:
        'Your profile and verification status will appear once your account finishes loading.',
      incompleteLabel: 'Incomplete profile',
      incompleteDescription: 'Complete your academic details to use the student services.',
      verifiedLabel: 'Your account is verified',
      verifiedDescription: 'You can now use the services reserved for verified students.',
      pendingLabel: 'Under review',
      pendingDescription: 'Your verification request is being reviewed by the administration.',
      rejectedLabel: 'Rejected',
      rejectedDescription:
        'Your verification request was rejected. Check the reason on the verification screen.',
      needsUpdateLabel: 'Needs an update',
      needsUpdateDescription: 'Your verification request needs a clearer image or clearer details.',
      unknownLabel: 'Complete your academic details',
      unknownDescription: 'Your verification status has not been confirmed yet.',
    },

    announcements: {
      title: 'Announcements',
      subtitle: 'The latest announcements for your account.',
      emptyTitle: 'No announcements',
      emptyMessage: 'Important announcements will appear here when there are any.',
      emptyIllustrationAlt: 'Illustration showing no announcements',
      untitled: 'Announcement',
      noDetails: 'There are no further details for this announcement.',
    },

    services: {
      title: 'Services',
      subtitle: 'Quick shortcuts to the main student services.',
      subjects: 'My subjects',
      subjectsDescription: 'Go to your list of subjects.',
      groups: 'Groups',
      groupsDescription: 'Browse the groups and spaces linked to your studies.',
      files: 'Files',
      filesDescription: 'Open the files available to you inside the app.',
      search: 'Search',
      searchDescription: 'Search the subjects, groups and files your account can reach.',
      printing: 'Printing',
      printingDescription: 'Request file printing and track your orders.',
      support: 'Support',
      supportDescription: 'Open and follow technical support tickets.',
      notifications: 'Notifications',
      notificationsDescription: 'Keep up with the alerts on your account.',
      profile: 'My account',
      profileDescription: 'Review your account details and settings.',
    },

    serviceInitials: {
      subjects: 'S',
      groups: 'G',
      files: 'F',
      search: 'Q',
      printing: 'P',
      support: 'H',
      notifications: 'N',
      profile: 'A',
    },

    errors: {
      network: 'Could not load the home screen. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      generic: 'Could not load the home screen. Please try again.',
    },
  },

  support: {
    title: 'Support',
    subtitle: 'Student support tickets',
    loading: 'Loading support tickets...',
    intro:
      'You can create a support ticket and follow the replies to it. There are no attachments or live chat at this stage.',
    ticketsCount: (count: number) => `Tickets: ${count}`,
    createTicket: 'New ticket',
    createFirstTicket: 'Create your first ticket',
    emptyTitle: 'No support tickets',
    emptyMessage: 'You have not created any support tickets yet.',
    emptyIllustrationAlt: 'Illustration showing no support tickets',
    fallbackTitle: (id: string) => `Support ticket #${id}`,
    emptyMessageBody: 'Message with no text',

    create: {
      title: 'New support ticket',
      subtitle: 'Send a problem to the support team',
      notice:
        'Only the category, title and message are sent, as the support API defines. Attachments and server-provided categories are not part of this stage.',
      subjectLabel: 'Problem title',
      subjectPlaceholder: 'For example: cannot open a file',
      messageLabel: 'Problem details',
      messagePlaceholder: 'Describe what will help the support team understand the problem',
      submit: 'Send ticket',
      categoryTitle: 'Ticket category',
      categoryNote: 'Categories are fixed in the app for the MVP and are not fetched from the API.',
    },

    details: {
      title: 'Ticket details',
      subtitle: 'Follow the conversation with the support team',
      loading: 'Loading ticket details...',
      messagesTitle: 'Message history',
      messagesSubtitle: 'Messages on this ticket',
      noMessagesTitle: 'No further messages',
      noMessagesMessage: 'Replies from the support team will appear here when there are any.',
      addMessageTitle: 'Add a message',
      addMessageSubtitle: 'Send an update to the support team',
      reload: 'Reload',
      notFoundTitle: 'Ticket unavailable',
      notFoundMessage: 'This ticket could not be found locally. Try reloading.',
      primaryMessage: 'Original message',
      staffSender: 'Support team',
      selfSender: 'You',
      replyLabel: 'Add a message',
      replyPlaceholder: 'Write extra details for the support team',
      sendReply: 'Send message',
    },

    status: {
      open: 'Open',
      waiting: 'Waiting',
      inProgress: 'In progress',
      answered: 'Answered',
      resolved: 'Resolved',
      closed: 'Closed',
      rejected: 'Rejected',
    },

    category: {
      technical: 'Technical problem',
      account: 'Account',
      verification: 'Verification',
      printing: 'Printing',
      files: 'Files',
      groups: 'Groups',
      other: 'Other',
      custom: 'Custom category',
      none: 'Uncategorised',
    },

    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent',
      custom: 'Custom priority',
      none: 'Not set',
    },

    validation: {
      categoryRequired: 'Choose a category.',
      subjectRequired: 'Enter a title for the problem.',
      messageRequired: 'Describe the problem.',
      replyRequired: 'Write your message before sending.',
      closedTicket: 'New messages cannot be added to a closed or resolved ticket.',
    },

    messages: {
      createSuccess: 'Your support ticket has been created.',
      sendSuccess: 'Your message has been sent.',
    },

    errors: {
      network: 'Could not load support tickets. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      permission: 'You do not have access to this ticket right now.',
      generic: 'Could not complete the support action. Please try again.',
    },
  },

  files: {
    title: 'Files',
    subtitle: 'Files available to your account',
    loading: 'Loading files...',
    listTitle: 'File list',
    loadedCount: (count: number) => `Files loaded: ${count}`,
    searchPlaceholder: 'Search by file name or type',
    emptyTitle: 'No files',
    emptyMessage: 'No files are available right now.',
    emptyIllustrationAlt: 'Illustration showing no files',
    untitled: 'Untitled file',

    size: {
      bytes: (value: number) => `${value} B`,
      kilobytes: (value: string) => `${value} KB`,
      megabytes: (value: string) => `${value} MB`,
    },

    type: {
      image: 'Image',
      document: 'Document',
      file: 'File',
      iconAlt: 'File type icon',
    },

    visibility: {
      public: 'Public',
      students: 'Students',
      verifiedStudents: 'Verified students',
      byMajor: 'By major',
      group: 'Group only',
      staff: 'Staff',
      custom: 'Custom access',
    },

    card: {
      updatedAt: (value: string) => `Last updated: ${value}`,
      createdAt: (value: string) => `Created: ${value}`,
    },

    details: {
      subtitle: 'File details',
      loading: 'Loading file details...',
      unavailableTitle: 'File unavailable',
      unavailableMessage: 'Could not load this file.',
      openInApp: 'Open in the app',
      requestPrint: 'Request a print',
      noTicket: 'A viewing ticket cannot be issued for this file right now.',
      descriptionTitle: 'Description',
      noDescription: 'No description is available for this file.',
      infoTitle: 'File information',
      infoSubtitle: 'File details as permitted by the server.',
      type: 'Type',
      extension: 'Extension',
      size: 'Size',
      visibility: 'Access',
      group: 'Group',
      subject: 'Subject',
      createdAt: 'Created',
      updatedAt: 'Last updated',
      protectionNote:
        'There is no download or share button. Hiding download in the interface is not absolute protection; access is enforced by the server.',
      inAppOnlyNote:
        'This file opens inside the app only. There is no direct download for students.',
    },

    viewer: {
      fallbackTitle: 'File viewer',
      subtitle: 'Protected in-app viewing',
      issuingTicket: 'Issuing a secure viewing ticket...',
      loadError: 'Could not display the file. The ticket may have expired; please try again.',
      securityNote:
        'Viewing uses a temporary link from the server, and the app blocks screenshots while a file is open where it can. There are no download or share buttons.',
      unavailableTitle: 'This file cannot be displayed',
      unavailableAlt: 'Illustration showing the file cannot be previewed',
      protectedReadyTitle: 'Protected viewing is ready',
      protectedReadyMessage: (id: string) =>
        `Use "Open in the app" to issue a secure viewing ticket for file ${id}.`,
    },

    groupFiles: {
      title: 'Group files',
      subtitle: 'Group files available to members',
      loading: 'Loading group files...',
      backToGroup: 'Back to the group',
      listTitle: 'List',
      shownCount: (count: number) => `Files shown: ${count}`,
      searchPlaceholder: 'Search by file title or description',
      emptyMessage: 'This group has no files right now.',
    },

    errors: {
      network: 'Could not load files. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      permission: 'You do not have access to these files right now.',
      generic: 'Could not load files. Please try again.',
    },
  },

  groups: {
    title: 'Groups',
    untitled: 'Unnamed group',

    overview: {
      subtitle: 'Academic groups',
      intro: 'Join the academic groups that match your university details.',
      destinationsTitle: 'Where to go',
      destinationsSubtitle:
        'Follow your own groups, or browse the groups the server makes available to you.',
      myGroupsDescription: 'Groups you are a member of, or have a pending request for.',
      availableDescription:
        'Groups you can request to join, based on your details and verification status.',
    },

    mine: {
      title: 'My groups',
      subtitle: 'Groups linked to your account',
      loading: 'Loading your groups...',
      emptyMessage: 'You have not joined any group yet.',
    },

    available: {
      title: 'Available groups',
      subtitle: 'Groups you can request to join',
      loading: 'Loading available groups...',
      emptyMessage: 'No groups are available right now.',
    },

    list: {
      title: 'List',
      loadedCount: (count: number) => `Groups loaded: ${count}`,
      searchPlaceholder: 'Search by group name or description',
      emptyTitle: 'No groups',
      emptyIllustrationAlt: 'Illustration showing no groups',
    },

    details: {
      subtitle: 'Group details',
      loading: 'Loading group details...',
      backToGroups: 'Back to groups',
      unavailableTitle: 'Group unavailable',
      unavailableMessage: 'Could not load this group.',
      join: 'Request to join',
      leave: 'Leave group',
      contentTitle: 'Group content',
      contentSubtitle: 'Chat is deferred; group files are available according to server rules.',
      chatTitle: 'Chat',
      chatDescription:
        'Open the text chat inside the app. Your permission to send is shown in the chat screen, based on your membership and the server rules.',
      openChat: 'Open chat in the app',
      filesTitle: 'Group files',
      filesDescription: 'Open this group’s files inside the app, with no direct download.',
      openFiles: 'Open group files',
      descriptionTitle: 'About this group',
      noDescription: 'No description is available for this group.',
      openWhatsApp: 'Open the approved WhatsApp channel',
      whatsAppNote:
        'The WhatsApp link is never part of the group data. The app asks the server for temporary permission when you open it.',
      whatsAppError: 'Could not open the WhatsApp link.',
    },

    stats: {
      members: (count: number) => `${count} members`,
      subject: (name: string) => `Subject: ${name}`,
      academicYear: (name: string) => `Year: ${name}`,
      semester: (name: string) => `Semester: ${name}`,
      whatsApp: 'WhatsApp',
      role: (name: string) => `Role: ${name}`,
    },

    membership: {
      pending: 'Awaiting approval',
      member: 'Member',
      rejected: 'Rejected',
      blocked: 'Blocked',
      left: 'Left',
      notJoined: 'Not joined',
      fallback: 'Membership status',
    },

    permissions: {
      title: 'Permissions',
      allMembersCanSend: 'All members can send',
      adminsOnly: 'Only moderators can send',
      groupDecides: 'The group decides who can send',
      sendToAll: 'Anyone can send',
      sendToAdmins: 'Moderators send',
      sendPermission: 'Send permission',
      yourRole: (role: string) => `Your role: ${role}`,
      sending: (permission: string) => `Sending: ${permission}`,
      roleMember: 'Member',
      roleModerator: 'Moderator',
      roleGroupAdmin: 'Group admin',
      roleAdmin: 'Admin',
      roleSupport: 'Support',
      roleNone: 'No role assigned',
    },

    messages: {
      joinSuccess: 'Your join request has been sent.',
      leaveSuccess: 'You have left the group.',
      joinError: 'Could not send the join request.',
      leaveError: 'Could not leave the group.',
    },

    errors: {
      network: 'Could not load groups. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      permission: 'You do not have access to these groups right now.',
      generic: 'Could not load groups. Please try again.',
    },
  },

  printing: {
    title: 'Printing',
    home: {
      subtitle: 'Print orders',
      illustrationAlt: 'Illustration of the printing service',
      heading: 'Print from your files',
      description: 'Create an order from a file you have access to, then track it in My orders.',
      newOrder: 'New order',
      myOrders: 'My orders',
      latestOrder: 'Latest print order',
      registeredOrders: (count: number) => `${count} orders recorded on the server`,
      loadingOrders: 'Loading print orders...',
      noOrders: 'No print orders yet.',
    },

    myOrders: {
      title: 'My orders',
      subtitle: 'Track order status',
      createOrder: 'Create an order',
      emptyTitle: 'No print orders',
      emptyMessage: 'Create your first print order from a file you have access to.',
      emptyIllustrationAlt: 'Illustration showing no print orders',
    },

    create: {
      title: 'New print order',
      subtitle: 'Priced securely by the server',
      loadingFiles: 'Loading files...',
      notesLabel: 'Order notes',
      notesHelper: 'Notes shown to the print staff. Do not include sensitive information.',
      notesPlaceholder: 'For example: a specific page order',
      pricingNotice:
        'The price is not calculated on your phone. The app sends only your options and the server returns a recorded price.',
      calculatePrice: 'Calculate price',
      submit: 'Confirm and submit',
      submitSuccess: 'Your print order has been submitted.',
    },

    priceSummary: {
      title: 'Price summary',
      subtitle: 'Priced by the server',
      recalculate: 'Recalculate price',
    },

    details: {
      subtitle: 'Order details',
      loading: 'Loading order details...',
      unavailableTitle: 'Order unavailable',
      unavailableMessage: 'Could not load this print order.',
      statusIllustrationAlt: 'Illustration of the print order status',
      noDate: 'Order date unavailable',
      extraTitle: 'Additional details',
      completedAt: 'Completed:',
      cancelledAt: 'Cancelled:',
      updatedAt: 'Last updated:',
      itemsTitle: 'Order items',
      itemsSubtitle: 'File sources as returned by the server',
      noItems: 'The server returned no itemised details.',
      notesTitle: 'Your notes',
      rejectionReason: 'Reason for rejection',
      cancel: 'Cancel order',
      cancelSuccess: 'The order has been cancelled.',
      statusIconAlt: 'Print order status icon',
    },

    fileSelector: {
      title: 'File to print',
      description: 'Choose one of the files the server lets you access.',
      searchLabel: 'Search',
      searchPlaceholder: 'Search by file name or type',
      selectedLabel: 'Selected file',
      unnamedFile: (id: string) => `File #${id}`,
      loading: 'Loading files...',
      noMatches: 'No files match your search.',
      noFiles: 'No files are available to print right now.',
      refresh: 'Refresh files',
    },

    copies: {
      title: 'Number of copies',
      decrease: 'Decrease copies',
      increase: 'Increase copies',
      limit: 'Between 1 and 99 copies is allowed.',
    },

    options: {
      title: 'Print options',
      color: 'Colour',
      sides: 'Sides',
      paperSize: 'Paper size',
      binding: 'Binding',
      pickupPoint: 'Pickup point',
      colorBlackWhite: 'Black and white',
      colorColored: 'Colour',
      sidesSingle: 'Single-sided',
      sidesDouble: 'Double-sided',
      bindingNone: 'None',
      bindingStaple: 'Staple',
      bindingSpiral: 'Spiral',
      bindingThermal: 'Thermal',
    },

    futureOptions: {
      title: 'Secure, flexible pricing',
      description:
        'Only your options are sent to the server. The Panorama backend calculates the final price and stores a snapshot of the pricing rules it used. The app never relies on a price calculated on the device.',
      items: [
        'Black and white or colour',
        'Single- or double-sided',
        'Paper size',
        'Binding and spiral',
        'Pickup point',
      ],
    },

    summaryCard: {
      title: 'Order summary',
      filesAndCopies: (files: number, copies: number) => `${files} files - ${copies} copies`,
      noFileSelected: 'No file selected.',
      draftLine: (copies: number, paperSize: string, sides: string) =>
        `${copies} copies · ${paperSize} · ${sides}`,
      pricePlaceholder: 'Calculate the price on the server before submitting',
    },

    order: {
      fallbackTitle: (id: string) => `Print order #${id}`,
      fallbackFileTitle: 'Printed file',
      copies: (count: number) => `${count} copies`,
      pages: (count: number) => ` - ${count} pages`,
    },

    status: {
      submitted: { label: 'Submitted', action: 'We have received your order' },
      underReview: { label: 'Under review', action: 'Your order is being reviewed' },
      accepted: { label: 'Accepted', action: 'Your order has been accepted' },
      printing: { label: 'Printing', action: 'Your order is being prepared' },
      ready: { label: 'Ready for pickup', action: 'You can collect your order' },
      delivered: { label: 'Delivered', action: 'Your order is complete' },
      cancelled: { label: 'Cancelled', action: 'The order was cancelled' },
      rejected: { label: 'Rejected', action: 'The order could not be processed' },
      unknownAction: 'Track your order status',
    },

    errors: {
      missingFile: 'Choose a printable file.',
      invalidCopies: 'Copies must be between 1 and 99.',
      network: 'Could not reach the printing service.',
      unauthorized: 'Your session has expired. Please sign in.',
      forbidden: 'You do not have permission to use this service.',
      generic: 'Could not complete the printing action.',
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
