import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import type { Pt } from '@/lib/velo';
import { alpha, colors, ui } from '@/theme';

import { CarteVide, TagSource } from './CarteVide';

/** Cadre de la carte autour du tracé (au moins ~500 m de côté). */
function region(pts: readonly Pt[]) {
  const la = pts.map((p) => p[0]);
  const lo = pts.map((p) => p[1]);
  const [a, b, c, d] = [Math.min(...la), Math.max(...la), Math.min(...lo), Math.max(...lo)];
  return {
    latitude: (a + b) / 2,
    longitude: (c + d) / 2,
    latitudeDelta: Math.max(0.005, (b - a) * 1.4),
    longitudeDelta: Math.max(0.005, (d - c) * 1.4),
  };
}

/** Carte du vélo sur iPhone : Apple Plans en mode sombre, tracé rose, départ vert, position actuelle. */
export function Carte({ pts, gps }: { pts: readonly Pt[]; gps: boolean }) {
  if (pts.length < 2)
    return (
      <View style={styles.map}>
        <CarteVide />
      </View>
    );
  const coords = pts.map((p) => ({ latitude: p[0], longitude: p[1] }));
  const fin = coords[coords.length - 1];
  return (
    <View style={styles.map}>
      <MapView style={StyleSheet.absoluteFill} region={region(pts)} userInterfaceStyle="dark" pitchEnabled={false} rotateEnabled={false} showsPointsOfInterests={false}>
        <Polyline coordinates={coords} strokeColor={alpha(colors.pink, 0.25)} strokeWidth={7} lineCap="round" lineJoin="round" />
        <Polyline coordinates={coords} strokeColor={colors.pinkLight} strokeWidth={3} lineCap="round" lineJoin="round" />
        <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.depart} />
        </Marker>
        <Marker coordinate={fin} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.halo}>
            <View style={styles.ici} />
          </View>
        </Marker>
      </MapView>
      <TagSource gps={gps} />
    </View>
  );
}

const styles = StyleSheet.create({
  map: { marginTop: 12, marginHorizontal: 20, height: 230, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: ui.carte },
  depart: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.green },
  halo: { width: 18, height: 18, borderRadius: 9, backgroundColor: alpha(colors.pink, 0.3), alignItems: 'center', justifyContent: 'center' },
  ici: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.text, borderWidth: 2, borderColor: colors.pink },
});
