import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import type { Pt } from '@/lib/velo';
import { alpha, colors } from '@/theme';

/** Secteur d'un sentier (vue satellite d'Apple Plans) ; avec le tracé d'OpenStreetMap s'il est connu. */
export function CarteSentier({ lat, lng, trace, depart, hauteur = 220, arrondi = true }: { lat: number; lng: number; trace?: readonly (readonly Pt[])[]; depart?: Pt; hauteur?: number; arrondi?: boolean }) {
  const tous = trace?.flat() ?? [];
  const la = tous.map((p) => p[0]);
  const lo = tous.map((p) => p[1]);
  const region = tous.length
    ? {
        latitude: (Math.min(...la) + Math.max(...la)) / 2,
        longitude: (Math.min(...lo) + Math.max(...lo)) / 2,
        latitudeDelta: Math.max(0.01, (Math.max(...la) - Math.min(...la)) * 1.5),
        longitudeDelta: Math.max(0.01, (Math.max(...lo) - Math.min(...lo)) * 1.5),
      }
    : { latitude: lat, longitude: lng, latitudeDelta: 0.08, longitudeDelta: 0.08 };
  const d = depart ?? [lat, lng];
  return (
    <View style={[styles.map, { height: hauteur }, !arrondi && styles.carre]}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} mapType="hybrid" userInterfaceStyle="dark" pitchEnabled={false} showsPointsOfInterests={false}>
        {trace?.map((m, k) => (
          <Polyline key={k} coordinates={m.map((p) => ({ latitude: p[0], longitude: p[1] }))} strokeColor={colors.pink} strokeWidth={4} lineCap="round" lineJoin="round" />
        ))}
        <Marker coordinate={{ latitude: d[0], longitude: d[1] }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.depart} />
        </Marker>
      </MapView>
    </View>
  );
}

/** Rando en cours : tracé orange parcouru, départ, position actuelle (la carte suit la position). */
export function CarteRando({ pts }: { pts: readonly Pt[] }) {
  const coords = pts.map((p) => ({ latitude: p[0], longitude: p[1] }));
  const ici = coords[coords.length - 1];
  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        style={StyleSheet.absoluteFill}
        region={ici ? { latitude: ici.latitude, longitude: ici.longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 } : undefined}
        mapType="hybrid"
        userInterfaceStyle="dark"
        showsUserLocation
        showsPointsOfInterests={false}
      >
        {coords.length > 1 && (
          <>
            <Polyline coordinates={coords} strokeColor={alpha(colors.pink, 0.3)} strokeWidth={9} lineCap="round" lineJoin="round" />
            <Polyline coordinates={coords} strokeColor={colors.pink} strokeWidth={4} lineCap="round" lineJoin="round" />
            <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
              <View style={styles.depart} />
            </Marker>
          </>
        )}
        {ici && (
          <Marker coordinate={ici} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
            <View style={styles.halo}>
              <View style={styles.ici} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { borderRadius: 20, overflow: 'hidden', backgroundColor: colors.surface },
  carre: { borderRadius: 0 },
  depart: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.pink, borderWidth: 3, borderColor: colors.text },
  halo: { width: 44, height: 44, borderRadius: 22, backgroundColor: alpha(colors.pink, 0.3), alignItems: 'center', justifyContent: 'center' },
  ici: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.text, borderWidth: 4, borderColor: colors.pink },
});
