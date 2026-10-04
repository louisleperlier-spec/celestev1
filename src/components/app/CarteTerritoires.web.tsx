import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Pt } from '@/lib/velo';
import type { CaseProprio, Lien } from '@/store/territoires';
import { colors, ui } from '@/theme';

export const couleurLien = (l: Lien) => (l === 'moi' ? colors.pink : l === 'autre' ? colors.textSecondary : colors.mauve);

export type Zone = { nord: number; sud: number; ouest: number; est: number };

/** Dans le navigateur, pas de carte Apple Plans : la zone autour du départ est quand même chargée pour les chiffres. */
export function CarteTerritoires({ depart, onZone }: { depart: Pt; cases: readonly CaseProprio[]; onZone: (z: Zone) => void }) {
  useEffect(() => {
    onZone({ nord: depart[0] + 0.01, sud: depart[0] - 0.01, ouest: depart[1] - 0.01, est: depart[1] + 0.01 });
  }, [depart, onZone]);
  return (
    <View style={styles.map}>
      <Text style={styles.txt}>La carte des territoires s&apos;affiche dans l&apos;app iPhone.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { marginTop: 12, marginHorizontal: 20, height: 160, borderRadius: 20, backgroundColor: ui.carte, alignItems: 'center', justifyContent: 'center', padding: 20 },
  txt: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
});
