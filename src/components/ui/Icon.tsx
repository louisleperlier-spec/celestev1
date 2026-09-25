import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/** Tracés repris de l'objet `P` du prototype (viewBox 24, trait arrondi). */
const ICONS = {
  left: <Path d="M15 18l-6-6 6-6" />,
  right: <Path d="M9 18l6-6-6-6" />,
  arrow: <Path d="M5 12h14M13 6l6 6-6 6" />,
  check: <Path d="M5 12l5 5L20 7" />,
  star: <Path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />,
  spark: (
    <>
      <Path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <Path d="M19 17l.7 1.8 1.8.7-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  home: <Path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  dumb: <Path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />,
  cloud: <Path d="M17.5 19H7a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 11 4 4 0 0 1 17.5 19z" />,
  minus: <Path d="M5 12h14" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  heart: (
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
  ),
  scale: (
    <>
      <Rect x="4" y="3" width="16" height="18" rx="3" />
      <Path d="M8.5 9a3.5 3.5 0 0 1 7 0" />
      <Path d="M12 9l1.3-2" />
    </>
  ),
  sun: (
    <>
      <Circle cx="12" cy="12" r="4" />
      <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  pulse: <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  smile: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M8 14s1.5 2 4 2 4-2 4-2M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  target: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Circle cx="12" cy="12" r="5" />
      <Circle cx="12" cy="12" r="1" />
    </>
  ),
} as const;

export type IconName = keyof typeof ICONS;

export const isIconName = (n: string): n is IconName => n in ICONS;

type Props = { name: IconName; size?: number; color?: string; strokeWidth?: number };

/** Icône du prototype (`svg.i` : 20 px, trait 1,7). */
export function Icon({ name, size = 20, color = colors.text, strokeWidth = 1.7 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </Svg>
  );
}
