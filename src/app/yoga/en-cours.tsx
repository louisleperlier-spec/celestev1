import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmer } from '@/components/app/confirmer';
import { ImagePosture } from '@/components/app/Yoga';
import { BigNumber, Button, Icon, Text, toast } from '@/components/ui';
import { SEANCES_YOGA } from '@/data/yoga';
import { kcalSport, sportParId } from '@/lib/sports';
import { etapesJouees, mmss, TRANSITION, type EtapeJouee } from '@/lib/yoga';
import { enregistrerSport } from '@/store/activites';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

/** `pret` : quelques secondes pour s'installer dans la posture ; `tenue` : la posture est tenue. */
type Phase = 'pret' | 'tenue';
type Etat = { i: number; phase: Phase; fin: number; pause: number | null; actif: number; termine: boolean };

const debut = (now: number): Etat => ({ i: 0, phase: 'pret', fin: now + TRANSITION * 1000, pause: null, actif: 0, termine: false });

/** Passe à l'étape suivante (ou termine) ; `fait` = temps de tenue réellement pratiqué. */
function suivante(e: Etat, n: number, depart: number, fait: number): Etat {
  const actif = e.actif + fait;
  if (e.i + 1 >= n) return { ...e, actif, termine: true, pause: null };
  return { ...e, i: e.i + 1, phase: 'pret', fin: depart + TRANSITION * 1000, pause: null, actif };
}

/** Avance l'horloge : fin de préparation → tenue, fin de tenue → étape suivante. */
function avancer(e: Etat, etapes: readonly EtapeJouee[], now: number): Etat {
  if (e.termine || e.pause !== null || now < e.fin) return e;
  if (e.phase === 'pret') return { ...e, phase: 'tenue', fin: e.fin + etapes[e.i].sec * 1000 };
  return suivante(e, etapes.length, e.fin, etapes[e.i].sec * 1000);
}

const COTE = { droit: 'Côté droit', gauche: 'Côté gauche' } as const;

/** Séance de yoga guidée : posture, côté, minuteur de tenue, consignes, à suivre ; pause, précédente, suivante ; bilan enregistré. */
export default function YogaEnCours() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = SEANCES_YOGA.find((x) => x.id === id);
  const etapes = useMemo(() => (s ? etapesJouees(s) : []), [s]);
  const poids = useProfil((p) => p.weight);
  const [now, setNow] = useState(Date.now);
  const [e, setE] = useState<Etat>(() => debut(Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      setE((x) => avancer(x, etapes, n));
    }, 250);
    return () => clearInterval(t);
  }, [etapes]);

  // Petite vibration à chaque changement de posture ou de phase.
  useEffect(() => {
    if (!e.termine) Vibration.vibrate(e.phase === 'tenue' ? 40 : 15);
  }, [e.i, e.phase, e.termine]);

  if (!s || !etapes.length) return null;

  const et = etapes[Math.min(e.i, etapes.length - 1)];
  const reste = Math.max(0, e.pause ?? e.fin - now);
  const tenue = e.phase === 'tenue';
  const apres = etapes[e.i + 1];
  // Temps restant de toute la séance : l'étape en cours puis les suivantes avec leurs transitions.
  const resteTotal = reste + (tenue ? 0 : et.sec * 1000) + etapes.slice(e.i + 1).reduce((a, x) => a + (x.sec + TRANSITION) * 1000, 0);
  const minutes = Math.round(e.actif / 60e3);
  const met = sportParId('yoga')?.met ?? 2.5;

  const passer = () => {
    const t = Date.now();
    setE((x) => (x.phase === 'pret' ? { ...x, phase: 'tenue', fin: t + etapes[x.i].sec * 1000, pause: null } : suivante(x, etapes.length, t, etapes[x.i].sec * 1000 - Math.max(0, x.pause ?? x.fin - t))));
  };
  const precedente = () => {
    const t = Date.now();
    setE((x) => ({ ...x, i: Math.max(0, x.i - 1), phase: 'pret', fin: t + TRANSITION * 1000, pause: null }));
  };
  const basculer = () => {
    const t = Date.now();
    setE((x) => (x.pause === null ? { ...x, pause: Math.max(0, x.fin - t) } : { ...x, fin: t + x.pause, pause: null }));
  };
  const quitter = () => {
    if (e.actif < 60e3) return router.back();
    confirmer('Terminer la séance ?', 'Ce que tu as déjà fait sera proposé à l’enregistrement.', 'Terminer', () => setE((x) => ({ ...x, termine: true, pause: null })));
  };
  const enregistrer = () => {
    const r = enregistrerSport('yoga', minutes, 'moderee', false, undefined, s.titre);
    if (r) toast(`Séance enregistrée · +${r.xp} XP`);
    router.back();
  };

  if (e.termine)
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.fin}>
          <Text style={styles.emoji}>🙏</Text>
          <Text style={styles.h1}>Namasté</Text>
          <Text style={styles.sous}>{s.titre} terminée.</Text>
          <View style={styles.chiffres}>
            <View style={styles.chiffre}>
              <BigNumber value={String(minutes)} unit="min" size={44} />
              <Text style={styles.p}>de pratique</Text>
            </View>
            <View style={styles.chiffre}>
              <BigNumber value={String(kcalSport(met, poids, minutes, 'moderee'))} unit="kcal" size={44} />
              <Text style={styles.p}>estimées</Text>
            </View>
          </View>
          {minutes >= 1 ? (
            <Button label="Enregistrer ma séance" onPress={enregistrer} style={styles.large} />
          ) : (
            <Text style={[styles.p, styles.centre]}>Moins d’une minute : rien à enregistrer.</Text>
          )}
          <Button label="Fermer" variant="dark" onPress={() => router.back()} style={styles.large} />
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.haut}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quitter" onPress={quitter} style={styles.rond} hitSlop={10}>
          <Icon name="x" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.compteur}>
          {e.i + 1} / {etapes.length}
        </Text>
        <Text style={[styles.compteur, styles.total]}>{mmss(resteTotal / 1000)}</Text>
      </View>
      <View style={styles.barre}>
        <View style={[styles.barreIn, { width: `${((e.i + (tenue ? 0.5 : 0)) / etapes.length) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.centreur} showsVerticalScrollIndicator={false}>
        <Text style={styles.phase}>{tenue ? 'Tiens la posture' : e.i === 0 ? 'Installe-toi' : 'Prépare-toi'}</Text>
        <ImagePosture posture={et.posture} taille={240} style={styles.image} />
        <Text weight="bold" style={styles.nom}>
          {et.posture.nom}
        </Text>
        {et.cote && (
          <View style={styles.cote}>
            <Text weight="semibold" style={styles.coteTxt}>
              {COTE[et.cote]}
            </Text>
          </View>
        )}
        <BigNumber value={mmss(reste / 1000)} size={64} color={tenue ? colors.text : colors.pink} style={styles.chrono} />
        {et.posture.consignes.map((c) => (
          <Text key={c} style={styles.consigne}>
            {c}
          </Text>
        ))}
        <Text style={styles.souffle}>{et.posture.souffle}</Text>
        {apres && (
          <Text style={styles.suivre}>
            À suivre : {apres.posture.nom}
            {apres.cote ? ` (${COTE[apres.cote].toLowerCase()})` : ''}
          </Text>
        )}
      </ScrollView>

      <View style={styles.commandes}>
        <Pressable accessibilityRole="button" accessibilityLabel="Posture précédente" onPress={precedente} style={styles.petit} hitSlop={8}>
          <Icon name="left" size={24} color={colors.text} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={e.pause === null ? 'Pause' : 'Reprendre'} onPress={basculer} style={styles.grand}>
          <Icon name={e.pause === null ? 'pause' : 'play'} size={30} color={colors.onPrimary} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Posture suivante" onPress={passer} style={styles.petit} hitSlop={8}>
          <Icon name="right" size={24} color={colors.text} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6 },
  rond: { width: 40, height: 40, borderRadius: 20, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  compteur: { ...fonts.semibold, fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  total: { minWidth: 40, textAlign: 'right', fontVariant: ['tabular-nums'] },
  barre: { height: 4, borderRadius: 2, backgroundColor: ui.dark, marginHorizontal: 20, marginTop: 12, overflow: 'hidden' },
  barreIn: { height: 4, backgroundColor: colors.pink },
  centreur: { alignItems: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  phase: { ...fonts.semibold, fontSize: 14, lineHeight: 18, color: colors.pink, marginTop: 14 },
  image: { marginTop: 12 },
  nom: { fontSize: 28, lineHeight: 34, textAlign: 'center', marginTop: 14 },
  cote: { marginTop: 8, borderRadius: 100, backgroundColor: colors.pink, paddingHorizontal: 12, paddingVertical: 4 },
  coteTxt: { fontSize: 13, lineHeight: 17, color: colors.onPrimary },
  chrono: { marginTop: 10 },
  consigne: { fontSize: 15, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  souffle: { ...fonts.semibold, fontSize: 14, lineHeight: 19, color: colors.text, textAlign: 'center', marginTop: 10 },
  suivre: { fontSize: 14, lineHeight: 19, color: colors.textTertiary, marginTop: 14 },
  commandes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36, paddingVertical: 12 },
  petit: { width: 52, height: 52, borderRadius: 26, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  grand: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  fin: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 6 },
  emoji: { fontSize: 56, lineHeight: 68 },
  h1: { ...fonts.bold, fontSize: 34, lineHeight: 40 },
  sous: { fontSize: 16, lineHeight: 22, color: colors.textSecondary, textAlign: 'center' },
  chiffres: { flexDirection: 'row', gap: 16, marginVertical: 20 },
  chiffre: { alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: colors.surface, minWidth: 130 },
  p: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  centre: { textAlign: 'center', marginBottom: 8 },
  large: { alignSelf: 'stretch', marginTop: 8 },
});
