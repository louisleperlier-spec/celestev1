import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/app/Sheet';
import { Card, Icon, Text } from '@/components/ui';
import { SUCCES_IMAGES, SUCCES_RATIO } from '@/data/succesImages';
import { RARETES } from '@/lib/jeu';
import { avancement, debloque, missionFaite, SUCCES, succes, type Mission, type SuccesId } from '@/lib/succes';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

const LARGEUR = 112;

const compte = (m: Mission, v: number) => {
  const n = Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
  return m.unite ? `${n} / ${m.but} ${m.unite}` : `${n} / ${m.but}`;
};

/** Tes succès (Progrès) : 5 cartes d'Axel, grisées tant que leurs 2 missions ne sont pas faites ; fiche avec l'avancement. */
export function MesSucces() {
  const st = useProfil();
  const [choisi, setChoisi] = useState<SuccesId | null>(null);
  const faits = SUCCES.filter((s) => debloque(s, st)).length;
  const s = choisi ? succes(choisi) : null;
  return (
    <Card style={styles.carte}>
      <View style={styles.tete}>
        <Text weight="semibold" style={styles.h3}>
          Tes succès 🏅
        </Text>
        <Text style={styles.p}>
          {faits} / {SUCCES.length} débloqués
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rangee} style={styles.defile}>
        {SUCCES.map((x) => {
          const ok = debloque(x, st);
          const n = x.missions.filter((m) => missionFaite(m, st)).length;
          return (
            <Pressable key={x.id} onPress={() => setChoisi(x.id)} accessibilityRole="button" accessibilityLabel={`${x.nom}, ${ok ? 'débloqué' : `${n} mission sur 2`}`}>
              <View style={styles.mini}>
                <Image source={SUCCES_IMAGES[x.id]} style={[styles.img, !ok && styles.terne]} contentFit="contain" />
                {!ok && (
                  <View style={styles.verrou}>
                    <Icon name="lock" size={18} color={colors.text} />
                    <Text weight="semibold" style={styles.verrouTxt}>
                      {n}/2
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <Sheet visible={!!s} onClose={() => setChoisi(null)} title={s?.nom ?? ''}>
        {s && (
          <View style={styles.detail}>
            <Image source={SUCCES_IMAGES[s.id]} style={[styles.grande, !debloque(s, st) && styles.terne]} contentFit="contain" />
            <Text weight="semibold" style={[styles.rarete, { color: ui.rarete[s.rarete] }]}>
              {RARETES[s.rarete]} · {String(s.num).padStart(3, '0')}/050
            </Text>
            {s.missions.map((m) => {
              const ok = missionFaite(m, st);
              const v = ok ? m.but : avancement(m, st);
              return (
                <View key={m.id} style={styles.mission}>
                  <View style={[styles.ic, ok && styles.icOk]}>
                    <Icon name={ok ? 'check' : 'target'} size={18} color={ok ? colors.onPrimary : colors.pink} strokeWidth={ok ? 2.6 : 1.9} />
                  </View>
                  <View style={styles.flex}>
                    <Text weight="semibold" style={styles.h4}>
                      {m.titre}
                    </Text>
                    <Text style={styles.p}>{m.texte}</Text>
                    <View style={styles.barre}>
                      <View style={[styles.rempli, { width: `${(v / m.but) * 100}%` }]} />
                    </View>
                    <Text style={styles.p}>{ok ? 'Réussie' : compte(m, v)}</Text>
                  </View>
                  <Text weight="bold" style={[styles.xp, ok && styles.xpOk]}>
                    +{m.xp} XP
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Sheet>
    </Card>
  );
}

const styles = StyleSheet.create({
  carte: { padding: 16 },
  tete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h3: { fontSize: 17, lineHeight: 22 },
  h4: { fontSize: 14.5, lineHeight: 19 },
  p: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  flex: { flex: 1, minWidth: 0 },
  defile: { marginHorizontal: -16, marginTop: 12 },
  rangee: { gap: 10, paddingHorizontal: 16 },
  mini: { width: LARGEUR, height: LARGEUR / SUCCES_RATIO },
  img: { width: '100%', height: '100%' },
  terne: { opacity: 0.32 },
  verrou: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 4 },
  verrouTxt: { fontSize: 13, lineHeight: 17 },
  detail: { alignItems: 'center', gap: 6, paddingBottom: 12 },
  grande: { width: 220, height: 220 / SUCCES_RATIO },
  rarete: { fontSize: 13, lineHeight: 17, marginTop: 4 },
  mission: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, alignSelf: 'stretch' },
  ic: { width: 36, height: 36, borderRadius: 18, backgroundColor: ui.iconBg, alignItems: 'center', justifyContent: 'center' },
  icOk: { backgroundColor: colors.pink },
  barre: { height: 6, borderRadius: 3, backgroundColor: ui.dark, marginVertical: 5, overflow: 'hidden' },
  rempli: { height: 6, borderRadius: 3, backgroundColor: colors.pink },
  xp: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  xpOk: { color: colors.pink },
});
