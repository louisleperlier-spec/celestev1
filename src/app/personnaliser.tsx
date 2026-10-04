import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnTetePage } from '@/components/app/Catalogue';
import { Button, Icon, Text, toast } from '@/components/ui';
import { ACCUEIL_DEFAUT, CARTES_ACCUEIL, ordreAccueil, type CarteAccueil } from '@/lib/accueil';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

/** « Mon écran d'accueil » : cartes de l'Accueil à afficher ou masquer, et leur ordre. */
export default function Personnaliser() {
  const liste = ordreAccueil(useProfil((s) => s.accueil));
  const set = useProfil((s) => s.set);
  const maj = (l: CarteAccueil[]) => set({ accueil: l });

  const deplacer = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= liste.length) return;
    const l = [...liste];
    [l[i], l[j]] = [l[j], l[i]];
    maj(l);
  };
  const basculer = (i: number) => maj(liste.map((c, k) => (k === i ? { ...c, on: !c.on } : c)));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <EnTetePage titre="Mon écran d'accueil" sous="Choisis tes cartes et leur ordre" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.groupe}>
          {liste.map((c, i) => {
            const d = CARTES_ACCUEIL[c.id];
            return (
              <View key={c.id} style={[styles.ligne, i > 0 && styles.sep]}>
                <View style={styles.fleches}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Monter ${d.titre}`}
                    disabled={i === 0}
                    onPress={() => deplacer(i, -1)}
                    hitSlop={6}
                  >
                    <Icon name="left" size={18} color={i === 0 ? colors.border2 : colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Descendre ${d.titre}`}
                    disabled={i === liste.length - 1}
                    onPress={() => deplacer(i, 1)}
                    hitSlop={6}
                  >
                    <Icon name="right" size={18} color={i === liste.length - 1 ? colors.border2 : colors.textSecondary} />
                  </Pressable>
                </View>
                <View style={styles.flex}>
                  <Text weight="semibold" style={[styles.titre, !c.on && styles.eteint]}>
                    {d.titre}
                  </Text>
                  <Text style={styles.sous}>{d.sous}</Text>
                </View>
                <Switch
                  value={c.on}
                  onValueChange={() => basculer(i)}
                  trackColor={{ true: colors.pink, false: ui.dark }}
                  thumbColor={colors.text}
                  accessibilityLabel={`Afficher ${d.titre}`}
                />
              </View>
            );
          })}
        </View>
        <Text style={styles.note}>Les flèches changent l&apos;ordre des cartes sur l&apos;Accueil.</Text>
        <Button
          label="Rétablir l'écran par défaut"
          variant="dark"
          onPress={() => {
            maj([...ACCUEIL_DEFAUT]);
            toast('Écran par défaut rétabli');
          }}
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  groupe: { borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  // Flèches gauche / droite tournées : haut / bas.
  fleches: { gap: 8, transform: [{ rotate: '90deg' }], flexDirection: 'row' },
  titre: { fontSize: 16, lineHeight: 21 },
  eteint: { color: colors.textSecondary },
  sous: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },
  note: { fontSize: 13, lineHeight: 18, color: colors.textTertiary, marginTop: 10, paddingHorizontal: 4 },
  btn: { marginTop: 18 },
});
