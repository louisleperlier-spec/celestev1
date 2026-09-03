import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

/**
 * Jauge horizontale à 4 zones de couleur (D/C/B/A, mêmes seuils que `scoring.ts`) avec un
 * curseur qui indique la position du score du jour. Élément visuel signature de l'écran
 * Accueil, inspiré d'un widget de jauge à zones vu sur une appli de référence — construit à la
 * main, aucun asset externe.
 */

// `flex` est proportionnel à la largeur réelle de chaque zone (0-40 / 40-60 / 60-80 / 80-100)
// pour que le curseur (positionné en `left: value%`) tombe bien dans la bonne bande visuelle.
const ZONES = [
  { max: 40, flex: 40, color: Colors.gradeD },
  { max: 60, flex: 20, color: Colors.gradeC },
  { max: 80, flex: 20, color: Colors.gradeB },
  { max: 100, flex: 20, color: Colors.gradeA },
];

interface ZoneGaugeProps {
  value: number;
  height?: number;
}

export function ZoneGauge({ value, height = 10 }: ZoneGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const markerColor = ZONES.find((z) => clamped <= z.max)?.color ?? Colors.gradeA;

  return (
    <View style={[styles.track, { height }]}>
      {ZONES.map((zone, i) => (
        <View
          key={zone.max}
          style={[
            styles.zone,
            { flex: zone.flex, backgroundColor: zone.color },
            i === 0 && styles.zoneFirst,
            i === ZONES.length - 1 && styles.zoneLast,
          ]}
        />
      ))}
      <View style={[styles.markerWrap, { left: `${clamped}%` }]}>
        <View style={[styles.marker, { borderColor: markerColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    width: '100%',
    borderRadius: Radius.full,
    overflow: 'visible',
  },
  zone: {
    flex: 1,
  },
  zoneFirst: {
    borderTopLeftRadius: Radius.full,
    borderBottomLeftRadius: Radius.full,
  },
  zoneLast: {
    borderTopRightRadius: Radius.full,
    borderBottomRightRadius: Radius.full,
  },
  markerWrap: {
    position: 'absolute',
    top: '50%',
    marginLeft: -9,
    marginTop: -9,
  },
  marker: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
