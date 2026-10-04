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
    searchNoResultsTitle: 'No matching results',
    searchNoResultsMessage: 'Try different words, or adjust the filters.',
    searchClear: 'Clear search',
    errorTitle: 'Something went wrong',
  },

  apiErrors: {
    network: 'Could not reach the server. Check your internet connection.',
    timeout: 'The request took longer than expected. Please try again.',
    unauthorized: 'Your session has expired, or you need to sign in.',
    forbidden: 'You do not have permission to do this.',
    notFound: 'The item you asked for does not exist.',
    validation: 'The details you entered could not be validated.',
    server: 'The server hit an error. Please try again later.',
    rateLimited: 'Too many attempts. Please try again shortly.',
    unknown: 'Something went wrong. Please try again.',
  },

  relativeTime: {
    now: 'Just now',
    minutesAgo: (value: number) => (value === 1 ? '1 minute ago' : `${value} minutes ago`),
    hoursAgo: (value: number) => (value === 1 ? '1 hour ago' : `${value} hours ago`),
    daysAgo: (value: number) => (value === 1 ? '1 day ago' : `${value} days ago`),
  },

  connectivity: {
    offline:
      'You are offline. Loaded data stays visible and the app retries when the connection returns.',
  },

  navigation: {
    home: 'Home',
    subjects: 'Subjects',
    groups: 'Groups',
    printing: 'Printing',
    profile: 'Account',
    preparingStart: 'Getting things ready...',
    loadingSetup: 'Loading your setup details...',
    studentSetup: 'Student setup',
  },

  otpInput: {
    digitLabel: (index: number, total: number) => `Digit ${index} of ${total}`,
    verified: 'Verified',
  },

  placeholder: {
    subtitle: 'Navigation scaffold',
    description:
      'This is a placeholder screen in the navigation scaffold. The real functionality comes later.',
    note: 'There is no auth, API or real product logic on this screen.',
  },

  onboarding: {
    appTagline: 'Your whole university in one place',
    skip: 'Skip',
    skipLabel: 'Skip the introduction',
    paginationLabel: 'Introduction page indicator',
    previous: 'Back',
    next: 'Next',
    start: 'Get started',
    slides: [
      {
        imageLabel: 'Illustration of university life inside the Panorama app',
        title: 'Your whole university life in one place',
        description:
          'Panorama brings your files, subjects, groups and university announcements into one easy experience.',
      },
      {
        imageLabel: 'Illustration of verifying a university account',
        title: 'Verify your university account securely',
        description:
          'Upload your university card so your details can be confirmed and you get access to the right subjects and services.',
      },
      {
        imageLabel: 'Illustration of subject groups',
        title: 'Join your subject groups',
        description:
          'Follow the discussions, announcements and files tied to your subjects and your university.',
      },
      {
        imageLabel: 'Illustration of files and print orders',
        title: 'Files and printing in a few steps',
        description:
          'Open your university files, request printing, and track the order from the app.',
      },
    ],
  },

  chat: {
    title: 'Chat',
    subtitle: 'Text chat inside the group',
    loadingMessages: 'Loading messages...',
    membersCount: (count: number) => `Members: ${count}`,
    inputPlaceholder: 'Write a message...',
    send: 'Send',
    resend: 'Send again',
    emptyTitle: 'No messages yet',
    emptyMessage: 'No messages yet. Start the discussion if you are allowed to send.',
    emptyIllustrationAlt: 'Illustration showing no messages',
    unnamedSender: 'User',
    emptyMessageBody: 'Message with no text',

    membership: {
      member: 'Member',
      pending: 'Awaiting approval',
      blocked: 'Blocked',
      unknown: 'Not set',
    },

    connection: {
      connecting: 'Connecting',
      connected: 'Connected',
      reconnecting: 'Reconnecting',
      restAvailable: 'REST available',
      offline: 'Offline',
      note: 'Chat runs over REST; WebSocket is only an optional live update.',
    },

    permission: {
      title: 'Sending is not available',
      membersOnly: 'You must be a group member to send messages.',
      adminsOnly: 'Only moderators can send in this group.',
      blocked: 'You cannot send messages in this group right now.',
      readOnly: 'You can only read messages right now.',
      loading: 'Loading the group permissions.',
      undetermined: 'Your send permission for this group cannot be determined right now.',
    },

    errors: {
      network: 'Could not load messages. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      permission: 'You cannot send messages in this group right now.',
      send: 'Could not send the message. Please try again.',
      generic: 'Could not load messages. Please try again.',
      websocket: 'The chat connection was lost. You can refresh the messages manually.',
      emptyMessage: 'Write a message before sending.',
      longMessage: 'A message must not exceed 1000 characters.',
    },
  },

  notifications: {
    title: 'Notifications',
    subtitle: 'In-app notification centre',
    loading: 'Loading notifications...',
    emptyTitle: 'No notifications',
    emptyMessage:
      'Updates about verification, groups, files and print orders will appear here when there are any.',
    emptyIllustrationAlt: 'Illustration showing no notifications',
    screenNote:
      'This is an in-app notification screen only. Push permissions and device tokens are not part of this stage.',
    centerTitle: 'Notification centre',
    hasUnread: 'You have unread notifications to follow up.',
    allRead: 'All current notifications have been read.',
    unreadBadge: (count: number) => `${count} unread`,
    noNew: 'Nothing new',
    markAllRead: 'Mark all as read',
    unread: 'Unread',
    read: 'Read',
    noDetails: 'There are no further details for this notification.',
    targetLabel: 'Target',
    typeIconAlt: 'Notification type icon',
    androidChannelName: 'Panorama notifications',
    fallbackTitle: 'New notification',

    routeMessages: {
      futureTarget: (label: string) =>
        `The notification was opened. Routing to ${label} is completed in a later stage.`,
      verification:
        'The notification was opened. Verification routing is in place and completes as the access rules allow.',
      none: 'The notification was opened; it has no linked target.',
    },

    types: {
      announcement: 'Announcement',
      verification: 'Verification',
      printing: 'Printing',
      group: 'Group',
      file: 'File',
      support: 'Support',
      system: 'System',
      fallback: 'Notification',
    },

    targets: {
      printOrder: 'Print order',
      group: 'Group',
      file: 'File',
      support: 'Support',
      verification: 'Verification',
      announcement: 'Announcement',
    },

    messages: {
      markReadSuccess: 'Notification marked as read.',
      markAllReadSuccess: 'All notifications marked as read.',
    },

    errors: {
      network: 'Could not load notifications. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      permission: 'You do not have access to these notifications right now.',
      generic: 'Could not load notifications. Please try again.',
    },
  },

  subjects: {
    title: 'Subjects',
    subtitle: 'Your subjects, based on your academic details',
    loading: 'Loading subjects...',
    listTitle: 'Subject list',
    listSubtitle:
      'Academic filters come from your student profile: major, year and semester where available.',
    searchPlaceholder: 'Search by subject name or code',
    searchNote: (shown: number, total: number) =>
      `Only loaded subjects are searched. Results: ${shown} of ${total}.`,
    emptyTitle: 'No subjects',
    emptyMessage: 'No subjects are available right now.',
    emptyIllustrationAlt: 'Illustration showing no subjects',
    untitled: 'Unnamed subject',
    badge: 'Subject',
    codeLabel: (code: string) => `Subject code: ${code}`,
    codeBadge: (code: string) => `Code ${code}`,
    filesCount: (count: number) => `${count} files`,
    groupsCount: (count: number) => `${count} groups`,
    lecturesCount: (count: number) => `${count} lectures`,
    academicYear: (name: string) => `Year: ${name}`,
    semester: (name: string) => `Semester: ${name}`,

    details: {
      subtitle: 'Subject details',
      listSubtitle: 'Subject details from the list data',
      loading: 'Loading subject details...',
      unavailableTitle: 'Subject unavailable',
      unavailableMessage: 'This subject could not be found.',
      academicYearLabel: 'Academic year',
      semesterLabel: 'Semester',
      majorLabel: 'Major',
      orderLabel: 'Display order',
      linkedTitle: 'Related content',
      filesTitle: 'Files',
      filesDescription:
        'Open the files available in the app. There is no documented per-subject filter at this stage.',
      groupsTitle: 'Groups',
      groupsDescription:
        'Open the available public groups. There is no documented per-subject link at this stage.',
      announcementsTitle: 'Announcements',
      announcementsDescription:
        'There is no documented endpoint for subject announcements at this stage.',
    },

    errors: {
      network: 'Could not load subjects. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      generic: 'Could not load subjects. Please try again.',
      missingMajor: 'Subjects cannot be loaded until your academic details are complete.',
    },
  },

  search: {
    title: 'Search',
    subtitle: 'Search the content your account can reach',
    label: 'Search term',
    placeholder: 'A subject, group or file name',
    loading: 'Searching...',
    partialResults: 'Results are partial because one search source did not respond. Try again.',
    startTitle: 'Start searching',
    startMessage:
      'Type at least two characters. Only results the backend allows for your account are shown.',
    noResultsMessage: 'Try fewer words, or a different name.',
    resultsCount: (count: number) => (count === 1 ? '1 result' : `${count} results`),
    subjectsSection: 'Subjects',
    groupsSection: 'Groups',
    filesSection: 'Files',
    kindSubject: 'Subject',
    kindGroup: 'Group',
    kindFile: 'File',
    untitledSubject: 'Unnamed subject',
    subjectSubtitle: 'Academic subject',
    untitledGroup: 'Unnamed group',
    groupSubtitle: 'Academic group',
    untitledFile: 'Untitled file',
    fileSubtitle: 'File available in the app',

    errors: {
      network: 'Search failed because of the connection. Please try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      generic: 'The search could not be completed right now.',
    },
  },

  studentProfile: {
    setupTitle: 'Complete your academic profile',
    setupSubtitle: 'Student setup',
    loading: 'Loading your academic profile...',
    cardSubtitle:
      'Choose your academic details and link them to your student number before sending your card.',
    noAcademicDataTitle: 'No academic data',
    noAcademicDataMessage:
      'Universities could not be loaded right now. Try again, or contact the university administration.',
    studentNumberTitle: 'Student number',
    studentNumberHelper: 'Enter your student number exactly as it appears on your card.',
    parseNumber: 'Parse number',
    universityLabel: 'University',
    universityEmpty: 'No universities are available right now.',
    facultyLabel: 'Faculty',
    facultyEmpty: 'Choose a university first to see its faculties.',
    majorLabel: 'Major',
    majorEmpty: 'Choose a faculty first to see its majors.',
    academicYearLabel: 'Academic year',
    academicYearEmpty: 'No academic years are available right now.',
    semesterLabel: 'Semester',
    semesterEmpty: 'No semesters are available right now.',
    majorSubjectsTitle: 'Subjects in your major',
    majorSubjectsLoading: 'Loading the subjects for this major...',
    majorSubjectsLoaded: (count: number) => `Loaded ${count} subjects for your major.`,
    majorSubjectsEmpty: 'No subjects are available for this major right now.',
    saveAndContinue: 'Save and continue to verification',

    selectField: {
      emptyText: 'No options are available right now.',
      loading: 'Loading options...',
      selected: 'Selected',
    },

    intro: {
      title: 'Complete your student profile',
      description:
        'Your academic profile and student card verification must be complete before you can use the student services.',
    },

    stepper: {
      academicProfile: 'Academic profile',
      studentCard: 'Student card',
      verificationStatus: 'Verification status',
    },

    numberPreview: {
      title: 'Student number preview',
      hint: 'Enter your student number then press Parse number to see how it reads before saving.',
      noDetails: 'The number was parsed, but the server returned no further details.',
      studentNumber: 'Student number',
      universityCode: 'University code',
      facultyCode: 'Faculty code',
      yearCode: 'Year code',
      serial: 'Serial number',
      university: 'University',
      faculty: 'Faculty',
      academicYear: 'Academic year',
      semester: 'Semester',
      major: 'Major',
    },

    errors: {
      network: 'Could not reach the server. Check your connection and try again.',
      validation: 'Please check the academic details you entered.',
      unauthorized: 'Your session has expired. Please sign in again.',
      generic: 'Could not complete the action. Please try again.',
      missingFields: 'Complete every field in your academic profile before continuing.',
      missingStudentNumber: 'Enter your student number first.',
    },
  },

  verificationFlow: {
    submitTitle: 'Send your student card',
    resubmitTitle: 'Resend verification',
    subtitle: 'Student setup',
    loading: 'Loading your verification status...',
    cardSubtitle:
      'Upload a clear photo of your student card from your gallery. Verification is required to use the Panorama services.',
    whyTitle: 'Why verify?',
    whyDescription:
      'Verification confirms you are a university student and opens access to groups, files, printing and support. After you send it, the administration reviews your request and the status appears on this screen.',
    lockedNote:
      'A new request cannot be sent while in this state. Follow the status page for updates.',
    trackStatus: 'Track verification status',
    submitRequest: 'Send verification request',
    resubmitRequest: 'Resend request',
    sentTitle: 'Request sent',
    sentHeading: 'Your verification request was sent',
    sentMessage: 'Your verification request has been received and will be reviewed.',
    sentIllustrationAlt: 'Illustration showing the verification request was sent',

    status: {
      title: 'Verification status',
      cardSubtitle: 'Follow the review of your student card, and only resend when asked.',
      sendCard: 'Send your student card',
      resendUpdated: 'Send an updated photo',
      pendingNote:
        'You will be notified when the review finishes. You can refresh the status later without resending.',
      refreshStatus: 'Refresh status',
      approvedTitle: 'Verification approved',
      approvedDescription: 'You can now enter the app and use all the student services.',
      enterApp: 'Enter the app',
    },

    errors: {
      network:
        'Could not reach the server while checking your verification status. Please try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      validation: 'Choose a clear photo of your student card.',
      generic: 'Could not complete the verification request. Please try again.',
      missingImage: 'Choose a clear photo of your student card before sending.',
    },

    statusCard: {
      title: 'Verification status',
      illustrationAlt: 'Illustration of the verification status',
      rejectionTitle: 'Reason or note',
      approvedLabel: 'Verified',
      approvedDescription:
        'Your verification request was accepted. You can now use the student services.',
      pendingLabel: 'Under review',
      pendingDescription:
        'Your request is being reviewed. There is no need to resend it unless you are explicitly asked to.',
      rejectedLabel: 'Rejected',
      rejectedDescription:
        'Your verification request was rejected. Check the reason below, then send an updated, clear photo.',
      needsUpdateLabel: 'Needs an update',
      needsUpdateDescription:
        'Your request needs a clearer photo or clearer details. Send an updated student card.',
      notSubmittedLabel: 'Not sent',
      notSubmittedDescription:
        'No verification request has been sent yet. Verification is required to reach groups, files and the student services.',
    },

    imagePicker: {
      title: 'Student card photo',
      description:
        'Choose a clear photo from your gallery showing the whole student card, with no glare or cropping. Make sure the name and student number are legible.',
      guideAlt: 'Guide for photographing a student card',
      exampleAlt: (label: string) => `Example of a ${label} card`,
      noImage: 'No photo chosen yet.',
      pick: 'Choose a photo',
      replace: 'Replace photo',
      remove: 'Remove photo',
      permissionDenied: 'Allow the app to access your photos so you can choose your student card.',
      invalidImage: 'No valid photo was chosen. Please try again.',
      exampleClear: 'clear',
      exampleBlurry: 'blurry',
      exampleCropped: 'cropped',
      exampleDark: 'dark',
    },
  },

  feedback: {
    centerTitle: 'Your feedback shapes the next release',
    centerSubtitle: 'Ratings and suggestions',
    thanksTitle: 'Thank you for contributing',
    thanksMessage: "Your feedback was recorded safely and will reach the Panorama team's board.",
    thanksHeaderTitle: 'Help us improve',
    thanksHeaderSubtitle: 'Share your feedback',
    trackMine: 'Track my feedback',
    sendAnother: 'Send another',
    privacyTitle: 'Structured, trackable feedback',
    privacyNote:
      'Never send passwords, verification codes or sensitive data. We use these notes to improve performance, interfaces and features.',
    kindLabel: 'Type of feedback',
    ratingLabel: 'Rating',
    ratingOf: (value: number) => `${value} out of 5`,
    suggestionTitleLabel: 'Suggestion title',
    suggestionTitlePlaceholder: 'For example: improve search inside lectures',
    suggestionDetailsLabel: 'Suggestion details',
    shareDetailsLabel: 'Details',
    submit: 'Send to the Panorama team',
    myFeedback: 'My feedback',
    publicSuggestions: 'Community suggestions',
    missingSuggestion: 'Enter a clear title and the details of your suggestion.',
    missingDetails: 'Write details that help the Panorama team review this.',
    promptSuccess: 'Thank you for helping us improve Panorama.',

    kinds: {
      rating: 'General rating',
      ratingHint: 'Rate your experience with Panorama',
      suggestion: 'Suggestion',
      suggestionHint: 'Share a practical improvement idea',
      issue: 'Problem',
      issueHint: 'Report a functional or visual defect',
      complaint: 'Complaint',
      complaintHint: 'Describe an experience that fell short',
      praise: 'Praise',
      praiseHint: 'Tell us what you liked',
    },

    prompt: {
      title: 'Your feedback matters',
      question: 'How was your experience?',
      noteLabel: 'Optional note',
      notePlaceholder: 'What did you like? What needs improving?',
      submit: 'Send rating',
      later: 'Later',
    },

    mine: {
      title: 'My feedback',
      subtitle: 'Ratings and suggestions',
      loading: 'Loading your feedback...',
      addEntry: 'Add feedback',
      emptyTitle: 'Nothing yet',
      emptyMessage: 'Send a rating or a suggestion to shape the next release.',
      sent: 'Your feedback was sent.',
      teamReply: (message: string) => `Team reply: ${message}`,
      refresh: 'Refresh list',
      statusNew: 'New',
      statusReviewed: 'Reviewed',
      statusPlanned: 'Planned',
      statusInProgress: 'In progress',
      statusResolved: 'Done',
      statusRejected: 'Not accepted',
      statusDuplicate: 'Duplicate',
    },

    publicList: {
      title: 'Community suggestions',
      subtitle: 'Ideas that were accepted or are being worked on',
      loading: 'Loading suggestions...',
      shareIdea: 'Share your idea',
      emptyTitle: 'No published suggestions',
      emptyMessage:
        'Suggestions the Panorama team accepts for discussion or delivery will appear here.',
      votes: (count: number) => (count === 1 ? '1 supporter' : `${count} supporters`),
      vote: 'Support this',
      unvote: 'Remove support',
    },

    errors: {
      network: 'Could not send your feedback. Check your connection and try again.',
      rateLimited: 'Several ratings were sent recently. Please try again later.',
      generic: 'Could not send your feedback right now.',
    },
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
      spamHint:
        'Did not receive it? Check your spam or junk folder, then resend after the timer ends.',
      wrongEmail: 'Wrong email? Go back',
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
      otpInvalid: 'The verification code is incorrect or has expired.',
      otpLocked: 'Too many wrong attempts. Request a new code.',
      otpUnavailable:
        'We could not send the verification code right now. Try again shortly, and contact support if it keeps failing.',
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
        'We keep improving the app and adding new services for students.',
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
      subtitle: 'How we collect, use and protect your data',
      openOnline: 'Read the full policy on our website',
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
      subtitle: 'Terms of use for the Panorama app',
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
      categoryNote: 'Pick the category closest to your issue so it reaches the right team.',
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
      deleteAccount: 'Delete account',
      deleteAccountDescription: 'Request permanent deletion of your account and data',
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

    deleteAccountFlow: {
      title: 'Delete account',
      subtitle: 'Request deletion of your Panorama account and data',
      warning:
        'Your account and data will be deleted after a grace period during which you can cancel the request. After that the account cannot be recovered.',
      reasonLabel: 'Reason (optional)',
      reasonPlaceholder: 'Tell us why you are leaving',
      request: 'Request account deletion',
      confirmTitle: 'Confirm account deletion',
      confirmMessage:
        'Are you sure you want to request deletion? You can cancel during the grace period.',
      confirmAction: 'Yes, delete my account',
      cancelAction: 'Go back',
      pendingTitle: 'Deletion request pending',
      pendingScheduled: (date: string) => `Final deletion date: ${date}`,
      cancelRequest: 'Cancel deletion request',
      cancelledNotice: 'The deletion request was cancelled. Your account is safe.',
      requestedNotice: 'Your deletion request was received.',
      loadError: 'Could not load the request status. Please try again.',
    },

    changePassword: {
      title: 'Change password',
      subtitle: 'Change the password for this account',
      note: 'Passwords are never stored beyond the current form draft, and are never written to logs.',
      current: 'Current password',
      new: 'New password',
      confirm: 'Confirm new password',
      success: 'Your password has been changed.',
      currentRequired: 'Enter your current password.',
      newRequired: 'Enter a new password.',
      confirmRequired: 'Confirm your new password.',
      tooShort: 'The new password must be at least 8 characters.',
      mismatch: 'The two passwords do not match.',
    },

    errors: {
      network: 'Could not change your password. Check your connection and try again.',
      unauthorized: 'Your session has expired. Please sign in again.',
      validation: 'Please check the password details you entered.',
      generic: 'Could not change your password. Please try again.',
    },
  },
};
