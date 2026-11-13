import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { BigNumber, Text } from '@/components/ui';
import { dec } from '@/lib/charges';
import type { Log } from '@/lib/xp';
import { useProfil } from '@/store/profil';
import { alpha, colors } from '@/theme';

/**
 * Cartes de mesures du design 10K « Progression » (process-profile-progress, ProfileMetricChartDesign) : carte de 28 pt de rayon
 * et 18 pt de marge, titre gris de 14 pt, cadre sombre (rayon 18) avec le chiffre en 34 pt, son unité, un graphique de 132 pt
 * (barres + tendance, aire, courbe lumineuse ou pointillés) et « Évolution : … vs période précédente. ».
 */

export type Style = 'barres' | 'aire' | 'courbe' | 'pointilles';
type Point = { v: number; lib: string };

const H = 132;
/** Police système dans les graphiques SVG (sinon une police à empattement dans le navigateur). */
const POLICE = Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : undefined;
const HAUT_LIBS = 20;

/** Courbe lissée (contrôles au milieu, comme ProfileAnalyticsLineShape). */
function chemin(pts: { x: number; y: number }[]) {
  if (!pts.length) return '';
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const m = (a.x + b.x) / 2;
    d += ` C${m} ${a.y} ${m} ${b.y} ${b.x} ${b.y}`;
  }
  return d;
}

/** Graphique d'une mesure, dessiné en SVG à la largeur du cadre. */
function Graphique({ points, style, unite }: { points: Point[]; style: Style; unite: string }) {
  const [w, setW] = useState(0);
  const axeY = style === 'pointilles' ? 32 : 0;
  const h = H - HAUT_LIBS;
  const vals = points.map((p) => p.v);
  let min = style === 'barres' ? 0 : Math.min(...vals);
  let max = Math.max(...vals);
  if (style !== 'barres') {
    const marge = Math.max((max - min) * 0.15, 0.5);
    min -= marge;
    max += marge;
  } else max = Math.max(max, 1);
  const etendue = Math.max(max - min, 0.5);
  // Marges : les barres et les libellés des bouts ne sont pas coupés ; 8 pt en haut pour le chiffre de la dernière barre.
  const G = 16;
  const HAUT = 8;
  const larg = Math.max(w - axeY - G * 2, 1);
  const xy = vals.map((v, i) => ({
    x: axeY + G + (vals.length === 1 ? larg / 2 : (larg * i) / (vals.length - 1)),
    y: HAUT + (h - HAUT) * (1 - (v - min) / etendue),
  }));
  // Libellés de l'axe : 7 au plus, répartis.
  const nLib = Math.min(7, points.length);
  const libs = Array.from({ length: nLib }, (_, k) => (nLib === 1 ? 0 : Math.round((k * (points.length - 1)) / (nLib - 1))));
  const ligne = chemin(xy);
  const aire = xy.length > 1 ? `${ligne} L${xy[xy.length - 1].x} ${h} L${xy[0].x} ${h} Z` : '';
  const barre = Math.max(6, Math.min(18, larg / Math.max(vals.length * 2, 1)));
  const dernier = xy[xy.length - 1];
  const nGrille = style === 'barres' ? 5 : 4;

  return (
    <View style={{ height: H }} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Animated.View entering={FadeIn.duration(600)}>
          <Svg width={w} height={H}>
            <Defs>
              <LinearGradient id="aireMetrique" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.pink} stopOpacity={style === 'courbe' ? 0.34 : 0.38} />
                <Stop offset="0.6" stopColor={colors.pink} stopOpacity={0.06} />
                <Stop offset="1" stopColor={colors.pink} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {/* Grille en pointillés */}
            {Array.from({ length: nGrille }, (_, i) => (
              <Line
                key={i}
                x1={axeY}
                x2={w}
                y1={HAUT + ((h - HAUT) * i) / (nGrille - 1)}
                y2={HAUT + ((h - HAUT) * i) / (nGrille - 1)}
                stroke={alpha(colors.textSecondary, 0.14)}
                strokeWidth={0.5}
                strokeDasharray="4 5"
              />
            ))}
            {style === 'pointilles' &&
              [0, 1, 2, 3].map((i) => (
                <SvgText key={i} x={14} y={HAUT + ((h - HAUT) * i) / 3 + 3} fontFamily={POLICE} fontSize={9} fill={alpha(colors.textSecondary, 0.7)} textAnchor="middle">
                  {dec(Math.round((max - (etendue * i) / 3) * 10) / 10)}
                </SvgText>
              ))}
            {style === 'barres' &&
              xy.map((p, i) => {
                const hb = Math.max(h - p.y, 4);
                return (
                  <Rect
                    key={i}
                    x={p.x - barre / 2}
                    y={h - hb}
                    width={barre}
                    height={hb}
                    rx={4}
                    fill={i === xy.length - 1 ? colors.pink : alpha(colors.textSecondary, 0.22)}
                  />
                );
              })}
            {style === 'barres' && xy.length > 1 && (
              <Path d={ligne} stroke={alpha(colors.text, 0.85)} strokeWidth={1.5} strokeDasharray="5 4" fill="none" strokeLinecap="round" />
            )}
            {style === 'barres' && dernier && (
              <SvgText x={dernier.x} y={Math.max(dernier.y - 8, 9)} fontFamily={POLICE} fontSize={10} fontWeight="600" fill={alpha(colors.text, 0.9)} textAnchor="middle">
                {String(vals[vals.length - 1])}
              </SvgText>
            )}
            {(style === 'aire' || style === 'courbe') && aire ? <Path d={aire} fill="url(#aireMetrique)" /> : null}
            {(style === 'aire' || style === 'courbe') && xy.length > 1 && (
              <Path d={ligne} stroke={colors.pink} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {style === 'courbe' && xy.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.pink} />)}
            {style === 'pointilles' && xy.length > 1 && (
              <Path d={ligne} stroke={colors.pink} strokeWidth={2} strokeDasharray="6 4" fill="none" strokeLinecap="round" />
            )}
            {style === 'pointilles' && dernier && <Circle cx={dernier.x} cy={dernier.y} r={3.5} fill={colors.pink} />}
            {/* Axe des x */}
            {libs.map((k) => (
              <SvgText key={k} x={xy[k]?.x ?? 0} y={h + 14} fontFamily={POLICE} fontSize={10} fontWeight="600" fill={alpha(colors.textSecondary, 0.75)} textAnchor="middle">
                {points[k].lib}
              </SvgText>
            ))}
          </Svg>
        </Animated.View>
      )}
      <Text style={styles.cache} accessibilityLabel={`${points.length} valeurs en ${unite}`} />
    </View>
  );
}

/** Carte d'une mesure : titre, cadre sombre (chiffre, unité, graphique, évolution) ; `action` en haut à droite. */
export function CarteMetrique({
  titre,
  valeur,
  unite,
  points,
  style,
  evolution,
  vide,
  action,
  onAction,
  onPress,
}: {
  titre: string;
  valeur: string | null;
  unite: string;
  points: Point[];
  style: Style;
  evolution?: ReactNode;
  vide: string;
  action?: string;
  onAction?: () => void;
  onPress?: () => void;
}) {
  return (
    <Pressable accessibilityRole={onPress ? 'button' : undefined} disabled={!onPress} onPress={onPress} style={styles.carte}>
      <View style={styles.tete}>
        <Text weight="medium" style={styles.titre}>
          {titre}
        </Text>
        {action && onAction ? (
          <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
            <Text weight="semibold" style={styles.action}>
              {action}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.puits}>
        <View style={styles.score}>
          {valeur != null ? (
            <BigNumber value={valeur} unit={unite} size={34} unitSize={18} gap={6} style={styles.scoreNombre} />
          ) : (
            <BigNumber value="—" size={34} color={colors.textSecondary} style={styles.scoreNombre} />
          )}
        </View>
        {points.length ? (
          <Graphique points={points} style={style} unite={unite} />
        ) : (
          <View style={styles.videZone}>
            <Text style={styles.videTxt}>{vide}</Text>
          </View>
        )}
        {evolution ? <Text style={styles.evolution}>{evolution}</Text> : null}
      </View>
    </Pressable>
  );
}

/** « Évolution : +2 vs période précédente. » (orange si mieux, gris sinon), ou « Stable ». */
export function Evolution({
  delta,
  format,
  mieuxSiBaisse = false,
  seuil = 0.05,
}: {
  delta: number | null;
  format: (d: number) => string;
  mieuxSiBaisse?: boolean;
  seuil?: number;
}) {
  if (delta == null) return null;
  if (Math.abs(delta) < seuil) return <>Stable vs la période précédente.</>;
  const mieux = mieuxSiBaisse ? delta < 0 : delta > 0;
  return (
    <>
      {'Évolution : '}
      <Text weight="bold" style={[styles.evolution, { color: mieux ? colors.pink : colors.text }]}>
        {format(delta)}
      </Text>
      {' vs période précédente.'}
    </>
  );
}

/* ---------------- Données des cartes ---------------- */

export type Periode = 'Semaine' | 'Mois' | 'Année';
const JOURS_LIB = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const MOIS_LIB = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const JOURS: Record<Periode, number> = { Semaine: 7, Mois: 30, Année: 365 };

/** Colonnes de la période (jours de la semaine, 4 semaines ou 12 mois) et ce qu'on y additionne. */
function colonnes(logs: readonly Log[], periode: Periode, now: Date, val: (l: Log) => number): Point[] {
  const somme = (f: (l: Log) => boolean) => logs.filter(f).reduce((a, l) => a + val(l), 0);
  if (periode === 'Semaine') {
    const lundi = new Date(now);
    lundi.setHours(0, 0, 0, 0);
    lundi.setDate(lundi.getDate() - ((now.getDay() + 6) % 7));
    return JOURS_LIB.map((lib, i) => {
      const d = new Date(lundi);
      d.setDate(lundi.getDate() + i);
      return { lib, v: somme((l) => new Date(l.d).toDateString() === d.toDateString()) };
    });
  }
  if (periode === 'Mois') {
    return [3, 2, 1, 0].map((k) => {
      const fin = +now - k * 7 * 864e5;
      return { lib: k === 0 ? 'SEM.' : `S-${k}`, v: somme((l) => +new Date(l.d) <= fin && +new Date(l.d) > fin - 7 * 864e5) };
    });
  }
  return MOIS_LIB.map((lib, m) => ({ lib, v: somme((l) => new Date(l.d).getFullYear() === now.getFullYear() && new Date(l.d).getMonth() === m) }));
}

const libJour = (d: string) => JOURS_LIB[(new Date(d.length === 10 ? d + 'T12:00' : d).getDay() + 6) % 7];
const moyenne = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
const hm = (h: number) => `${Math.floor(h)} h ${String(Math.round((h - Math.floor(h)) * 60)).padStart(2, '0')}`;

/** Rubrique Statistiques en cartes de mesures : séances, temps actif, sommeil, VFC nocturne, poids. */
export function Metriques({ periode, onPesee }: { periode: Periode; onPesee: () => void }) {
  const { logs, nights, hrvChecks, wlog, weight } = useProfil(
    useShallow((s) => ({ logs: s.logs, nights: s.nights, hrvChecks: s.hrvChecks, wlog: s.wlog, weight: s.weight })),
  );
  const [now] = useState(() => new Date());
  const jours = JOURS[periode];
  const debut = +now - jours * 864e5;
  const avant = debut - jours * 864e5;
  const dans = (d: string, a: number, b: number) => {
    const t = +new Date(d.length === 10 ? d + 'T12:00' : d);
    return t > a && t <= b;
  };
  const cur = logs.filter((l) => dans(l.d, debut, +now));
  const prec = logs.filter((l) => dans(l.d, avant, debut));
  const minCur = cur.reduce((a, l) => a + l.min, 0);
  const minPrec = prec.reduce((a, l) => a + l.min, 0);

  const nuits = nights.filter((n) => dans(n.d, debut, +now)).slice(-30);
  const nuitsPrec = nights.filter((n) => dans(n.d, avant, debut));
  const som = moyenne(nuits.map((n) => n.h));
  const somPrec = moyenne(nuitsPrec.map((n) => n.h));

  const vfc = [
    ...nights.filter((n) => n.hrv).map((n) => ({ d: n.d, v: n.hrv! })),
    ...hrvChecks.filter((c) => c.kind === 'matin').map((c) => ({ d: c.d, v: c.hrv })),
  ].sort((a, b) => +new Date(a.d) - +new Date(b.d));
  const vfcCur = vfc.filter((x) => dans(x.d, debut, +now)).slice(-30);
  const vfcMoy = moyenne(vfcCur.map((x) => x.v));
  const vfcPrec = moyenne(vfc.filter((x) => dans(x.d, avant, debut)).map((x) => x.v));

  const poids = wlog.filter((x) => dans(x.d, debut, +now));
  const dernier = wlog[wlog.length - 1]?.kg ?? weight;

  return (
    <View style={styles.pile}>
      <CarteMetrique
        titre="Séances"
        valeur={String(cur.length)}
        unite={cur.length > 1 ? 'séances' : 'séance'}
        points={colonnes(logs, periode, now, () => 1)}
        style="barres"
        vide="Aucune séance pour l'instant."
        evolution={<Evolution delta={cur.length - prec.length} format={(d) => (d > 0 ? '+' : '') + d} seuil={1} />}
      />
      <CarteMetrique
        titre="Temps actif"
        valeur={minCur >= 60 ? hm(minCur / 60) : String(minCur)}
        unite={minCur >= 60 ? '' : 'min'}
        points={colonnes(logs, periode, now, (l) => l.min)}
        style="aire"
        vide="Aucune activité pour l'instant."
        evolution={<Evolution delta={minCur - minPrec} format={(d) => (d > 0 ? '+' : '') + d + ' min'} seuil={1} />}
      />
      <CarteMetrique
        titre="Sommeil moyen"
        valeur={som != null ? hm(som) : null}
        unite=""
        points={nuits.map((n) => ({ v: Math.round(n.h * 10) / 10, lib: libJour(n.d) }))}
        style="courbe"
        vide="Note ta nuit pour voir ta courbe."
        onPress={() => router.push('/nuits')}
        evolution={
          som != null && somPrec != null ? (
            <Evolution delta={som - somPrec} format={(d) => (d > 0 ? '+' : '−') + Math.round(Math.abs(d) * 60) + ' min'} seuil={0.1} />
          ) : null
        }
      />
      <CarteMetrique
        titre="VFC nocturne"
        valeur={vfcMoy != null ? String(Math.round(vfcMoy)) : null}
        unite="ms"
        points={vfcCur.map((x) => ({ v: x.v, lib: libJour(x.d) }))}
        style="courbe"
        vide="Mesure ta récupération pour voir ta VFC."
        onPress={() => router.push('/recuperation')}
        evolution={
          vfcMoy != null && vfcPrec != null ? <Evolution delta={vfcMoy - vfcPrec} format={(d) => (d > 0 ? '+' : '') + Math.round(d) + ' ms'} seuil={1} /> : null
        }
      />
      <CarteMetrique
        titre="Poids"
        valeur={dec(dernier.toFixed(1))}
        unite="kg"
        points={poids.map((x) => ({ v: x.kg, lib: libJour(x.d) }))}
        style="pointilles"
        vide="Ajoute une pesée pour suivre ta courbe."
        action="+ Ajouter"
        onAction={onPesee}
        evolution={
          poids.length > 1 ? (
            <Evolution delta={poids[poids.length - 1].kg - poids[0].kg} format={(d) => (d > 0 ? '+' : '−') + dec(Math.abs(d).toFixed(1)) + ' kg'} seuil={0.1} />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pile: { gap: 16 },
  carte: {
    padding: 18,
    borderRadius: 28,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.text, 0.1),
    gap: 14,
    boxShadow: `0 6px 18px ${alpha(colors.bgAlt, 0.45)}`,
  },
  tete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titre: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  action: { fontSize: 13, lineHeight: 17, color: colors.pinkLight },
  puits: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: alpha(colors.bgAlt, 0.68),
    borderWidth: 0.5,
    borderColor: alpha(colors.text, 0.07),
    gap: 10,
  },
  score: { flexDirection: 'row', alignItems: 'baseline' },
  scoreNombre: { justifyContent: 'flex-start' },
  videZone: { height: H, alignItems: 'center', justifyContent: 'center' },
  videTxt: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
  evolution: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  cache: { position: 'absolute', width: 1, height: 1, opacity: 0 },
});
