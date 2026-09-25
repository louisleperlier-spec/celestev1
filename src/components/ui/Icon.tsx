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
  bell: (
    <>
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  flame: (
    <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3a2.5 2.5 0 0 0 2.5 2.8z" />
  ),
  cal: (
    <>
      <Rect x="3" y="4" width="18" height="18" rx="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  wave: <Path d="M2 12h3l2-5 3 10 3-8 2 3h7" />,
  moon: <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="7" />
      <Path d="M20 20l-3.5-3.5" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  lock: (
    <>
      <Rect x="5" y="11" width="14" height="10" rx="2" />
      <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  user: (
    <>
      <Circle cx="12" cy="8" r="4" />
      <Path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  barre: <Path d="M2 12h20M5 8v8M8 6v12M16 6v12M19 8v8" />,
  machine: (
    <>
      <Rect x="4" y="3" width="16" height="18" rx="2" />
      <Path d="M8 7h8M8 11h8M12 15v3" />
    </>
  ),
  poulie: (
    <>
      <Circle cx="12" cy="5" r="2.5" />
      <Path d="M12 7.5V16M9 16h6v5H9z" />
    </>
  ),
  bike: (
    <>
      <Circle cx="5.5" cy="17" r="3.5" />
      <Circle cx="18.5" cy="17" r="3.5" />
      <Path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 17.5V14l-3-3 4-3 2 3h2" />
    </>
  ),
  sliders: (
    <>
      <Path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <Circle cx="16" cy="6" r="2" />
      <Circle cx="10" cy="12" r="2" />
      <Circle cx="18" cy="18" r="2" />
    </>
  ),
  play: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M10 8.5l5.5 3.5-5.5 3.5z" />
    </>
  ),
  x: <Path d="M18 6L6 18M6 6l12 12" />,
  clip: (
    <>
      <Rect x="8" y="2" width="8" height="4" rx="1" />
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </>
  ),
  trophy: <Path d="M6 9H4a2 2 0 0 1 0-4h2M18 9h2a2 2 0 0 0 0-4h-2M6 4h12v6a6 6 0 0 1-12 0zM12 16v4M8 21h8" />,
  chart: (
    <>
      <Path d="M4 20v-5M9 20v-8M14 20v-6M19 20V8" />
      <Path d="M4 11l5-4 5 3 5-6" />
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
