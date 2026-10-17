import type { ImageSourcePropType } from 'react-native';

import { isDarkScheme } from '../../theme/colorScheme';

const asset = (value: ImageSourcePropType) => value;

/**
 * Bitmap assets. The main app uses icon-based artwork (`Artwork`, `IconTile`) instead of
 * illustrations; the bitmaps left here belong to the onboarding, sign-in and verification flows.
 */
export const images = {
  brand: {
    // Light lettering variants are used when the app resolved a dark colour scheme at startup.
    logoFullAr: asset(
      isDarkScheme ? require('./brand-logo-full-ar-dark.png') : require('./brand-logo-full-ar.png'),
    ),
    symbol: asset(
      isDarkScheme ? require('./brand-symbol-dark.png') : require('./brand-symbol.png'),
    ),
  },
  illustrations: {
    success: asset(require('./illustration-success.png')),
    universityBuilding: asset(require('./illustration-university.png')),
    studentMale: asset(require('./illustration-student-male.png')),
    studentFemale: asset(require('./illustration-student-female.png')),
    studyDesk: asset(require('./illustration-study-desk.png')),
  },
  onboarding: {
    university: asset(require('./onboarding-university.png')),
    verification: asset(require('./onboarding-verification.png')),
    groups: asset(require('./onboarding-groups.png')),
    filesPrinting: asset(require('./onboarding-files-printing.png')),
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
