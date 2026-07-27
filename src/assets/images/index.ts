import type { ImageSourcePropType } from 'react-native';

const asset = (value: ImageSourcePropType) => value;

export const images = {
  brand: {
    logoFullAr: asset(require('./brand-logo-full-ar.png')),
    symbol: asset(require('./brand-symbol.png')),
  },
  illustrations: {
    dashboardHero: asset(require('./dashboard-hero.png')),
    warning: asset(require('./illustration-warning.png')),
    success: asset(require('./illustration-success.png')),
    search: asset(require('./illustration-search.png')),
    universityBuilding: asset(require('./illustration-university.png')),
    studentMale: asset(require('./illustration-student-male.png')),
    studentFemale: asset(require('./illustration-student-female.png')),
    studyDesk: asset(require('./illustration-study-desk.png')),
  },
  emptyStates: {
    chat: asset(require('./empty-chat.png')),
    files: asset(require('./empty-files.png')),
    groups: asset(require('./empty-groups.png')),
    announcements: asset(require('./empty-announcements.png')),
    notifications: asset(require('./empty-notifications.png')),
    printingOrders: asset(require('./empty-print-orders.png')),
    subjects: asset(require('./empty-subjects.png')),
    supportTickets: asset(require('./empty-support.png')),
  },
  files: {
    locked: asset(require('./file-locked.png')),
    pdf: asset(require('./file-pdf.png')),
    image: asset(require('./file-image.png')),
    document: asset(require('./file-document.png')),
    previewError: asset(require('./file-preview-error.png')),
  },
  notifications: {
    verification: asset(require('./notification-verification.png')),
    printing: asset(require('./notification-printing.png')),
    support: asset(require('./notification-support.png')),
    group: asset(require('./notification-group.png')),
    announcement: asset(require('./notification-announcement.png')),
  },
  onboarding: {
    university: asset(require('./onboarding-university.png')),
    verification: asset(require('./onboarding-verification.png')),
    groups: asset(require('./onboarding-groups.png')),
    filesPrinting: asset(require('./onboarding-files-printing.png')),
  },
  printing: {
    hero: asset(require('./printing-hero.png')),
    orderPending: asset(require('./printing-pending.png')),
    orderProcessing: asset(require('./printing-processing.png')),
    orderReady: asset(require('./printing-ready.png')),
    orderCompleted: asset(require('./printing-completed.png')),
    orderCancelled: asset(require('./printing-cancelled.png')),
  },
  verification: {
    studentCardGuide: asset(require('./verification-guide.png')),
    approved: asset(require('./verification-approved.png')),
    pending: asset(require('./verification-pending.png')),
    rejected: asset(require('./verification-rejected.png')),
    cardExampleGood: asset(require('./card-good.png')),
    cardExampleBlurry: asset(require('./card-blurry.png')),
    cardExampleCropped: asset(require('./card-cropped.png')),
    cardExampleDark: asset(require('./card-dark.png')),
  },
} as const;

export type PanoramaImageCollection = typeof images;
