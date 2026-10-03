import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CarteRando } from '@/components/app/CarteRando';
import { confirmer } from '@/components/app/confirmer';
import { Button, Icon, Text, type IconName } from '@/components/ui';
import { sentier } from '@/data/randos';
import { useRando } from '@/store/rando';
import { colors, fonts, ui } from '@/theme';

const hms = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const km1 = (v: number) => v.toFixed(1).replace('.', ',');

/** Rando en cours (maquette de l'utilisateur) : carte, distance au sommet, temps, distance, dénivelé, altitude, FC. */
export default function RandoEnCours() {
  const insets = useSafeAreaInsets();
  const r = useRando();
  const s = sentier(r.sentier);
  // Aller-retour : le sommet est à mi-parcours.
  const sommetKm = s ? s.km / 2 : 0;
  const reste = Math.max(0, sommetKm - r.dist);
  const part = s ? Math.min(1, r.dist / s.km) : 0;
  const dplusReste = s ? Math.max(0, s.dplus - r.dplus) : 0;

  const terminer = () => {
    confirmer('Terminer la rando ?', 'Ta rando sera enregistrée.', 'Terminer', () => {
      const res = useRando.getState().terminer();
      if (res) router.replace('/randonnee/recap');
      else router.back();
    });
  };

  return (
    <View style={styles.root}>
      <View style={styles.carte}>
        <CarteRando pts={r.pts} />
        <View style={[styles.haut, { top: insets.top + 6 }]}>
          <Pressable onPress={() => router.back()} style={styles.rond} accessibilityRole="button" accessibilityLabel="Retour">
            <Icon name="left" size={22} />
          </Pressable>
          <View style={styles.titre}>
            <Icon name="rando" size={20} color={colors.pink} />
            <View>
              <Text weight="semibold" style={styles.titreTxt}>
                {r.paused ? 'Rando en pause' : 'Rando en cours'}
              </Text>
              <Text style={styles.titreSous} numberOfLines={1}>
                {s?.nom ?? 'Rando libre'}
                {r.gps === 'sim' ? ' · simulation' : r.gps === null ? ' · recherche GPS' : ''}
              </Text>
            </View>
          </View>
          <View style={styles.rondVide} />
        </View>
      </View>

      <View style={[styles.panneau, { paddingBottom: 14 + insets.bottom }]}>
        <View style={styles.poignee} />
        {s ? (
          <>
            <Text weight="bold" style={styles.h1}>
              {reste > 0.05 ? `Sommet dans ${km1(reste)} km` : r.dist < s.km ? 'Cap sur l’arrivée !' : 'Sentier bouclé !'}
            </Text>
            <Text style={styles.sous}>{km1(r.dist)} km parcourus</Text>
            <View style={styles.barre}>
              <View style={[styles.rempli, { width: `${part * 100}%` }]} />
            </View>
          </>
        ) : (
          <Text weight="bold" style={styles.h1}>
            {km1(r.dist)} km parcourus
          </Text>
        )}

        <View style={styles.grands}>
          <Grand icone="clock" valeur={hms(r.el)} label="Temps" />
          <Grand icone="rando" valeur={`${km1(r.dist)} km`} label="Distance" />
        </View>
        <View style={styles.petits}>
          <Petit icone="trend" valeur={`${r.dplus} m`} label="D+ effectué" />
          {s && <Petit icone="montagne" valeur={`${dplusReste} m`} label="D+ restant" />}
          <Petit icone="montagne" valeur={r.alt != null ? `${Math.round(r.alt)} m` : '–'} label="Altitude" />
          <Petit icone="heart" valeur={`${r.bpm} bpm`} label="FC" />
        </View>

        <View style={styles.boutons}>
          <Pressable onPress={r.pause} style={styles.rondBas} accessibilityRole="button" accessibilityLabel={r.paused ? 'Reprendre' : 'Pause'}>
            <Icon name={r.paused ? 'play' : 'pause'} size={24} />
          </Pressable>
          <Button label="Terminer" icon="x" onPress={terminer} style={styles.flex} />
        </View>
      </View>
    </View>
  );
}

function Grand({ icone, valeur, label }: { icone: IconName; valeur: string; label: string }) {
  return (
    <View style={styles.grand}>
      <Icon name={icone} size={24} color={colors.pink} />
      <View>
        <Text weight="bold" style={styles.grandVal}>
          {valeur}
        </Text>
        <Text style={styles.lbl}>{label}</Text>
      </View>
    </View>
  );
}

function Petit({ icone, valeur, label }: { icone: IconName; valeur: string; label: string }) {
  return (
    <View style={styles.petit}>
      <Icon name={icone} size={18} color={colors.pink} />
      <Text weight="bold" style={styles.petitVal} numberOfLines={1}>
        {valeur}
      </Text>
      <Text style={styles.lbl} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  carte: { flex: 1, backgroundColor: colors.surface },
  haut: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rond: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  rondVide: { width: 44 },
  titre: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 7 },
  titreTxt: { fontSize: 15, lineHeight: 19 },
  titreSous: { fontSize: 12.5, lineHeight: 16, color: colors.textSecondary },
  panneau: { backgroundColor: colors.bgAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 8, marginTop: -24 },
  poignee: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 10 },
  h1: { fontSize: 26, lineHeight: 32, ...fonts.bold },
  sous: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginTop: 2 },
  barre: { height: 10, borderRadius: 5, backgroundColor: ui.dark, marginTop: 10, overflow: 'hidden' },
  rempli: { height: 10, borderRadius: 5, backgroundColor: colors.pink },
  grands: { flexDirection: 'row', gap: 8, marginTop: 14 },
  grand: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 18, padding: 14 },
  grandVal: { fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  lbl: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  petits: { flexDirection: 'row', gap: 4, marginTop: 8, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 12 },
  petit: { flex: 1, alignItems: 'center', gap: 3 },
  petitVal: { fontSize: 16, lineHeight: 21, fontVariant: ['tabular-nums'] },
  boutons: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  rondBas: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
