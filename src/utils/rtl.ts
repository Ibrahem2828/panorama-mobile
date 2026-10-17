import type { ViewStyle } from 'react-native';
import { I18nManager } from 'react-native';

type RtlTextAlign = 'auto' | 'left' | 'right' | 'center';

/**
 * Reads the direction the native layer is actually laid out in, rather than the selected
 * locale: React Native fixes direction at startup, so right after a language switch the
 * two disagree until the app restarts. Layout must follow the running direction or rows
 * and spacing mirror against the text.
 */
export function getIsRTL(): boolean {
  return I18nManager.isRTL;
}

/**
 * Applies the Arabic default before the first frame. The locale store re-applies the
 * stored preference once it hydrates, which only takes effect on the next launch.
 */
export function configureRtl() {
  I18nManager.allowRTL(true);

  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
  }
}

const LRI = '\u2066';
const PDI = '\u2069';

/**
 * Wraps LTR content (email, phone, URL, subject code, file name) in Unicode isolates so its
 * digits, dots and `+` keep their order when it is embedded in an Arabic sentence.
 */
export function isolateLtr(value: string): string {
  return value ? `${LRI}${value}${PDI}` : value;
}

/** Natural alignment: Arabic text aligns to the right and Latin text to the left, in either direction. */
export function getRTLTextAlign(fallback: RtlTextAlign = 'auto'): RtlTextAlign {
  return fallback;
}

/** Native RTL already mirrors rows, so the direction is returned unchanged. */
export function getFlexDirection(
  direction: 'row' | 'row-reverse' = 'row',
): NonNullable<ViewStyle['flexDirection']> {
  return direction;
}

type StartEndSpacingInput = {
  marginStart?: number;
  marginEnd?: number;
  paddingStart?: number;
  paddingEnd?: number;
};

export function getStartEndSpacing({
  marginStart,
  marginEnd,
  paddingStart,
  paddingEnd,
}: StartEndSpacingInput): ViewStyle {
  return { marginStart, marginEnd, paddingStart, paddingEnd };
}

export const rtlConfig = {
  arabicFirst: true,
  rtlFirst: true,
  triggersRuntimeReload: false,
} as const;
