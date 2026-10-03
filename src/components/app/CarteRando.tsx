import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import type { Pt } from '@/lib/velo';
import { alpha, colors } from '@/theme';

/** Secteur d'un sentier : vue satellite d'Apple Plans autour du point de départ approximatif. */
export function CarteSentier({ lat, lng, hauteur = 220 }: { lat: number; lng: number; hauteur?: number }) {
  return (
    <View style={[styles.map, { height: hauteur }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: lat, longitude: lng, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
        mapType="hybrid"
        userInterfaceStyle="dark"
        pitchEnabled={false}
        showsPointsOfInterests={false}
      >
        <Marker coordinate={{ latitude: lat, longitude: lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
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
  depart: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.pink, borderWidth: 3, borderColor: colors.text },
  halo: { width: 44, height: 44, borderRadius: 22, backgroundColor: alpha(colors.pink, 0.3), alignItems: 'center', justifyContent: 'center' },
  ici: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.text, borderWidth: 4, borderColor: colors.pink },
});
