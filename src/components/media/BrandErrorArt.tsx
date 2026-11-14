import { memo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { ErrorKind } from '../../api/errorKind';
import { colors } from '../../theme';

type BrandErrorArtProps = {
  kind: ErrorKind;
  /** Rendered width in px; the height follows the 200x120 artboard. */
  width?: number;
  style?: StyleProp<ViewStyle>;
};

// Left and right halves of the Panorama infinity mark, drawn as open ribbons so a state can "break" the link between them.
const LEFT_LOBE =
  'M92 60 C80 38 66 22 50 22 C30 22 20 38 20 60 C20 82 30 98 50 98 C66 98 80 82 92 60';
const RIGHT_LOBE =
  'M108 60 C120 38 134 22 150 22 C170 22 180 38 180 60 C180 82 170 98 150 98 C134 98 120 82 108 60';

/** Whether the two lobes are joined by the grey ribbon (a whole mark) or pulled apart (the link is broken). */
const LINK: Record<ErrorKind, 'joined' | 'broken' | 'dashed'> = {
  offline: 'broken',
  weak: 'dashed',
  timeout: 'joined',
  notFound: 'joined',
  server: 'broken',
  generic: 'joined',
};

function Glyph({ kind, color }: { kind: ErrorKind; color: string }) {
  const stroke = { stroke: color, strokeWidth: 3.4, strokeLinecap: 'round', fill: 'none' } as const;

  switch (kind) {
    case 'offline':
      return (
        <G>
          <Path d="M91 56 C96 51 104 51 109 56" {...stroke} />
          <Path d="M86 51 C94 43 106 43 114 51" {...stroke} />
          <Circle cx={100} cy={63} r={2.2} fill={color} />
          <Line x1={88} y1={42} x2={112} y2={74} {...stroke} />
        </G>
      );
    case 'weak':
      return (
        <G>
          <Rect x={87} y={65} width={5} height={7} rx={1.5} fill={color} />
          <Rect x={95} y={59} width={5} height={13} rx={1.5} fill={color} />
          <Rect x={103} y={53} width={5} height={19} rx={1.5} fill={color} opacity={0.28} />
          <Rect x={111} y={47} width={5} height={25} rx={1.5} fill={color} opacity={0.28} />
        </G>
      );
    case 'timeout':
      return (
        <G>
          <Circle cx={100} cy={60} r={13} {...stroke} />
          <Path d="M100 52 L100 60 L106 64" {...stroke} />
        </G>
      );
    case 'notFound':
      return (
        <G>
          <Circle cx={97} cy={57} r={10} {...stroke} />
          <Line x1={105} y1={65} x2={113} y2={73} {...stroke} />
          <Line x1={93} y1={57} x2={101} y2={57} {...stroke} />
        </G>
      );
    case 'server':
      return (
        <G>
          <Rect x={86} y={46} width={28} height={11} rx={3.5} {...stroke} strokeWidth={3} />
          <Rect x={86} y={61} width={28} height={11} rx={3.5} {...stroke} strokeWidth={3} />
          <Circle cx={92} cy={51.5} r={1.8} fill={color} />
          <Circle cx={92} cy={66.5} r={1.8} fill={color} />
        </G>
      );
    default:
      return (
        <G>
          <Line x1={100} y1={46} x2={100} y2={61} {...stroke} />
          <Circle cx={100} cy={71} r={2.4} fill={color} />
        </G>
      );
  }
}

/**
 * The Panorama infinity mark, re-drawn from the brand shapes and colours (crimson and indigo lobes, grey link) as inline SVG:
 * crisp at any density, no bitmap weight. Each failure kind changes the link in the middle and the glyph on it.
 */
export const BrandErrorArt = memo(function BrandErrorArt({
  kind,
  width = 200,
  style,
}: BrandErrorArtProps) {
  const link = LINK[kind];
  const glyphColor =
    kind === 'notFound' || kind === 'timeout' ? colors.brand.secondary : colors.brand.accent;

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={style}>
      <Svg height={(width * 120) / 200} viewBox="0 0 200 120" width={width}>
        <Defs>
          <LinearGradient id="lobeLeft" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={colors.brand.accent} />
            <Stop offset="1" stopColor={colors.brand.secondary} />
          </LinearGradient>
          <LinearGradient id="lobeRight" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={colors.brand.secondary} />
            <Stop offset="1" stopColor={colors.brand.primary} />
          </LinearGradient>
        </Defs>

        <Circle cx={100} cy={60} r={52} fill={colors.brand.primarySoft} opacity={0.55} />

        {link === 'joined' ? (
          <G opacity={0.9}>
            <Path
              d="M88 44 C96 52 104 68 112 76"
              fill="none"
              stroke={colors.gray[300]}
              strokeLinecap="round"
              strokeWidth={13}
            />
          </G>
        ) : null}
        {link === 'dashed' ? (
          <Path
            d="M92 60 L108 60"
            fill="none"
            stroke={colors.gray[300]}
            strokeDasharray="3 7"
            strokeLinecap="round"
            strokeWidth={5}
          />
        ) : null}

        <Path
          d={LEFT_LOBE}
          fill="none"
          stroke="url(#lobeLeft)"
          strokeLinecap="round"
          strokeWidth={13}
          transform={link === 'broken' ? 'translate(-6 0)' : undefined}
        />
        <Path
          d={RIGHT_LOBE}
          fill="none"
          stroke="url(#lobeRight)"
          strokeLinecap="round"
          strokeWidth={13}
          transform={link === 'broken' ? 'translate(6 0)' : undefined}
        />

        <Circle
          cx={100}
          cy={60}
          r={23}
          fill={colors.background.surface}
          stroke={colors.border.default}
          strokeWidth={1}
        />
        <Glyph color={glyphColor} kind={kind} />
      </Svg>
    </View>
  );
});
