import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArcRespire, Bulle, CarteResume, FENETRE, Pastille, useDiscussion } from '@/components/onboarding/Discussion';
import { ObBar } from '@/components/onboarding/ObScaffold';
import { Button, Text } from '@/components/ui';
import { COACH_IMAGES, GEAR, GOALS, MATERIEL, type LieuOnboarding } from '@/data';
import { LVLN, lvlN, type Duree, type Jours, type NiveauId } from '@/lib/plan';
import { useProfil } from '@/store/profil';
import { alpha, colors } from '@/theme';

const NIVEAUX: readonly [NiveauId, string][] = [
  ['deb', 'Je débute ou je reprends.'],
  ['int', 'Je connais les bases.'],
  ['adv', "Je m'entraîne régulièrement."],
];
const LIEUX: readonly [LieuOnboarding, string, string][] = [
  ['maison', 'À la maison', 'Avec ou sans équipement'],
  ['salle', 'En salle', 'Machines, barres et poulies'],
  ['deux', 'Les deux', 'Selon tes envies'],
];
const LIEU_COURT: Record<LieuOnboarding, string> = {
  maison: 'Maison',
  salle: 'Salle',
  deux: 'Maison + salle',
};
const JOURS: readonly Jours[] = [2, 3, 4, 5, 6, 7];
const DUREES: readonly Duree[] = [20, 30, 45, 60];

type Question = 'objectifs' | 'niveau' | 'lieu' | 'jours' | 'duree' | 'resume';
const QUESTIONS: readonly Question[] = ['objectifs', 'niveau', 'lieu', 'jours', 'duree', 'resume'];

const materiel = (g: LieuOnboarding) => GEAR[g].map((m) => MATERIEL[m].toLowerCase()).join(', ');
const commentaireRythme = (days: number) =>
  days <= 3
    ? 'Parfait pour démarrer et tenir dans la durée.'
    : days <= 5
      ? 'Un bon rythme pour progresser vite.'
      : 'Rythme intense : ton coach prévoit des séances plus légères.';

/** Ce que le coach dit avant chaque question (lu dans l'état au moment de la poser). */
function lignes(q: Question): string[] {
  const s = useProfil.getState();
  switch (q) {
    case 'objectifs':
      return [
        `Enchanté${s.name ? ', ' + s.name : ''} !`,
        'Quelques questions et je construis ton programme.',
        "Qu'est-ce qui te motive ? Choisis un ou plusieurs objectifs.",
      ];
    case 'niveau':
      return ['Bien noté.', 'Quel est ton niveau ?'];
    case 'lieu':
      return ["Où veux-tu t'entraîner ?"];
    case 'jours':
      return [`Ton programme utilisera : ${materiel(s.gear)}.`, 'Combien de séances par semaine ?'];
    case 'duree':
      return ['Et combien de temps par séance ?'];
    case 'resume':
      return [`${s.days} séances de ${s.dur} min par semaine. ${commentaireRythme(s.days)}`, 'Voici ce que je retiens.'];
  }
}

/** 2/7 — Discussion avec le coach : objectifs, niveau, lieu, rythme (design 10K « Questionnaire »). */
export default function Discussion() {
  const p = useProfil();
  const d = useDiscussion();
  const [etape, setEtape] = useState(0);
  /** Nombre de messages avant chaque question, pour le retour arrière dans le fil. */
  const debuts = useRef<number[]>([]);
  /** Questions déjà répondues (leur choix reste coché si on revient dessus). */
  const [repondues, setRepondues] = useState<Question[]>([]);
  const defil = useRef<ScrollView>(null);

  const poser = (i: number, instant = false) => {
    debuts.current[i] = d.taille();
    setEtape(i);
    void d.dire(lignes(QUESTIONS[i]), instant);
  };

  // Première question une fois la transition d'écran passée.
  useEffect(() => {
    const t = setTimeout(() => poser(0), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = QUESTIONS[etape];
  const suivant = (texte: string) => {
    d.repondre(texte);
    setRepondues((r) => (r.includes(q) ? r : [...r, q]));
    poser(etape + 1);
  };
  const retour = () => {
    if (etape === 0) return router.canGoBack() ? router.back() : router.replace('/bienvenue');
    d.couper(debuts.current[etape - 1]);
    poser(etape - 1, true);
  };

  const fil = d.messages.slice(-FENETRE);
  const derniere = d.messages.length - 1;
  const deja = repondues.includes(q);
  const avance = (etape + (d.ecrit ? 0 : 0.5)) / QUESTIONS.length;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <ArcRespire />
      <ObBar step="discussion" avance={Math.max(0.08, avance)} onRetour={retour} />
      <View style={styles.coach}>
        <Image source={COACH_IMAGES.nova.tete} style={styles.mascotte} contentFit="contain" />
        <Text weight="semibold" style={styles.coachNom}>
          NÉA
        </Text>
        <Text style={styles.coachEtat}>{d.ecrit ? 'écrit…' : 'ton coach'}</Text>
      </View>

      <View style={styles.flex}>
        <ScrollView
          ref={defil}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => defil.current?.scrollToEnd({ animated: true })}
        >
          <Pressable onPress={d.completer} accessible={false} style={styles.fil}>
            {fil.map((m) => (
              <Bulle key={m.id} m={m} profondeur={derniere - d.messages.indexOf(m)} />
            ))}
          </Pressable>

          {d.messages.length > 0 && !d.ecrit && (
            <Animated.View key={q} entering={FadeIn.duration(200)} style={styles.reponses}>
              {q === 'objectifs' && (
                <>
                  {GOALS.map(([k, label], i) => (
                    <Pastille key={k} index={i} label={label} on={p.goals.includes(k)} onPress={() => p.toggleGoal(k)} />
                  ))}
                  <Button
                    label="Valider"
                    arrow
                    disabled={!p.goals.length}
                    style={styles.valider}
                    onPress={() =>
                      suivant(
                        GOALS.filter(([k]) => p.goals.includes(k))
                          .map(([, l]) => l)
                          .join(' · '),
                      )
                    }
                  />
                </>
              )}
              {q === 'niveau' &&
                NIVEAUX.map(([k, desc], i) => (
                  <Pastille
                    key={k}
                    index={i}
                    label={LVLN[lvlN(k) - 1]}
                    sous={desc}
                    on={deja && p.level === k}
                    onPress={() => {
                      if (k !== p.level) p.set({ level: k, obCoachSet: false });
                      suivant(LVLN[lvlN(k) - 1]);
                    }}
                  />
                ))}
              {q === 'lieu' &&
                LIEUX.map(([k, label, desc], i) => (
                  <Pastille
                    key={k}
                    index={i}
                    label={label}
                    sous={desc}
                    on={deja && p.gear === k}
                    onPress={() => {
                      p.set({ gear: k });
                      suivant(label);
                    }}
                  />
                ))}
              {q === 'jours' &&
                JOURS.map((n, i) => (
                  <Pastille
                    key={n}
                    index={i}
                    label={`${n} séances`}
                    on={deja && p.days === n}
                    onPress={() => {
                      p.set({ days: n });
                      suivant(`${n} séances par semaine`);
                    }}
                  />
                ))}
              {q === 'duree' &&
                DUREES.map((n, i) => (
                  <Pastille
                    key={n}
                    index={i}
                    label={`${n} min`}
                    on={deja && p.dur === n}
                    onPress={() => {
                      p.set({ dur: n });
                      suivant(`${n} min par séance`);
                    }}
                  />
                ))}
              {q === 'resume' && (
                <CarteResume
                  sections={[
                    {
                      titre: 'Objectifs',
                      valeurs: GOALS.filter(([k]) => p.goals.includes(k)).map(([, l]) => l),
                    },
                    { titre: 'Niveau', valeurs: [LVLN[lvlN(p.level) - 1]] },
                    { titre: 'Lieu', valeurs: [LIEU_COURT[p.gear]] },
                    {
                      titre: 'Matériel',
                      valeurs: GEAR[p.gear].map((m) => MATERIEL[m]),
                    },
                    {
                      titre: 'Rythme',
                      valeurs: [`${p.days} séances / semaine`, `${p.dur} min`],
                    },
                  ]}
                >
                  <Button label="Continuer" arrow onPress={() => router.push('/onboarding/age')} />
                </CarteResume>
              )}
            </Animated.View>
          )}
        </ScrollView>
        {/* Les anciens messages s'effacent sous l'en-tête. */}
        <LinearGradient pointerEvents="none" colors={[colors.bg, alpha(colors.bg, 0)]} style={styles.fondu} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  mascotte: { width: 30, height: 30 },
  coachNom: { fontSize: 15, lineHeight: 20 },
  coachEtat: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  flex: { flex: 1 },
  fondu: { position: 'absolute', left: 0, right: 0, top: 0, height: 32 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 32,
  },
  fil: { gap: 20 },
  reponses: { gap: 8, marginTop: 24 },
  valider: { marginTop: 10 },
});
