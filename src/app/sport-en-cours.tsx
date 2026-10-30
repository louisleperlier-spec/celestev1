import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { IconeSport } from '@/components/app/IconeSport';
import { confirmer } from '@/components/app/confirmer';
import { Appui, BigNumber, Button, Card, Icon, Segmente, Text, toast } from '@/components/ui';
import { NOMS_ZONES } from '@/lib/coeur';
import { INTENSITES, sportParId, type Intensite } from '@/lib/sports';
import { kcalEnDirect, useSportLive } from '@/store/sportLive';
import { alpha, colors, fonts, ui } from '@/theme';

const chrono = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`;
};

/** Sport en direct : chrono, BPM capté par l'Apple Watch (sinon estimé), zone, calories, pause, terminer. */
export default function SportEnCours() {
  const v = useSportLive(
    useShallow((s) => ({ run: s.run, sport: s.sport, el: s.el, bpm: s.bpm, zone: s.zone, src: s.src, paused: s.paused, intensite: s.intensite, hr: s.hr })),
  );
  const sp = sportParId(v.sport ?? undefined);
  if (!v.run || !sp) return <Redirect href="/ajouter" />;

  const moy = v.hr.length ? Math.round(v.hr.reduce((a, b) => a + b, 0) / v.hr.length) : 0;
  const terminer = () => {
    const r = useSportLive.getState().terminer();
    if (r) toast(`${sp.nom} enregistré · ${r.min} min · +${r.xp} XP`);
    else toast('Moins d’une minute : rien d’enregistré');
    if (router.canGoBack()) router.back();
    else router.navigate('/accueil');
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.head}>
        <Appui accessibilityRole="button" accessibilityLabel="Réduire" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/accueil'))} style={styles.rond}>
          <Icon name="left" />
        </Appui>
        <View style={styles.flex}>
          <Text style={styles.petit}>{v.paused ? 'En pause' : 'En cours'}</Text>
          <Text weight="bold" style={styles.titre}>
            {sp.nom}
          </Text>
        </View>
        <View style={styles.pastille}>
          <IconeSport glyphe={sp.icone} size={26} />
        </View>
      </View>

      <View style={styles.centre}>
        <BigNumber value={chrono(v.el)} size={64} color={v.paused ? colors.textSecondary : colors.text} />
        <Text style={styles.petit}>Durée</Text>
      </View>

      <Card style={styles.coeur}>
        <View style={styles.bpmLigne}>
          <Icon name="heart" size={26} color={colors.pink} strokeWidth={2.2} />
          <BigNumber value={String(Math.round(v.bpm))} unit="BPM" size={52} />
        </View>
        <Text style={styles.petit}>
          Zone {v.zone} · {NOMS_ZONES[v.zone - 1]} · {v.src === 'montre' ? 'Apple Watch' : 'estimé'}
        </Text>
        <View style={styles.zones}>
          {[1, 2, 3, 4, 5].map((z) => (
            <View key={z} style={[styles.zone, { backgroundColor: z <= v.zone ? alpha(colors.pink, 0.35 + z * 0.13) : ui.iconBg }]} />
          ))}
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text weight="bold" style={styles.statVal}>
              {kcalEnDirect(v.sport, v.el, v.intensite)}
            </Text>
            <Text style={styles.petit}>kcal</Text>
          </View>
          <View style={styles.stat}>
            <Text weight="bold" style={styles.statVal}>
              {moy || '—'}
            </Text>
            <Text style={styles.petit}>BPM moyen</Text>
          </View>
          <View style={styles.stat}>
            <Text weight="bold" style={styles.statVal}>
              {v.hr.length ? Math.round(Math.max(...v.hr)) : '—'}
            </Text>
            <Text style={styles.petit}>BPM max</Text>
          </View>
        </View>
      </Card>

      {v.src !== 'montre' && (
        <Text style={styles.astuce}>Pour le vrai BPM : lance un entraînement « Autre » dans l’app Exercice de ta montre, NÉA lit ta FC toutes les 5 s.</Text>
      )}

      <View style={styles.bas}>
        <Segmente
          options={(Object.keys(INTENSITES) as Intensite[]).map((k) => [k, INTENSITES[k].nom] as [Intensite, string])}
          value={v.intensite}
          onChange={(i) => useSportLive.getState().changerIntensite(i)}
        />
        <View style={styles.boutons}>
          <Button label={v.paused ? 'Reprendre' : 'Pause'} variant="dark" icon={v.paused ? 'play' : 'pause'} onPress={() => useSportLive.getState().pause()} style={styles.flex} />
          <Button label="Terminer" icon="check" onPress={terminer} style={styles.flex} />
        </View>
        <Appui
          accessibilityRole="button"
          onPress={() =>
            confirmer('Abandonner ?', 'Rien ne sera enregistré.', 'Abandonner', () => {
              useSportLive.getState().abandonner();
              router.back();
            })
          }
          style={styles.abandon}
        >
          <Text style={styles.petit}>Abandonner</Text>
        </Appui>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 },
  rond: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  pastille: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alpha(colors.pink, 0.12),
    boxShadow: `0 0 22px ${alpha(colors.pink, 0.35)}`,
  },
  titre: { fontSize: 24, lineHeight: 30 },
  petit: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  centre: { alignItems: 'center', marginTop: 28, marginBottom: 18 },
  coeur: { padding: 18, gap: 10, alignItems: 'center' },
  bpmLigne: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  zones: { flexDirection: 'row', gap: 6, alignSelf: 'stretch' },
  zone: { flex: 1, height: 8, borderRadius: 4 },
  stats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 6 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { ...fonts.bold, fontSize: 22, lineHeight: 28 },
  astuce: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 12, paddingHorizontal: 8 },
  bas: { marginTop: 'auto', gap: 14, paddingBottom: 12 },
  boutons: { flexDirection: 'row', gap: 12 },
  abandon: { alignSelf: 'center', padding: 6 },
});
