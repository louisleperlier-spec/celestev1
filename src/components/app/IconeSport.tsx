import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import type { GlypheSport } from '@/lib/sports';
import { colors } from '@/theme';

/** Icônes des autres sports, au trait arrondi comme `Icon` (viewBox 24), dessinées pour NÉA. */
const GLYPHES: Record<GlypheSport, React.ReactNode> = {
  raquette: (
    <>
      <Ellipse cx="9" cy="9" rx="5" ry="6.5" transform="rotate(-45 9 9)" />
      <Path d="M6.3 6.3l5.4 5.4M5.2 9.6l4.4-4.4M8.4 12.8l4.4-4.4M12.6 12.6l1.6 1.6M14.2 14.2l1.3-.4 4.8 4.8a1.3 1.3 0 0 1-1.8 1.8l-4.8-4.8z" />
      <Circle cx="19" cy="5" r="1.8" />
    </>
  ),
  padel: (
    <>
      <Ellipse cx="9" cy="9" rx="5.5" ry="6.5" transform="rotate(-45 9 9)" />
      <Path d="M13.2 13.2l1-.2 5.6 5.6a1.4 1.4 0 0 1-2 2L12.2 15z" />
      <Circle cx="7.3" cy="8.2" r=".6" />
      <Circle cx="10.2" cy="7.6" r=".6" />
      <Circle cx="9" cy="10.6" r=".6" />
    </>
  ),
  volant: (
    <>
      <Path d="M9.5 18.5h5A2.5 2.5 0 0 1 12 21a2.5 2.5 0 0 1-2.5-2.5zM9.5 18.5L7 4h10l-2.5 14.5M10.6 4l.7 14.5M13.4 4l-.7 14.5" />
    </>
  ),
  pingpong: (
    <>
      <Circle cx="9.5" cy="9.5" r="6.5" />
      <Circle cx="9.5" cy="9.5" r="4" />
      <Path d="M13.6 14.4l4.9 4.9a1.5 1.5 0 0 0 2.1-2.1l-4.9-4.9" />
      <Circle cx="19.5" cy="4.5" r="1.8" />
    </>
  ),
  soccer: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 8.5l3 2.2-1.1 3.6h-3.8L9 10.7zM12 8.5V3.5M15 10.7l4.8-1.6M13.9 14.3l2.9 4.2M10.1 14.3l-2.9 4.2M9 10.7L4.2 9.1" />
    </>
  ),
  basket: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M3 12h18M12 3v18M5.6 5.6c3.2 3.4 3.2 9.4 0 12.8M18.4 5.6c-3.2 3.4-3.2 9.4 0 12.8" />
    </>
  ),
  volley: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M12 12V3M12 12l7.8 4.5M12 12l-7.8 4.5M12 3c3.5 2.5 5 6 4.5 10.5M19.8 16.5c-4 1-8-.2-10.5-3.5M4.2 16.5C3.8 12 5.8 8.5 9.5 6.5" />
    </>
  ),
  ovale: (
    <>
      <Path d="M4.5 19.5c-1.2-5 1.5-11.5 8.5-14.5 3.2-1.3 6-1 6.5-.5s.8 3.3-.5 6.5c-3 7-9.5 9.7-14.5 8.5z" />
      <Path d="M9 15l6-6M10.3 11.7l2 2M12.3 9.7l2 2M8.3 13.7l2 2" />
    </>
  ),
  balle: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M5.6 5.6c3.2 3.4 3.2 9.4 0 12.8M18.4 5.6c-3.2 3.4-3.2 9.4 0 12.8" />
    </>
  ),
  hockey: (
    <>
      <Path d="M8 3l6 14.5c.4 1 1.3 1.5 2.3 1.5H21" />
      <Ellipse cx="6" cy="18" rx="3" ry="1.3" />
      <Path d="M3 18v1.4c0 .8 1.3 1.3 3 1.3s3-.5 3-1.3V18" />
    </>
  ),
  baseball: (
    <>
      <Path d="M18.6 3.4c.9-.9 2.9 1.1 2 2L10 16l-2-2zM8 14l-3.2 3.2M4.8 17.2l2 2" />
      <Circle cx="6" cy="6" r="2.5" />
    </>
  ),
  frisbee: (
    <>
      <Ellipse cx="12" cy="12" rx="9" ry="3.8" />
      <Path d="M3 12v1.5c0 2.1 4 3.8 9 3.8s9-1.7 9-3.8V12" />
    </>
  ),
  gant: (
    <>
      <Path d="M7.5 13V8a5 5 0 0 1 5-5h1A4.5 4.5 0 0 1 18 7.5V13a4 4 0 0 1-4 4h-2.5a4 4 0 0 1-4-4z" />
      <Path d="M8.5 17v3.5h8V17M7.5 10.5c-1.6 0-2.6 1-2.6 2.3s1 2.4 2.6 2.4" />
    </>
  ),
  ceinture: (
    <>
      <Path d="M3 10h7M14 10h7M3 13.5h7M14 13.5h7" />
      <Rect x="10" y="8.5" width="4" height="6.5" rx="1" />
      <Path d="M10.7 15l-2.2 6M13.3 15l2.2 6" />
    </>
  ),
  lutte: (
    <>
      <Circle cx="8" cy="5.5" r="2.2" />
      <Circle cx="16" cy="5.5" r="2.2" />
      <Path d="M4 21v-4.5l4-4.5 4 3 4-3 4 4.5V21" />
    </>
  ),
  nage: (
    <>
      <Circle cx="17" cy="6.5" r="2" />
      <Path d="M4 13l5-3.5 3 2 4-2.5" />
      <Path d="M2 17c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0M2 21c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
    </>
  ),
  goutte: (
    <>
      <Path d="M12 2.5c2.6 3 4 5.3 4 7.2a4 4 0 0 1-8 0c0-1.9 1.4-4.2 4-7.2z" />
      <Path d="M2 18c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" />
    </>
  ),
  pagaie: (
    <>
      <Path d="M3 14.5c4.5 2.6 13.5 2.6 18 0-4.5-1.6-13.5-1.6-18 0z" />
      <Path d="M7.5 5l9 14M5.6 2.9l2.8 1.8-1.1 1.8-2.8-1.8zM16.7 17.5l2.8 1.8-1.1 1.8-2.8-1.8z" />
    </>
  ),
  surf: (
    <>
      <Path d="M12 2c3.5 3 5 8 4 13-.6 3.2-2 5.8-4 7-2-1.2-3.4-3.8-4-7-1-5 .5-10 4-13z" />
      <Path d="M12 5.5v13" />
    </>
  ),
  aviron: (
    <>
      <Path d="M2 16c5 2.6 15 2.6 20 0" />
      <Path d="M5 8.5l6 7.5M19 8.5l-6 7.5M3.8 7l2.4 3M20.2 7l-2.4 3" />
    </>
  ),
  ski: (
    <>
      <Path d="M5 4l14 16M19 4L5 20" />
      <Path d="M3.5 5.5c.2-1.4 1-2 2.3-2.2M20.5 5.5c-.2-1.4-1-2-2.3-2.2" />
    </>
  ),
  planche: (
    <>
      <Path d="M5 18.5L18.5 5c1-1 2.5.5 1.5 1.5L6.5 20c-1 1-2.5-.5-1.5-1.5z" />
      <Path d="M8.8 13.3l1.9 1.9M13.3 8.8l1.9 1.9" />
    </>
  ),
  patin: (
    <>
      <Path d="M5 5h5.5v6c3.2 0 7 1 8.5 3.5V17H5z" />
      <Path d="M3 20.5h16.5c.8 0 1.5-.7 1.5-1.5M7.5 17v3.5M16 17v3.5" />
    </>
  ),
  skate: (
    <>
      <Path d="M2.5 12.5h19c0 1.4-1.1 2.5-2.5 2.5H5c-1.4 0-2.5-1.1-2.5-2.5z" />
      <Circle cx="7" cy="18.5" r="1.8" />
      <Circle cx="17" cy="18.5" r="1.8" />
    </>
  ),
  flocon: <Path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5M3.6 10.4l3.4-.9-.9-3.4M20.4 13.6l-3.4.9.9 3.4" />,
  lotus: (
    <>
      <Path d="M12 20c-4 0-8-1.8-9-5 3-.6 6.2.6 9 3 2.8-2.4 6-3.6 9-3-1 3.2-5 5-9 5z" />
      <Path d="M12 18c-2-2-3-5-3-8 0-2.5 1.3-5 3-7 1.7 2 3 4.5 3 7 0 3-1 6-3 8z" />
    </>
  ),
  etirement: (
    <>
      <Circle cx="12" cy="4" r="2" />
      <Path d="M4 8.5l8 2.5 8-2.5M12 11v4.5M12 15.5l-5 5.5M12 15.5l5 5.5" />
    </>
  ),
  musique: (
    <>
      <Path d="M9 18V5.5l11-2.5v13" />
      <Circle cx="6" cy="18" r="3" />
      <Circle cx="17" cy="16" r="3" />
    </>
  ),
  flamme: (
    <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3a2.5 2.5 0 0 0 2.5 2.8z" />
  ),
  kettlebell: (
    <>
      <Path d="M9 10.5V8a3 3 0 0 1 6 0v2.5" />
      <Path d="M6 15.5a6 6 0 0 1 12 0c0 2.3-.8 4.2-1.8 5.5H7.8C6.8 19.7 6 17.8 6 15.5z" />
    </>
  ),
  corde: (
    <>
      <Path d="M5 3v6M19 3v6" />
      <Path d="M5 9c0 8 3 12 7 12s7-4 7-12" />
    </>
  ),
  course: (
    <>
      <Circle cx="14.5" cy="4" r="2" />
      <Path d="M8 21l3-6 3 2.5V22M13.5 17.5l-2-5.5 4-1.5 2.5 3h3M11.5 12l-3.5.5-2.5 3" />
    </>
  ),
  escaliers: <Path d="M3 20.5h4.5V16H12v-4.5h4.5V7H21" />,
  marche: (
    <>
      <Circle cx="12.5" cy="4" r="2" />
      <Path d="M12.5 7.5l-1.5 6 3 3v4.5M11 13.5l-2.5 7.5M11.8 8.5l-3.3 3.3M13 8.5l3 3" />
    </>
  ),
  escalade: (
    <>
      <Path d="M3 20.5l6.5-12 4 6 2.5-3.5 5 9.5z" />
      <Circle cx="9.5" cy="13.5" r=".7" />
      <Circle cx="16" cy="15.5" r=".7" />
    </>
  ),
  golf: (
    <>
      <Path d="M8 20.5V3l9 3.8-9 3.8" />
      <Ellipse cx="8" cy="20.5" rx="4" ry="1" />
      <Circle cx="17" cy="18.5" r="1.5" />
    </>
  ),
  fer: (
    <>
      <Path d="M6.5 3.5c-2 3-2.5 7-1 10.5S9.5 20 12 20s5-2.5 6.5-6 1-7.5-1-10.5" />
      <Path d="M9.5 4.5c-1.2 2.3-1.4 5-.5 7.3S10.6 16 12 16s2.1-1.9 3-4.2.7-5-.5-7.3" />
    </>
  ),
  medaille: (
    <>
      <Circle cx="12" cy="15.5" r="5" />
      <Path d="M8.8 11.6L5.5 3h4l2.5 5.5M15.2 11.6L18.5 3h-4L12 8.5M12 13.3l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2z" />
    </>
  ),
};

export function IconeSport({ glyphe, size = 26, color = colors.pink, strokeWidth = 1.7 }: { glyphe: GlypheSport; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {GLYPHES[glyphe]}
    </Svg>
  );
}
