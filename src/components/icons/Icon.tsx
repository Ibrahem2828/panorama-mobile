import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../../theme';

// Stroke icons on a 24x24 grid (shapes follow the open-source Lucide set, ISC licence).
type Shape =
  | { d: string }
  | { c: readonly [number, number, number] }
  | { r: readonly [number, number, number, number, number] };

const p = (d: string): Shape => ({ d });
const c = (cx: number, cy: number, r: number): Shape => ({ c: [cx, cy, r] });

const shapes = {
  home: [p('M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z')],
  book: [
    p('M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z'),
    p('M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z'),
  ],
  users: [
    c(9, 7, 4),
    p('M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2'),
    p('M16 3.13a4 4 0 0 1 0 7.75'),
    p('M22 21v-2a4 4 0 0 0-3-3.87'),
  ],
  printer: [
    p('M6 9V2h12v7'),
    p('M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'),
    p('M6 14h12v8H6z'),
  ],
  user: [c(12, 8, 4), p('M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1')],
  bell: [p('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'), p('M10.3 21a1.94 1.94 0 0 0 3.4 0')],
  search: [c(11, 11, 8), p('m21 21-4.3-4.3')],
  chat: [p('M7.9 20A9 9 0 1 0 4 16.1L2 22z')],
  file: [p('M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z'), p('M14 2v6h6')],
  check: [p('M20 6 9 17l-5-5')],
  close: [p('M18 6 6 18'), p('m6 6 12 12')],
  chevronRight: [p('m9 18 6-6-6-6')],
  chevronLeft: [p('m15 18-6-6 6-6')],
  chevronDown: [p('m6 9 6 6 6-6')],
  plus: [p('M5 12h14'), p('M12 5v14')],
  minus: [p('M5 12h14')],
  send: [p('m22 2-7 20-4-9-9-4z'), p('M22 2 11 13')],
  image: [{ r: [3, 3, 18, 18, 2] }, c(9, 9, 2), p('m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21')],
  paperclip: [
    p(
      'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48',
    ),
  ],
  help: [c(12, 12, 10), p('M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3'), p('M12 17h.01')],
  settings: [
    c(12, 12, 3),
    p(
      'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    ),
  ],
  logout: [p('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'), p('m16 17 5-5-5-5'), p('M21 12H9')],
  megaphone: [p('m3 11 18-5v12L3 14v-3z'), p('M11.6 16.8a3 3 0 1 1-5.8-1.6')],
  cap: [p('M22 10 12 5 2 10l10 5z'), p('M6 12v5c3 3 9 3 12 0v-5')],
  clock: [c(12, 12, 10), p('M12 6v6l4 2')],
  lock: [{ r: [3, 11, 18, 11, 2] }, p('M7 11V7a5 5 0 0 1 10 0v4')],
  eye: [p('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z'), c(12, 12, 3)],
  info: [c(12, 12, 10), p('M12 16v-4'), p('M12 8h.01')],
  alert: [
    p('M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'),
    p('M12 9v4'),
    p('M12 17h.01'),
  ],
  upload: [p('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'), p('m17 8-5-5-5 5'), p('M12 3v12')],
  trash: [
    p('M3 6h18'),
    p('M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6'),
    p('M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'),
  ],
  phone: [
    p(
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
    ),
  ],
  lecture: [{ r: [2, 3, 20, 14, 2] }, p('M8 21h8'), p('M12 17v4')],
  bookmark: [p('m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z')],
  star: [
    p('m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'),
  ],
  folder: [
    p(
      'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z',
    ),
  ],
  pencil: [p('M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z')],
  refresh: [
    p('M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8'),
    p('M21 3v5h-5'),
    p('M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16'),
    p('M8 16H3v5'),
  ],
  eyeOff: [
    p('M9.88 9.88a3 3 0 1 0 4.24 4.24'),
    p('M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68'),
    p('M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61'),
    p('m2 2 20 20'),
  ],
  shield: [
    p(
      'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z',
    ),
    p('m9 12 2 2 4-4'),
  ],
  idCard: [
    { r: [2, 5, 20, 14, 2] },
    c(9, 11, 2),
    p('M15 9h3'),
    p('M15 13h3'),
    p('M6 16c.5-1.5 2-2 3-2s2.5.5 3 2'),
  ],
  building: [
    p('M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z'),
    p('M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2'),
    p('M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2'),
    p('M10 6h4'),
    p('M10 10h4'),
    p('M10 14h4'),
    p('M10 18h4'),
  ],
  camera: [
    p('M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z'),
    c(12, 13, 3),
  ],
  checkCircle: [c(12, 12, 10), p('m9 12 2 2 4-4')],
  xCircle: [c(12, 12, 10), p('m15 9-6 6'), p('m9 9 6 6')],
  mail: [{ r: [2, 4, 20, 16, 2] }, p('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7')],
} as const satisfies Record<string, readonly Shape[]>;

export type IconName = keyof typeof shapes;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  filled?: boolean;
};

export function Icon({
  name,
  size = 22,
  color = colors.text.primary,
  strokeWidth = 1.9,
  filled = false,
}: IconProps) {
  return (
    <Svg
      accessibilityElementsHidden
      height={size}
      importantForAccessibility="no-hide-descendants"
      viewBox="0 0 24 24"
      width={size}
    >
      {shapes[name].map((shape: Shape, index: number) => {
        const common = {
          stroke: color,
          strokeWidth,
          strokeLinecap: 'round' as const,
          strokeLinejoin: 'round' as const,
          fill: filled ? color : 'none',
        };
        if ('c' in shape)
          return <Circle key={index} cx={shape.c[0]} cy={shape.c[1]} r={shape.c[2]} {...common} />;
        if ('r' in shape)
          return (
            <Rect
              key={index}
              x={shape.r[0]}
              y={shape.r[1]}
              width={shape.r[2]}
              height={shape.r[3]}
              rx={shape.r[4]}
              {...common}
            />
          );
        return <Path key={index} d={shape.d} {...common} />;
      })}
    </Svg>
  );
}
