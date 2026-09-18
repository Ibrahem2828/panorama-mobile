import type { ViewStyle } from 'react-native';
import { I18nManager } from 'react-native';

type RtlTextAlign = 'left' | 'right' | 'center';

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

export function getRTLTextAlign(fallback: RtlTextAlign = 'right'): RtlTextAlign {
  return getIsRTL() ? 'right' : fallback;
}

export function getFlexDirection(
  direction: 'row' | 'row-reverse' = 'row',
): NonNullable<ViewStyle['flexDirection']> {
  if (!getIsRTL()) {
    return direction;
  }

  return direction === 'row' ? 'row-reverse' : 'row';
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
  const rtl = getIsRTL();

  return {
    marginLeft: rtl ? marginEnd : marginStart,
    marginRight: rtl ? marginStart : marginEnd,
    paddingLeft: rtl ? paddingEnd : paddingStart,
    paddingRight: rtl ? paddingStart : paddingEnd,
  };
}

export const rtlConfig = {
  arabicFirst: true,
  rtlFirst: true,
  triggersRuntimeReload: false,
} as const;
