import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Circle, ClipPath, Defs, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Icon, type IconName } from '@/components/ui';
import { colors } from '@/theme';

/**
 * Cadran de sommeil (design Process « Cadran de sommeil », BTSlider SwiftUI, iOS 26) porté en React Native pour tous les iPhone :
 * horloge de 24 h, deux poignées (coucher, réveil) qu'on fait glisser le long de l'anneau, arc choisi entre les deux, crans dans
 * l'arc, chiffres de l'horloge toutes les 2 h (0, 6, 12 et 18 plus marqués), lune en haut et soleil en bas, 60 petits traits.
 * Mécanique gardée : poignées de 52 pt (37 pt visibles), anneau de 320 pt, écart minimum de 0,1 tour (2 h 24) — si une poignée
 * approche trop l'autre, toute la plage tourne avec elle, comme le réglage du coucher d'Apple. Pas de 5 minutes.
 * Habillage NÉA : heures sur 24 h, gris neutres de l'app, poignée du réveil en orange.
 * Valeurs : fraction de la journée (0 = minuit en haut, 0,5 = midi en bas).
 */
const POIGNEE = 52;
const MARGE_POIGNEE = 15;
const ECART_MIN = 0.1;
const PAS = 1 / 288; // 5 minutes
/** Police des chiffres de l'horloge : celle du système (le SVG prendrait sinon une police à empattements dans le navigateur). */
const POLICE = Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : 'Helvetica Neue';

export const versFraction = (min: number) => (((min % 1440) + 1440) % 1440) / 1440;
export const versMinutes = (f: number) => Math.round(f * 1440) % 1440;

type Props = {
  coucher: number;
  reveil: number;
  onChange: (coucher: number, reveil: number) => void;
  taille?: number;
};

export function CadranSommeil({ coucher, reveil, onChange, taille = 320 }: Props) {
  const S = taille;
  const c = S / 2;
  const R = (S - POIGNEE) / 2;
  const interieur = S / 2 - POIGNEE;
  const bouton = POIGNEE - MARGE_POIGNEE;

  const point = (f: number, r: number) => {
    const a = f * 2 * Math.PI - Math.PI / 2;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  };

  // Arc du coucher au réveil, dans le sens des aiguilles d'une montre.
  const d = (reveil - coucher + 1) % 1;
  const pa = point(coucher, R);
  const pb = point(reveil, R);
  const arc = `M ${pa.x} ${pa.y} A ${R} ${R} 0 ${d > 0.5 ? 1 : 0} 1 ${pb.x} ${pb.y}`;

  // Glisser une poignée : celle la plus proche du doigt au départ.
  // Poignée tenue : 0 aucune, 1 coucher, 2 réveil (valeur partagée : lue dans les rappels du geste).
  const cible = useSharedValue(0);
  const angleDe = (x: number, y: number) => {
    let a = (Math.atan2(y - c, x - c) * 180) / Math.PI + 90;
    if (a < 0) a += 360;
    return Math.round(a / 360 / PAS) * PAS;
  };
  const geste = Gesture.Pan()
    .runOnJS(true)
    .minDistance(2)
    .onBegin((e) => {
      const dc = Math.hypot(e.x - point(coucher, R).x, e.y - point(coucher, R).y);
      const dr = Math.hypot(e.x - point(reveil, R).x, e.y - point(reveil, R).y);
      const plusProche = dc < dr ? 'coucher' : 'reveil';
      cible.set(Math.min(dc, dr) < POIGNEE ? (plusProche === 'coucher' ? 1 : 2) : 0);
    })
    .onUpdate((e) => {
      if (!cible.get()) return;
      const p = angleDe(e.x, e.y) % 1;
      const estCoucher = cible.get() === 1;
      const autre = estCoucher ? reveil : coucher;
      const diff = Math.abs(p - autre);
      if (Math.min(diff, 1 - diff) < ECART_MIN) {
        // Trop près : toute la plage tourne avec la poignée.
        const delta = p - (estCoucher ? coucher : reveil);
        onChange((coucher + delta + 1) % 1, (reveil + delta + 1) % 1);
      } else if (estCoucher) onChange(p, reveil);
      else onChange(coucher, p);
    })
    .onFinalize(() => {
      cible.set(0);
    });

  // Crans dans l'arc (un tous les 3 pt de circonférence, comme le design).
  const crans = Math.floor(S / 3);
  const largeurCran = POIGNEE / 4;

  return (
    <GestureHandlerRootView style={{ width: S, height: S }}>
      <GestureDetector gesture={geste}>
        <View style={{ width: S, height: S }} accessible accessibilityLabel="Cadran de sommeil : fais glisser le coucher et le réveil">
          <Svg width={S} height={S}>
            <Defs>
              <ClipPath id="arcCadran">
                <Path d={arc} stroke="#000" strokeWidth={bouton} strokeLinecap="round" fill="none" />
              </ClipPath>
            </Defs>
            {/* Anneau */}
            <Circle cx={c} cy={c} r={R} stroke={colors.surface} strokeWidth={POIGNEE} fill="none" />
            {/* Horloge */}
            <Circle cx={c} cy={c} r={interieur} fill={colors.surface2} />
            {Array.from({ length: 60 }, (_, i) => {
              const a = (i * 6 * Math.PI) / 180;
              const long = i % 5 === 0 ? 6 : 3;
              const r1 = interieur - 5;
              return (
                <Line
                  key={i}
                  x1={c + r1 * Math.sin(a)}
                  y1={c - r1 * Math.cos(a)}
                  x2={c + (r1 - long) * Math.sin(a)}
                  y2={c - (r1 - long) * Math.cos(a)}
                  stroke={colors.textTertiary}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              );
            })}
            {Array.from({ length: 12 }, (_, i) => {
              const h = i * 2;
              const fort = h % 6 === 0;
              const r = interieur - 26;
              const a = (i * 30 * Math.PI) / 180;
              return (
                <SvgText
                  key={h}
                  x={c + r * Math.sin(a)}
                  y={c - r * Math.cos(a) + 5}
                  fontSize={fort ? 14 : 12}
                  fontWeight={fort ? '700' : '600'}
                  fontFamily={POLICE}
                  fill={fort ? colors.text : colors.textTertiary}
                  textAnchor="middle"
                >
                  {String(h)}
                </SvgText>
              );
            })}
            {/* Arc choisi et ses crans */}
            <Path d={arc} stroke={colors.border2} strokeWidth={bouton} strokeLinecap="round" fill="none" />
            <G clipPath="url(#arcCadran)">
              {Array.from({ length: crans }, (_, i) => {
                const a = (i / crans) * 360;
                return (
                  <Rect
                    key={i}
                    x={c + R - largeurCran / 2}
                    y={c - 1}
                    width={largeurCran}
                    height={2}
                    rx={1}
                    fill={colors.surface}
                    transform={`rotate(${a} ${c} ${c})`}
                  />
                );
              })}
            </G>
          </Svg>
          {/* Lune en haut, soleil en bas, puis les deux poignées */}
          <View style={[styles.repere, { top: c - interieur + 44, left: c - 9 }]} pointerEvents="none">
            <Icon name="moon" size={18} color={colors.textSecondary} />
          </View>
          <View style={[styles.repere, { top: c + interieur - 62, left: c - 9 }]} pointerEvents="none">
            <Icon name="sun" size={18} color={colors.warn} />
          </View>
          <Poignee icone="moon" couleur={colors.textSecondary} point={point(coucher, R)} taille={bouton} />
          <Poignee icone="bell" couleur={colors.pink} point={point(reveil, R)} taille={bouton} />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

function Poignee({ icone, couleur, point, taille }: { icone: IconName; couleur: string; point: { x: number; y: number }; taille: number }) {
  return (
    <View pointerEvents="none" style={[styles.poignee, { width: taille, height: taille, borderRadius: taille / 2, left: point.x - taille / 2, top: point.y - taille / 2 }]}>
      <Icon name={icone} size={taille / 2.4} color={couleur} strokeWidth={2.2} />
    </View>
  );
}

const styles = StyleSheet.create({
  repere: { position: 'absolute' },
  poignee: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border2, boxShadow: '0 1px 2px rgba(0,0,0,0.35)' },
});
