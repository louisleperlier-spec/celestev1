import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

/** Icônes des notes du soir (maquette « Notes du soir »), au trait arrondi comme `Icon` (viewBox 24). */
const GLYPHES: Record<string, React.ReactNode> = {
  cafe: <Path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c-.6.8-.6 1.7 0 2.5M12 3.5c-.6.8-.6 1.7 0 2.5" />,
  repas: <Path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2 1.5-3 4-3 7v3h3" />,
  alcool: <Path d="M7 3h10l-1 6a4 4 0 0 1-8 0zM12 13v7M8.5 21h7" />,
  sieste: (
    <>
      <Path d="M3 18v-6.5a2.5 2.5 0 0 1 2.5-2.5H19a2 2 0 0 1 2 2V18M3 15h18M3 18v2M21 18v2" />
      <Rect x="5" y="10.5" width="5" height="3.2" rx="1.2" />
    </>
  ),
  stress: <Path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />,
  fatigue: (
    <>
      <Rect x="3" y="7.5" width="16" height="9" rx="2" />
      <Path d="M21 10.5v3M6 10.5v3" />
    </>
  ),
  bonne: (
    <>
      <Circle cx="12" cy="12" r="9" />
      <Path d="M8.5 14.5c1.8 2 5.2 2 7 0M9 9.5h.01M15 9.5h.01" />
    </>
  ),
  malade: <Path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0zM12 10v7" />,
  lecture: <Path d="M3 5.5c3-1.5 6-1.5 9 .5 3-2 6-2 9-.5V19c-3-1.5-6-1.5-9 .5-3-2-6-2-9-.5zM12 6v13.5" />,
  infusion: <Path d="M5 20c0-8 5-14 14-15-1 9-7 14-14 15zM5 20l7.5-7.5" />,
  bain: <Path d="M12 3c3 4 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0C6.5 10 9 7 12 3z" />,
  ecrans: (
    <>
      <Rect x="3" y="4" width="18" height="12" rx="2" />
      <Path d="M8 20h8M12 16v4" />
    </>
  ),
};

export function IconeNote({ id, size = 22, color = colors.text }: { id: string; size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {GLYPHES[id]}
    </Svg>
  );
}
