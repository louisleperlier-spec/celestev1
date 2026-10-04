import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Appui, Card, Icon, Text, type IconName } from '@/components/ui';
import { CARTES, defi, defisSemaine, possedees, TEXTES_RECORDS } from '@/lib/jeu';
import { lundiISO } from '@/lib/ligue';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

/** « 🎁 N cartes à ouvrir » : Accueil et récap de séance (rien s'il n'y a rien à ouvrir). */
export function BandeauCartes({ style }: { style?: object }) {
  const paquets = useProfil((s) => s.jeu.paquets);
  if (!paquets.length) return null;
  const n = paquets.reduce((a, p) => a + p.cartes.length, 0);
  return (
    <Appui onPress={() => router.push('/cartes/ouvrir')} accessibilityRole="button" style={[styles.bandeau, style]}>
      <Text style={styles.cadeau}>🎁</Text>
      <View style={styles.flex}>
        <Text weight="semibold" style={styles.h4}>
          {n === 1 ? 'Tu as gagné une carte !' : `Tu as ${n} cartes à ouvrir !`}
        </Text>
        <Text style={styles.p}>Touche pour la découvrir</Text>
      </View>
      <Icon name="right" size={18} color={colors.pink} />
    </Appui>
  );
}

/** Défis de la semaine (3), avec leur avancement ; chaque défi réussi donne un booster de 3 cartes. */
export function DefisSemaine() {
  const st = useProfil();
  const sem = lundiISO();
  const pris = st.jeu.defis.sem === sem ? st.jeu.defis.pris : [];
  const liste = defisSemaine(sem).map((id) => defi(id, st));
  return (
    <Card style={styles.carte}>
      <View style={styles.tete}>
        <Text weight="semibold" style={styles.h3}>
          Défis de la semaine
        </Text>
        <Text style={styles.p}>🎁 Booster par défi</Text>
      </View>
      {liste.map((d) => {
        const ok = pris.includes(d.id) || d.fait >= d.but;
        return (
          <View key={d.id} style={styles.defi}>
            <View style={[styles.ic, ok && styles.icOk]}>
              <Icon name={ok ? 'check' : (d.icone as IconName)} size={18} color={ok ? colors.onPrimary : colors.pink} strokeWidth={ok ? 2.6 : 1.9} />
            </View>
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.h4}>
                {d.titre}
              </Text>
              <View style={styles.barre}>
                <View style={[styles.rempli, { width: `${(d.fait / d.but) * 100}%` }]} />
              </View>
            </View>
            <Text weight="semibold" style={[styles.compte, ok && styles.compteOk]}>
              {ok ? 'Gagné' : `${d.fait}/${d.but}`}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

/** Entrée de la collection de cartes (Progrès). */
export function EntreeCollection() {
  const jeu = useProfil((s) => s.jeu);
  const n = possedees(jeu);
  const aOuvrir = jeu.paquets.reduce((a, p) => a + p.cartes.length, 0);
  return (
    <Appui onPress={() => router.push('/cartes')} accessibilityRole="button">
      <Card style={styles.entree}>
        <Text style={styles.cartesIc}>🃏</Text>
        <View style={styles.flex}>
          <Text weight="semibold" style={styles.h3}>
            Ma collection
          </Text>
          <Text style={styles.p}>
            {n} / {CARTES.length} cartes{aOuvrir ? ` · ${aOuvrir} à ouvrir` : ''}
          </Text>
          <View style={styles.barre}>
            <View style={[styles.rempli, { width: `${(n / CARTES.length) * 100}%` }]} />
          </View>
        </View>
        {aOuvrir > 0 && <View style={styles.point} />}
        <Icon name="right" size={18} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

/** Tes records (séance la plus lourde, plus longues sorties, meilleure série). */
export function MesRecords() {
  const rec = useProfil((s) => s.jeu.records);
  return (
    <Card style={styles.carte}>
      <Text weight="semibold" style={styles.h3}>
        Tes records 🏆
      </Text>
      <View style={styles.grille}>
        {TEXTES_RECORDS.map(([k, titre, f]) => (
          <View key={k} style={styles.tuile}>
            <Text style={styles.p}>{titre}</Text>
            <Text weight="bold" style={styles.valeur}>
              {rec[k] > 0 ? f(rec[k]) : '–'}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  bandeau: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: ui.selFond, borderWidth: 1, borderColor: ui.pinkRing },
  cadeau: { fontSize: 28, lineHeight: 34 },
  carte: { padding: 16 },
  tete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h3: { fontSize: 17, lineHeight: 22 },
  h4: { fontSize: 14.5, lineHeight: 19 },
  p: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  defi: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  ic: { width: 36, height: 36, borderRadius: 18, backgroundColor: ui.iconBg, alignItems: 'center', justifyContent: 'center' },
  icOk: { backgroundColor: colors.pink },
  barre: { height: 6, borderRadius: 3, backgroundColor: ui.dark, marginTop: 6, overflow: 'hidden' },
  rempli: { height: 6, borderRadius: 3, backgroundColor: colors.pink },
  compte: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, minWidth: 44, textAlign: 'right' },
  compteOk: { color: colors.pink },
  entree: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cartesIc: { fontSize: 30, lineHeight: 36 },
  point: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.pink },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tuile: { width: '48%', flexGrow: 1, backgroundColor: ui.dark, borderRadius: 14, padding: 12 },
  valeur: { fontSize: 20, lineHeight: 26, marginTop: 2 },
});
