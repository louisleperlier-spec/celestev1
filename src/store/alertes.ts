/**
 * Alertes santé (hors prototype) : réglages du Profil envoyés au module natif, qui pose les notifications même app
 * fermée (modules/nea-montre/ios/AlertesSante.swift : VFC et fatigue toutes les heures, eau, vélo et dépense du jour, pas).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { texteBilanCoeur } from '@/lib/bilanCoeur';
import { motivationDuJour } from '@/lib/motivation';
import { OBJECTIF_PAS } from '@/lib/notifs';
import { buildPlan, sesKcal } from '@/lib/plan';

import { NeaMontre } from '../../modules/nea-montre/src';
import { autorisation, demanderAutorisation } from './notifs';
import { selectProfil, useProfil } from './profil';

let dernier = '';

function envoyer() {
  if (typeof NeaMontre?.configurerAlertes !== 'function') return;
  const st = useProfil.getState();
  if (!st.onboarded) return;
  // Objectif de dépense = cercle Bouger (séance moyenne du programme).
  const ses = buildPlan(selectProfil(st)).sessions;
  const objectifKcal = ses.length ? ses.reduce((a, s) => a + sesKcal(s, st.weight), 0) / ses.length : 300;
  const json = JSON.stringify({ ...st.alertesSante, objectifPas: OBJECTIF_PAS, objectifKcal: Math.round(objectifKcal), poids: st.weight });
  if (json === dernier) return;
  dernier = json;
  NeaMontre.configurerAlertes(json);
}

/** Au démarrage puis à chaque changement des réglages, du programme ou du poids. */
export function demarrerAlertes() {
  envoyer();
  // Sans autorisation du téléphone, rien ne s'affiche : demandée une fois si une alerte est active.
  if (typeof NeaMontre?.configurerAlertes === 'function' && Object.values(useProfil.getState().alertesSante).some(Boolean)) {
    autorisation().then((a) => {
      if (a === 'undetermined') void demanderAutorisation();
    });
  }
  useProfil.subscribe((s, avant) => {
    if (s.alertesSante !== avant.alertesSante || s.weight !== avant.weight || s.days !== avant.days || s.dur !== avant.dur || s.onboarded !== avant.onboarded) envoyer();
  });
}

/** Exemples des alertes (mêmes textes que AlertesSante.swift), envoyés à 5 s d'intervalle pour essayer. */
type Exemple = { title: string; body: string; act: string; cat?: string; nea?: Record<string, string | number> };
const heureCourte = () => new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
const EXEMPLES: readonly Exemple[] = [
  {
    title: '🙂 VFC 62 ms · Stable · maintenant',
    body: 'Tout est sous contrôle. Ton cœur fait son job, fais le tien : bouge un peu 🚶',
    act: 'hrv',
    cat: 'NEA_VFC_1',
    nea: { genre: 'vfc', niveau: 1, ms: 62, ecart: 4 },
  },
  { title: "💧 C'est l'heure de boire de l'eau", body: '🌱 Ta plante verte boit plus que toi. Inacceptable.', act: 'accueil' },
  { title: '🚴 Il te reste 220 kcal à dépenser', body: "25 min de vélo et c'est plié. Ton vélo s'ennuie, il me l'a dit 🔥", act: 'sortie' },
  { title: '👏 Objectif de pas atteint', body: '10 240 pas : objectif pulvérisé. Le trottoir porte plainte 🚔😂', act: 'accueil' },
];

/**
 * « Tester mes alertes » : 8 exemples toutes les 5 s (VFC, récupération et séance s'affichent avec l'écran d'Axel sur la montre). App ouverte, NÉA cache les bannières du téléphone :
 * il faut quitter l'app (ou verrouiller l'iPhone) pour les voir arriver.
 */
export async function testerAlertes(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if ((await demanderAutorisation()) !== 'granted') return false;
  // + la motivation du jour et un bilan du cœur d'exemple (6 alertes en tout).
  const st = useProfil.getState();
  const exemples: Exemple[] = [
    ...EXEMPLES,
    { title: 'Ta dose de motivation 🔥', body: motivationDuJour(st.progStart, st.name), act: 'accueil' },
    {
      title: 'Récupération · En forme · 86/100',
      body: 'Prêt pour ta prochaine séance',
      act: 'sleep',
      cat: 'NEA_RECUP',
      nea: { genre: 'recup', niveau: 0, score: 86, nom: 'En forme', phrase: 'Prêt pour ta prochaine séance' },
    },
    { title: 'On bouge ensemble ? 💪', body: 'Haut du corps · 25 min', act: 'seance', cat: 'NEA_SEANCE', nea: { genre: 'seance', titre: 'Haut du corps', min: 25 } },
    {
      ...texteBilanCoeur({ etat: 'top', rhr: 54, rhrMoy: 57, hrv: 66, hrvMoy: 60, d: new Date().toISOString() }),
      act: 'sleep',
    },
  ];
  await Promise.all(
    exemples.map((e, i) =>
      Notifications.scheduleNotificationAsync({
        identifier: `nea.test.${i}`,
        content: {
          title: e.title,
          body: e.body,
          // Catégorie + données : écran d'Axel sur la montre (iPhone verrouillé).
          categoryIdentifier: e.cat,
          data: { act: e.act, ...(e.nea ? { nea: e.nea.genre === 'vfc' ? { ...e.nea, heure: heureCourte() } : e.nea } : {}) },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 * (i + 1) },
      }),
    ),
  );
  return true;
}
