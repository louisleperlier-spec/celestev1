import { StyleSheet, View } from 'react-native';
import MapView, { Polygon, type Region } from 'react-native-maps';

import { sommets } from '@/lib/territoires';
import type { Pt } from '@/lib/velo';
import type { CaseProprio, Lien } from '@/store/territoires';
import { alpha, colors, ui } from '@/theme';

/** Couleur d'une case selon son propriétaire : moi en rose, amis et équipe en mauve, les autres en gris clair. */
export const couleurLien = (l: Lien) => (l === 'moi' ? colors.pink : l === 'autre' ? colors.textSecondary : colors.mauve);

export type Zone = { nord: number; sud: number; ouest: number; est: number };

/** Carte des territoires (Apple Plans en sombre) : un hexagone par case possédée ; bordure épaisse = bouclier de 24 h. */
export function CarteTerritoires({ depart, cases, onZone }: { depart: Pt; cases: readonly CaseProprio[]; onZone: (z: Zone) => void }) {
  const zone = (r: Region) =>
    onZone({ nord: r.latitude + r.latitudeDelta / 2, sud: r.latitude - r.latitudeDelta / 2, ouest: r.longitude - r.longitudeDelta / 2, est: r.longitude + r.longitudeDelta / 2 });
  const initiale: Region = { latitude: depart[0], longitude: depart[1], latitudeDelta: 0.02, longitudeDelta: 0.02 };
  return (
    <View style={styles.map}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initiale}
        onMapReady={() => zone(initiale)}
        onRegionChangeComplete={zone}
        userInterfaceStyle="dark"
        showsUserLocation
        pitchEnabled={false}
        rotateEnabled={false}
        showsPointsOfInterests={false}
      >
        {cases.map((c) => {
          const col = couleurLien(c.lien);
          return (
            <Polygon
              key={`${c.q}:${c.r}`}
              coordinates={sommets(c).map((p) => ({ latitude: p[0], longitude: p[1] }))}
              fillColor={alpha(col, c.lien === 'moi' ? 0.42 : 0.3)}
              strokeColor={c.bouclier ? colors.text : alpha(col, 0.9)}
              strokeWidth={c.bouclier ? 2 : 1}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { marginTop: 12, marginHorizontal: 20, height: 380, overflow: 'hidden', borderRadius: 20, backgroundColor: ui.carte },
});
