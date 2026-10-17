import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../../assets/images';
import { Icon } from '../../../components';
import type { IconName } from '../../../components';
import { colors, facultyPalettes, shadows, useBrand } from '../../../theme';

export type OnboardingScene = 'logo' | 'verification' | 'groups' | 'files';

type SceneConfig = {
  main: IconName;
  satellites: readonly [IconName, IconName, IconName];
  showFaculties?: boolean;
};

const SCENES: Record<Exclude<OnboardingScene, 'logo'>, SceneConfig> = {
  verification: { main: 'shield', satellites: ['idCard', 'checkCircle', 'cap'] },
  groups: { main: 'users', satellites: ['chat', 'bell', 'megaphone'], showFaculties: true },
  files: { main: 'printer', satellites: ['file', 'folder', 'paperclip'] },
};

const FACULTY_ORDER = [
  'medicine',
  'dentistry',
  'pharmacy',
  'informatics',
  'petroleum',
  'business',
] as const;

const STAGE = 264;
const CORE = 128;
const CHIP = 56;
const FACULTY_LOGO = 38;

/**
 * Brand-coloured illustration built from the icon set: a soft disc, a solid core with the
 * slide's main icon, three floating icon chips and (on the groups slide) the faculty logos.
 */
export function OnboardingHero({ scene }: { scene: OnboardingScene }) {
  const brand = useBrand();

  if (scene === 'logo') {
    return (
      <View style={styles.stage}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={images.brand.logoFullAr}
          style={styles.logo}
        />
      </View>
    );
  }

  const config = SCENES[scene];
  const chipColors = [brand.secondary, brand.accent, brand.primary] as const;

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <View style={[styles.disc, { backgroundColor: brand.primarySoft }]} />
        <View style={[styles.ring, { borderColor: brand.primary }]} />
        <View style={[styles.core, { backgroundColor: brand.primary }]}>
          <Icon color={brand.onPrimary} name={config.main} size={60} strokeWidth={1.6} />
        </View>
        <View style={[styles.chip, styles.chipTop]}>
          <Icon color={chipColors[0]} name={config.satellites[0]} size={26} />
        </View>
        <View style={[styles.chip, styles.chipMiddle]}>
          <Icon color={chipColors[1]} name={config.satellites[1]} size={26} />
        </View>
        <View style={[styles.chip, styles.chipBottom]}>
          <Icon color={chipColors[2]} name={config.satellites[2]} size={26} />
        </View>
        <View style={[styles.dot, styles.dotOne, { backgroundColor: brand.accent }]} />
        <View style={[styles.dot, styles.dotTwo, { backgroundColor: brand.secondary }]} />
      </View>
      {config.showFaculties ? (
        <View style={styles.faculties}>
          {FACULTY_ORDER.map((key) => (
            <View key={key} style={styles.facultyLogo}>
              <Image
                accessibilityIgnoresInvertColors
                resizeMode="contain"
                source={facultyPalettes[key].logo}
                style={styles.facultyImage}
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 16,
  },
  stage: {
    width: STAGE,
    height: STAGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: STAGE + 24,
    height: STAGE,
  },
  disc: {
    position: 'absolute',
    width: STAGE,
    height: STAGE,
    borderRadius: STAGE / 2,
  },
  ring: {
    position: 'absolute',
    width: CORE + 36,
    height: CORE + 36,
    borderRadius: (CORE + 36) / 2,
    borderWidth: 1.5,
    opacity: 0.25,
  },
  core: {
    ...shadows.card,
    width: CORE,
    height: CORE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CORE / 2,
  },
  chip: {
    ...shadows.card,
    position: 'absolute',
    width: CHIP,
    height: CHIP,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CHIP / 2,
    backgroundColor: colors.background.surface,
  },
  chipTop: { top: 14, end: 28 },
  chipMiddle: { top: STAGE / 2 - CHIP / 2 + 6, start: -2 },
  chipBottom: { bottom: 14, end: 44 },
  dot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    opacity: 0.8,
  },
  dotOne: { top: 40, start: 36 },
  dotTwo: { bottom: 40, start: 70 },
  faculties: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  // The logos are transparent cut-outs, so they sit directly on the page: no circle, border or box.
  facultyLogo: {
    width: FACULTY_LOGO * 1.3,
    height: FACULTY_LOGO,
  },
  facultyImage: {
    width: FACULTY_LOGO * 1.3,
    height: FACULTY_LOGO,
  },
});
