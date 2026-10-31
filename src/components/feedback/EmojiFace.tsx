import Svg, { Circle, G, Path } from 'react-native-svg';

import { RATING_COLORS, clampRating, type RatingLevel } from './emojiRatingLogic';

const INK = '#1F2937';
const TEAR = '#5AB0F5';
const HEART_FILL = '#C81E4D';
/** Heart used for the "wonderful" eyes, centred on (0,0), about 10 units wide. */
const HEART = 'M0 4 C-5 0 -5 -4 -2 -4 C-1 -4 0 -3.2 0 -2.5 C0 -3.2 1 -4 2 -4 C5 -4 5 0 0 4 Z';

type Props = {
  value: number;
  size: number;
};

/**
 * Vector face for one rating step. One 40x40 viewBox, one fill colour per step and one shared
 * ink colour, so every Android version renders it identically (no platform emoji glyphs).
 */
export function EmojiFace({ value, size }: Props) {
  const level: RatingLevel = clampRating(value);
  const stroke = { stroke: INK, strokeWidth: 2.6, strokeLinecap: 'round' as const, fill: 'none' };

  return (
    <Svg height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx={20} cy={20} fill={RATING_COLORS[level]} r={18.5} />
      {level === 1 ? (
        <>
          <Path d="M9.5 14 L17 10.8 M30.5 14 L23 10.8" {...stroke} strokeWidth={2.2} />
          <Circle cx={14} cy={18} fill={INK} r={2.1} />
          <Circle cx={26} cy={18} fill={INK} r={2.1} />
          <Path d="M12.5 22 Q10.4 25.6 12.5 26.6 Q14.6 25.6 12.5 22 Z" fill={TEAR} />
          <Path d="M12 30 Q20 21.5 28 30" {...stroke} />
        </>
      ) : null}
      {level === 2 ? (
        <>
          <Circle cx={14} cy={17} fill={INK} r={2.1} />
          <Circle cx={26} cy={17} fill={INK} r={2.1} />
          <Path d="M13.5 28.5 Q20 23.5 26.5 28.5" {...stroke} />
        </>
      ) : null}
      {level === 3 ? (
        <>
          <Circle cx={14} cy={17} fill={INK} r={2.1} />
          <Circle cx={26} cy={17} fill={INK} r={2.1} />
          <Path d="M14 27 L26 27" {...stroke} />
        </>
      ) : null}
      {level === 4 ? (
        <>
          <Circle cx={14} cy={16.5} fill={INK} r={2.1} />
          <Circle cx={26} cy={16.5} fill={INK} r={2.1} />
          <Path d="M13 24.5 Q20 31.5 27 24.5" {...stroke} />
        </>
      ) : null}
      {level === 5 ? (
        <>
          <G transform="translate(13.5 16.5) scale(1.05)">
            <Path d={HEART} fill={HEART_FILL} />
          </G>
          <G transform="translate(26.5 16.5) scale(1.05)">
            <Path d={HEART} fill={HEART_FILL} />
          </G>
          <Path
            d="M11 24 Q20 35 29 24 Z"
            fill={INK}
            stroke={INK}
            strokeLinejoin="round"
            strokeWidth={1.6}
          />
        </>
      ) : null}
    </Svg>
  );
}
