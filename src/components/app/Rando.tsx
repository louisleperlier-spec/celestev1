import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { Text } from '@/components/ui';
import { DIFFICULTES, type Difficulte, type PointAlt } from '@/lib/rando';
import { alpha, colors, ui } from '@/theme';

/** Pastille de difficulté (Facile vert, Modéré orange, Difficile rouge). */
export function PastilleDifficulte({ d, grand = false }: { d: Difficulte; grand?: boolean }) {
  const c = ui.difficulte[d];
  return (
    <View style={[styles.pastille, { borderColor: c, backgroundColor: alpha(c, 0.12) }, grand && styles.pastilleGrand]}>
      <Text weight="semibold" style={[styles.pastilleTxt, { color: c }, grand && styles.pastilleTxtGrand]}>
        {DIFFICULTES[d]}
      </Text>
    </View>
  );
}

/** Profil d'altitude : aire orange dégradée, départ, sommet et arrivée marqués. */
export function ProfilAltitude({ points, hauteur = 150, marges = 40 }: { points: readonly PointAlt[]; hauteur?: number; marges?: number }) {
  const { width } = useWindowDimensions();
  if (points.length < 2) return null;
  const W = width - marges;
  const G = 52;
  const H = hauteur;
  const alts = points.map((p) => p.alt);
  const min = Math.min(...alts);
  const max = Math.max(...alts);
  const kmMax = points[points.length - 1].km || 1;
  const x = (km: number) => G + (km / kmMax) * (W - G - 12);
  const y = (a: number) => 22 + (1 - (a - min) / Math.max(1, max - min)) * (H - 50);
  const ligne = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.km).toFixed(1)},${y(p.alt).toFixed(1)}`).join(' ');
  const iSommet = alts.indexOf(max);
  const s = points[iSommet];
  const bas = H - 26;
  return (
    <View>
      <Svg width={W} height={H}>
        <Defs>
          <LinearGradient id="profil" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.pink} stopOpacity={0.55} />
            <Stop offset="1" stopColor={colors.pink} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Line x1={G} x2={W - 12} y1={y(max)} y2={y(max)} stroke={colors.border} strokeDasharray="4 4" />
        <Line x1={G} x2={W - 12} y1={bas} y2={bas} stroke={colors.border} />
        <Line x1={x(s.km)} x2={x(s.km)} y1={y(max)} y2={bas} stroke={colors.border} strokeDasharray="3 4" />
        <Path d={`${ligne} L${x(kmMax)},${bas} L${G},${bas} Z`} fill="url(#profil)" />
        <Path d={ligne} stroke={colors.pink} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
        <Circle cx={x(s.km)} cy={y(max)} r={5} fill={colors.text} stroke={colors.pink} strokeWidth={2.5} />
      </Svg>
      <Text style={[styles.axe, { top: y(max) - 8 }]}>{max} m</Text>
      <Text style={[styles.axe, { top: bas - 22 }]}>{min} m</Text>
      <Text style={[styles.sommet, { left: Math.min(W - 70, Math.max(G, x(s.km) - 30)), top: Math.max(0, y(max) - 22) }]}>Sommet {max} m</Text>
      <View style={[styles.kms, { marginLeft: G }]}>
        <Text style={styles.axeBas}>0 km</Text>
        <Text style={styles.axeBas}>{kmMax.toFixed(1).replace('.', ',')} km</Text>
      </View>
    </View>
  );
}

const meteoEmoji = (code: number) => (code === 0 ? '☀️' : code <= 2 ? '🌤️' : code <= 3 ? '☁️' : code <= 48 ? '🌫️' : code <= 67 ? '🌧️' : code <= 77 ? '❄️' : code <= 82 ? '🌦️' : '⛈️');

export type Meteo = { t: number; ressenti: number; vent: number; emoji: string };

/** Météo actuelle au sommet (Open-Meteo, sans clé) ; null tant qu'elle n'est pas arrivée ou sans réseau. */
export function useMeteo(lat: number, lng: number, alt: number): Meteo | null {
  const [m, setM] = useState<Meteo | null>(null);
  useEffect(() => {
    let actif = true;
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&elevation=${alt}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&timezone=auto`,
    )
      .then((r) => r.json())
      .then((j: { current?: { temperature_2m: number; apparent_temperature: number; wind_speed_10m: number; weather_code: number } }) => {
        const c = j.current;
        if (actif && c) setM({ t: Math.round(c.temperature_2m), ressenti: Math.round(c.apparent_temperature), vent: Math.round(c.wind_speed_10m), emoji: meteoEmoji(c.weather_code) });
      })
      .catch(() => {});
    return () => {
      actif = false;
    };
  }, [lat, lng, alt]);
  return m;
}

const styles = StyleSheet.create({
  pastille: { borderWidth: 1.5, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  pastilleGrand: { paddingHorizontal: 14, paddingVertical: 6 },
  pastilleTxt: { fontSize: 12.5, lineHeight: 16 },
  pastilleTxtGrand: { fontSize: 15, lineHeight: 19 },
  axe: { position: 'absolute', left: 0, fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  sommet: { position: 'absolute', fontSize: 11.5, lineHeight: 15, color: colors.text },
  kms: { flexDirection: 'row', justifyContent: 'space-between', marginRight: 12, marginTop: -20 },
  axeBas: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
});
