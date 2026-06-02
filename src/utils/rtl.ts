import type { ViewStyle } from 'react-native';
import { I18nManager } from 'react-native';

export const isRTL = true;
type RtlTextAlign = 'left' | 'right' | 'center';

export function configureRtl() {
  I18nManager.allowRTL(true);

  if (!I18nManager.isRTL) {
    I18nManager.forceRTL(true);
  }
}

export function getRTLTextAlign(fallback: RtlTextAlign = 'right'): RtlTextAlign {
  return isRTL ? 'right' : fallback;
}

export function getFlexDirection(
  direction: 'row' | 'row-reverse' = 'row',
): NonNullable<ViewStyle['flexDirection']> {
  if (!isRTL) {
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
  return {
    marginLeft: isRTL ? marginEnd : marginStart,
    marginRight: isRTL ? marginStart : marginEnd,
    paddingLeft: isRTL ? paddingEnd : paddingStart,
    paddingRight: isRTL ? paddingStart : paddingEnd,
  };
}

export const rtlConfig = {
  arabicFirst: true,
  rtlFirst: true,
  triggersRuntimeReload: false,
} as const;
