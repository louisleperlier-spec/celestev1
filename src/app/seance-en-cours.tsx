import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { CameraCoach, cameraDisponible } from '@/components/app/CameraCoach';
import { CoachFace } from '@/components/app/CoachFace';
import { DemoSheet } from '@/components/app/DemoSheet';
import { LivePills } from '@/components/app/LivePills';
import { Recap } from '@/components/app/Recap';
import { ZoneBar } from '@/components/app/ZoneBar';
import { ZoomExercice } from '@/components/app/ZoomExercice';
import { BigNumber, Glow, Icon, Text, type IconName } from '@/components/ui';
import { EXERCICE_IMAGES } from '@/data';
import type { ExerciceId, SeanceId } from '@/data/types';
import { loadFor, rj } from '@/lib/charges';
import { mmss } from '@/lib/coeur';
import { coachById, exercice, exKcal } from '@/lib/plan';
import { catSession, seanceById, sessionForDay, type SeanceJour } from '@/lib/semaine';
import { taille, useLecture } from '@/store/lecture';
import { selectProfil, useProfil, useSemaine } from '@/store/profil';
import { useSeance } from '@/store/seance';
import { alpha, colors, ui } from '@/theme';
import { t } from '@/i18n';

/**
 * Séance en cours (vWorkout du prototype), mise en page du design 10K « Circuit — séance guidée » (process-routine-session, nov. 2026) :
 * plein écran noir, illustration en grand (toucher = zoom), barre du haut (✕, exercice, « Exercice n/N · Série s/S », pastille ronde du chrono
 * dont l'anneau suit la séance, ou la série chronométrée), message du coach, puis 3 commandes : Pause · grand bouton blanc (action principale) · Démo.
 * Le repos reprend le même style (grand anneau qui se vide). Logique inchangée (`store/seance`), puis récap (vRecap). « Aa » = grands caractères.
 * « Caméra » (build 35+) : coach caméra avec exosquelette (`CameraCoach`), ses reps comptées valident la série.
 */
export default function SeanceEnCours() {
  const { jour, cat } = useLocalSearchParams<{ jour?: string; cat?: SeanceId }>();
  const insets = useSafeAreaInsets();
  const profil = useProfil();
  const p = selectProfil(profil);
  const sem = useSemaine();
  const c = coachById(p.coach);
  const seance = useSeance();
  const w = seance.w;
  const [demo, setDemo] = useState<ExerciceId | null>(null);
  const [zoom, setZoom] = useState(false);
  const [camera, setCamera] = useState(false);
  const { grand, basculer } = useLecture();

  // launchS : la séance est figée au lancement ; l'horloge tourne chaque seconde.
  useEffect(() => {
    const s: SeanceJour =
      cat != null ? catSession(seanceById(cat), null, p.weight, profil.wkMod[cat] ?? 0) : (sessionForDay(sem, Number(jour)) ?? sem.plan.sessions[0]);
    useSeance.getState().lancer(s);
    const iv = setInterval(() => useSeance.getState().tick(), 1000);
    return () => {
      clearInterval(iv);
      useSeance.getState().quitter();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!w) return <View style={styles.root} />;
  if (w.phase === 'done' && w.res) return <Recap coachId={c.id} res={w.res} />;

  const it = w.s.items[w.ex];
  const e = exercice(it.id);
  const ld = loadFor(it, p);
  const total = w.s.items.reduce((a, x) => a + x.sets, 0);
  const doneN = w.done.flat().length;
  const allDone = w.done[w.ex].length >= it.sets;
  const chrono = !!it.sec && w.phase === 'work';
  const label = allDone
    ? w.ex < w.s.items.length - 1
      ? 'Exercice suivant'
      : 'Terminer la séance'
    : it.sec
      ? chrono
        ? 'Arrêter la série'
        : 'Lancer le chrono'
      : 'Série faite';
  const iconePrincipale: IconName = allDone ? (w.ex < w.s.items.length - 1 ? 'right' : 'trophy') : it.sec && !chrono ? 'play' : chrono ? 'pause' : 'check';
  const message = allDone
    ? `Bravo, ${e.nom.toLowerCase()} est bouclé.`
    : it.sec
      ? chrono
        ? 'Tiens bon, garde le gainage.'
        : `Tiens ${it.sec} s. Lance le chrono quand tu es en place.`
      : `Vise ${rj(it.reps!)} reps, ${ld.txt.toLowerCase()}.`;

  const quitter = () => {
    if (!doneN) return router.back();
    Alert.alert(t('Quitter la séance ?'), t('Elle ne sera pas enregistrée.'), [
      { text: t('Continuer'), style: 'cancel' },
      { text: t('Quitter'), style: 'destructive', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ gestureEnabled: false }} />

      {/* Scène : l'illustration en grand, toucher = image agrandie. */}
      <View style={[StyleSheet.absoluteFill, styles.scene]}>
        <Glow width={420} height={420} color="#50506E" intensity={0.3} />
        <Pressable
          accessibilityRole="imagebutton"
          accessibilityLabel={`${e.nom}, agrandir l'image`}
          onPress={() => setZoom(true)}
          style={[styles.sceneTouche, { paddingTop: insets.top + 110, paddingBottom: grand ? 380 : 340 }]}
        >
          <Image source={EXERCICE_IMAGES[it.id]} style={styles.sceneImg} contentFit="contain" />
        </Pressable>
      </View>
      <LinearGradient pointerEvents="none" colors={[alpha(colors.bg, 0.75), 'transparent', 'transparent', alpha(colors.bg, 0.92), colors.bg]} locations={[0, 0.22, 0.4, 0.62, 1]} style={StyleSheet.absoluteFill} />

      {/* Barre du haut. */}
      <View style={[styles.haut, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Quitter la séance" onPress={quitter} hitSlop={6} style={styles.fermer}>
          <Icon name="x" size={16} />
        </Pressable>
        <View style={styles.flex}>
          <Text weight="bold" style={[styles.hautTitre, taille(grand, 15, 20)]} numberOfLines={1}>
            {e.nom}
          </Text>
          <Text style={[styles.hautSous, taille(grand, 12, 16)]} numberOfLines={1}>
            Exercice {w.ex + 1}/{w.s.items.length} · Série {Math.min(w.set + 1, it.sets)}/{it.sets}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={w.paused ? 'Reprendre la séance' : 'Mettre en pause'} onPress={seance.pause}>
          <Anneau
            taille={56}
            trait={4}
            fraction={chrono ? w.left / it.sec! : doneN / total}
            couleur={chrono ? colors.pink : colors.text}
            texte={w.paused ? '❚❚' : mmss(chrono ? w.left : w.elapsed)}
          />
        </Pressable>
      </View>
      <View style={styles.pastillesHaut}>
        <LivePills bpm={w.bpm} zone={w.zone} hrv={w.hrv} kcal={w.kc} src={w.src} />
      </View>

      {/* Bas : charge, compteur, message, séries et commandes. */}
      <View style={[styles.bas, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.outils}>
          {cameraDisponible() && <Puce icon="camera" label="Caméra" onPress={() => setCamera(true)} />}
          <Puce icon="zoom" label="Agrandir" onPress={() => setZoom(true)} />
          <Puce texte="Aa" label="Grands caractères" actif={grand} onPress={basculer} />
        </View>

        <View style={styles.charge}>
          <View style={styles.chargeHaut}>
            <Text weight="bold" style={[styles.chargeTxt, taille(grand, 17, 22)]}>
              {ld.txt}
            </Text>
            <Text style={[styles.chargeSous, taille(grand, 12, 16)]}>
              {it.sets} × {it.sec ? it.sec + ' s' : rj(it.reps!)} · {it.rest} s repos · ≈ {exKcal(it, p.weight)} kcal
            </Text>
          </View>
          <ZoneBar it={it} cur={it.reps ? w.reps : undefined} />
        </View>

        {it.sec ? (
          <View style={styles.compteur}>
            <BigNumber value={mmss(chrono ? w.left : it.sec)} size={grand ? 64 : 52} color={chrono ? colors.pinkLight : colors.text} />
          </View>
        ) : (
          <View style={styles.compteur}>
            <Rond icon="minus" label="Une rep de moins" onPress={() => seance.reps(-1)} />
            <View style={styles.repsVal}>
              <BigNumber value={w.reps} size={grand ? 64 : 52} />
              <Text style={[styles.repsLbl, taille(grand, 12, 16)]}>reps</Text>
            </View>
            <Rond icon="plus" label="Une rep de plus" onPress={() => seance.reps(1)} />
          </View>
        )}

        <Text weight="semibold" style={[styles.message, taille(grand, 15, 21)]}>
          {message}
        </Text>

        {/* Séries : traits touchables (faite = orange plein, en cours = blanc). */}
        <View style={styles.series}>
          {[...Array(it.sets)].map((_, i) => {
            const ok = w.done[w.ex].includes(i);
            const on = i === w.set && !allDone;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`Série ${i + 1}${ok ? ', faite' : on ? ', en cours' : ''}`}
                onPress={() => seance.choisirSerie(i)}
                hitSlop={{ top: 12, bottom: 12 }}
                style={styles.serieTouche}
              >
                <View style={[styles.serie, ok && styles.serieOk, on && styles.serieOn]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.commandes}>
          <Commande icon={w.paused ? 'play' : 'pause'} titre={w.paused ? 'Reprendre' : 'Pause'} onPress={seance.pause} />
          <View style={styles.principalBloc}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={seance.principal}
              style={({ pressed }) => [styles.principal, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <Icon name={iconePrincipale} size={28} strokeWidth={2.6} color={colors.bg} />
            </Pressable>
            <Text weight="semibold" style={[styles.principalTxt, taille(grand, 12, 16)]} numberOfLines={1}>
              {label}
            </Text>
          </View>
          <Commande icon="play" titre="Démo" onPress={() => setDemo(it.id)} />
        </View>
      </View>

      {/* Repos : même style, grand anneau qui se vide. */}
      {w.phase === 'rest' && (
        <View style={[styles.repos, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
          <Text weight="bold" style={[styles.reposLbl, taille(grand, 12, 16)]}>
            REPOS
          </Text>
          <Text weight="bold" style={[styles.reposTitre, taille(grand, 22, 28)]}>
            {w.nextMsg || 'Souffle un peu'}
          </Text>
          <View style={styles.reposAnneau}>
            <Glow width={300} height={300} intensity={0.3} />
            <Anneau taille={220} trait={10} fraction={w.left / Math.max(1, it.rest)} couleur={colors.pink} />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={styles.reposCentre}>
                <BigNumber value={w.left} size={72} />
                <Text style={styles.reposS}>secondes</Text>
              </View>
            </View>
          </View>
          <LivePills bpm={w.bpm} zone={w.zone} hrv={w.hrv} src={w.src} centre />
          <View style={styles.conseil}>
            <CoachFace id={c.id} size={48} borderColor={colors.pink} />
            <Text style={[styles.conseilTxt, taille(grand, 14, 20)]}>{w.tip}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={seance.passerRepos} style={({ pressed }) => [styles.passer, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Icon name="right" size={18} color={colors.bg} />
            <Text weight="bold" style={[styles.passerTxt, taille(grand, 16, 21)]}>
              Passer le repos
            </Text>
          </Pressable>
        </View>
      )}

      <DemoSheet id={demo} onClose={() => setDemo(null)} />
      <CameraCoach
        exo={camera ? it.id : null}
        cible={it.reps ? it.reps[1] : undefined}
        onValider={
          it.reps && !allDone
            ? (n) => {
                // Reps comptées par la caméra : la série est notée et validée.
                seance.fixerReps(n);
                seance.principal();
              }
            : undefined
        }
        onClose={() => setCamera(false)}
      />
      <ZoomExercice id={zoom ? it.id : null} ligne={`${it.sets} séries • ${it.sec ? it.sec + ' s' : rj(it.reps!) + ' reps'} • ${ld.txt}`} onClose={() => setZoom(false)} />
    </View>
  );
}

/** Anneau de progression (pastille du chrono, repos) : `fraction` restante, dessinée dans le sens horaire depuis le haut. */
function Anneau({ taille: t, trait, fraction, couleur, texte }: { taille: number; trait: number; fraction: number; couleur: string; texte?: string }) {
  const r = (t - trait) / 2;
  const tour = 2 * Math.PI * r;
  const f = Math.max(0.001, Math.min(1, fraction));
  return (
    <View style={[styles.anneau, { width: t, height: t, borderRadius: t / 2 }]}>
      <Svg width={t} height={t} style={StyleSheet.absoluteFill}>
        <Circle cx={t / 2} cy={t / 2} r={r} stroke={alpha(colors.text, 0.22)} strokeWidth={trait} fill="none" />
        <Circle
          cx={t / 2}
          cy={t / 2}
          r={r}
          stroke={couleur}
          strokeWidth={trait}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${tour * f} ${tour}`}
          transform={`rotate(-90 ${t / 2} ${t / 2})`}
        />
      </Svg>
      {texte ? (
        <Text weight="bold" style={styles.anneauTxt}>
          {texte}
        </Text>
      ) : null}
    </View>
  );
}

/** Commande secondaire : icône + légende (Pause, Démo). */
function Commande({ icon, titre, onPress }: { icon: IconName; titre: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={titre} onPress={onPress} style={({ pressed }) => [styles.commande, pressed && { opacity: 0.6 }]}>
      <View style={styles.commandeRond}>
        <Icon name={icon} size={20} />
      </View>
      <Text weight="semibold" style={styles.commandeTxt}>
        {titre}
      </Text>
    </Pressable>
  );
}

/** Gros bouton rond − / + du compteur de reps. */
function Rond({ icon, label, onPress }: { icon: 'plus' | 'minus'; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => [styles.rond, pressed && { transform: [{ scale: 0.94 }] }]}>
      <Icon name={icon} size={24} strokeWidth={2.6} />
    </Pressable>
  );
}

/** Petite puce en verre (Agrandir, Aa). */
function Puce({ icon, texte, label, actif, onPress }: { icon?: IconName; texte?: string; label: string; actif?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole={texte ? 'switch' : 'button'}
      accessibilityLabel={label}
      accessibilityState={texte ? { checked: !!actif } : undefined}
      onPress={onPress}
      style={[styles.puce, actif && styles.puceOn]}
    >
      {icon ? <Icon name={icon} size={16} color={actif ? colors.bg : colors.text} /> : null}
      <Text weight="bold" style={[styles.puceTxt, actif && { color: colors.bg }]}>
        {texte ?? label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scene: { alignItems: 'center', justifyContent: 'flex-start' },
  sceneTouche: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  sceneImg: { width: '96%', height: '100%' },
  haut: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  fermer: { width: 36, height: 36, borderRadius: 18, backgroundColor: alpha(colors.bg, 0.55), borderWidth: 0.5, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  hautTitre: { fontSize: 15, lineHeight: 20, color: colors.text },
  hautSous: { fontSize: 12, lineHeight: 16, color: ui.text3, fontVariant: ['tabular-nums'] },
  anneau: { alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.bg, 0.45) },
  anneauTxt: { fontSize: 14, lineHeight: 18, color: colors.text, fontVariant: ['tabular-nums'] },
  pastillesHaut: { marginTop: 10 },
  bas: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, gap: 12 },
  outils: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  puce: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 13, borderRadius: 18, backgroundColor: alpha(colors.text, 0.12) },
  puceOn: { backgroundColor: colors.pink },
  puceTxt: { fontSize: 13, lineHeight: 17, color: colors.text },
  charge: { padding: 14, borderRadius: 20, backgroundColor: alpha(colors.surface, 0.92), borderWidth: 0.5, borderColor: colors.border },
  chargeHaut: { gap: 2 },
  chargeTxt: { fontSize: 17, lineHeight: 22, color: colors.text },
  chargeSous: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  compteur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 26 },
  repsVal: { alignItems: 'center', minWidth: 90 },
  repsLbl: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  rond: { width: 56, height: 56, borderRadius: 28, backgroundColor: alpha(colors.text, 0.12), alignItems: 'center', justifyContent: 'center' },
  message: { fontSize: 15, lineHeight: 21, color: colors.text, textAlign: 'center', paddingHorizontal: 12 },
  series: { flexDirection: 'row', gap: 6, paddingHorizontal: 40 },
  serieTouche: { flex: 1, paddingVertical: 4 },
  serie: { height: 4, borderRadius: 2, backgroundColor: alpha(colors.text, 0.2) },
  serieOk: { backgroundColor: colors.pink },
  serieOn: { backgroundColor: colors.text },
  commandes: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 22, marginTop: 4 },
  commande: { width: 76, alignItems: 'center', gap: 6, paddingTop: 10 },
  commandeRond: { width: 52, height: 52, borderRadius: 26, backgroundColor: alpha(colors.text, 0.1), alignItems: 'center', justifyContent: 'center' },
  commandeTxt: { fontSize: 12, lineHeight: 16, color: ui.text3 },
  principalBloc: { alignItems: 'center', gap: 6, width: 130 },
  principal: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  principalTxt: { fontSize: 12, lineHeight: 16, color: colors.text },
  repos: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    backgroundColor: alpha(colors.bg, 0.97),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
  },
  reposLbl: { fontSize: 12, lineHeight: 16, letterSpacing: 1.4, color: colors.pink },
  reposTitre: { fontSize: 22, lineHeight: 28, color: colors.text, textAlign: 'center' },
  reposAnneau: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  reposCentre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  reposS: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: -4 },
  conseil: { flexDirection: 'row', alignItems: 'center', gap: 12, maxWidth: 340, padding: 14, borderRadius: 20, backgroundColor: colors.surface },
  conseilTxt: { flex: 1, fontSize: 14, lineHeight: 20, color: ui.text4 },
  passer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, alignSelf: 'stretch', borderRadius: 28, backgroundColor: colors.text },
  passerTxt: { fontSize: 16, lineHeight: 21, color: colors.bg },
});
