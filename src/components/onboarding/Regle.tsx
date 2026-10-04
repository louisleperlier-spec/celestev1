import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/components/ui';
import { colors } from '@/theme';

const PAS_PX = 10;

type Props = {
  min: number;
  max: number;
  /** Écart entre deux graduations (0,5 kg, 1 lb). */
  pas: number;
  /** Une grande graduation (avec son nombre) toutes les `grand` unités. */
  grand: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
};

/** Règle horizontale à faire glisser, repère rose au centre (poids de l'onboarding). */
export function Regle({ min, max, pas, grand, value, onChange, label }: Props) {
  const [largeur, setLargeur] = useState(0);
  const defil = useRef<ScrollView>(null);
  const n = Math.round((max - min) / pas);
  const depart = Math.round((Math.min(max, Math.max(min, value)) - min) / pas) * PAS_PX;
  // Position de départ (contentOffset n'est pas appliqué partout) : une seule fois, quand la largeur est connue.
  const place = useRef(false);
  useEffect(() => {
    if (largeur && !place.current) {
      place.current = true;
      defil.current?.scrollTo({ x: depart, animated: false });
    }
  }, [largeur, depart]);

  return (
    <View style={styles.cadre} onLayout={(e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width)} accessibilityLabel={label} accessibilityValue={{ now: value, min, max }}>
      {largeur > 0 && (
        <ScrollView
          ref={defil}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={PAS_PX}
          decelerationRate="fast"
          contentOffset={{ x: depart, y: 0 }}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const i = Math.round(e.nativeEvent.contentOffset.x / PAS_PX);
            const v = Math.min(max, Math.max(min, +(min + i * pas).toFixed(1)));
            if (v !== value) onChange(v);
          }}
          contentContainerStyle={{ paddingHorizontal: largeur / 2 }}
        >
          <View style={styles.graduations}>
            {Array.from({ length: n + 1 }, (_, i) => {
              const v = +(min + i * pas).toFixed(1);
              const fort = Math.abs(v % grand) < 1e-6;
              const moyen = !fort && Math.abs(v % (grand / 2)) < 1e-6;
              return (
                <View key={i} style={styles.pas}>
                  <View style={[styles.trait, fort ? styles.fort : moyen ? styles.moyen : null]} />
                  {fort && <Text style={styles.nombre}>{v}</Text>}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
      <View style={styles.repere} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: { height: 110, borderRadius: 16, backgroundColor: colors.bgAlt, overflow: 'hidden', justifyContent: 'center' },
  graduations: { flexDirection: 'row', alignItems: 'flex-start', height: 80, paddingTop: 14 },
  pas: { width: PAS_PX, alignItems: 'center' },
  trait: { width: 1.5, height: 14, borderRadius: 1, backgroundColor: colors.textTertiary },
  moyen: { height: 22 },
  fort: { height: 32, backgroundColor: colors.textSecondary },
  nombre: { position: 'absolute', top: 40, width: 40, textAlign: 'center', fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  repere: { position: 'absolute', left: '50%', top: 8, width: 3, marginLeft: -1.5, height: 52, borderRadius: 2, backgroundColor: colors.pink },
});
