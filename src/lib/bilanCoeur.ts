/**
 * Bilan du cœur (hors prototype, demandé par l'utilisateur, oct. 2026) : FC au repos et VFC nocturne de la dernière nuit
 * comparées à ta moyenne des 14 nuits précédentes, verdict et un conseil pour améliorer ton rythme (tirés sans répétition).
 * Repères généraux de bien-être, pas un avis médical.
 */
import type { Nuit } from './sommeil';
import { hash } from './xp';

export type EtatCoeur = 'top' | 'stable' | 'fcHaute' | 'vfcBasse' | 'surcharge';

export type BilanCoeur = {
  etat: EtatCoeur;
  rhr: number | null;
  rhrMoy: number | null;
  hrv: number | null;
  hrvMoy: number | null;
  /** Nuit analysée (date ISO). */
  d: string;
};

/** Conseils par état : courts, concrets, en tutoiement. */
export const CONSEILS_COEUR: Readonly<Record<EtatCoeur, readonly string[]>> = {
  top: [
    'Garde ce cap : 150 min de cardio léger par semaine, c’est la base d’un cœur en forme 🫀',
    'Profite de ta forme pour une séance un peu plus intense aujourd’hui 💥',
    'Ton cœur récupère bien : ajoute 1 séance de fractionné cette semaine pour le muscler ⚡',
    'Continue de te coucher à heure fixe, c’est ce qui stabilise ton rythme au repos 🌙',
    'Une sortie en zone 2 (tu peux parler en bougeant) renforce ton cœur sans le fatiguer 🚴',
    'Bravo : ton sommeil et ton entraînement s’équilibrent. Ne change rien 🙌',
    'Journée idéale pour une rando ou une longue marche : ton cœur est prêt 🥾',
  ],
  stable: [
    '5 minutes de cohérence cardiaque (inspire 5 s, expire 5 s) aident ton cœur à se poser 🌬️',
    'Une marche de 20 minutes après le repas aide ton cœur et ta glycémie 🚶',
    'Bois un grand verre d’eau maintenant : un cœur bien hydraté bat plus calmement 💧',
    'Vise 7 à 9 h de sommeil : c’est la nuit que ton rythme au repos s’améliore 😴',
    '2 à 3 séances de cardio léger par semaine font baisser la FC au repos avec le temps 📉',
    'Limite le café après 14 h : ton cœur et ton sommeil te diront merci ☕',
    'Monte les escaliers aujourd’hui : petit effort, grand bénéfice pour ton cœur 🪜',
    'Respire par le nez pendant l’échauffement : ton cœur monte plus en douceur 👃',
    'Étire-toi 5 minutes ce soir : le corps détendu aide le cœur à ralentir 🧘',
    'Un rythme régulier (repas, coucher, entraînement) aide ton cœur à trouver le sien ⏰',
  ],
  fcHaute: [
    'Souvent la fatigue, le stress ou un peu de déshydratation : bois de l’eau et vas-y doucement 💧',
    'Ton cœur bat un peu vite au repos : privilégie une séance légère ou une marche aujourd’hui 🚶',
    'Couche-toi 30 minutes plus tôt ce soir, c’est le meilleur remède pour faire redescendre ta FC 🌙',
    'Fais 3 séries de respiration lente (inspire 4 s, expire 6 s) : ton rythme va se calmer 🌬️',
    'L’alcool et les repas tardifs font monter la FC de nuit : allège ce soir 🍽️',
    'Si tu te sens fiévreux ou inhabituellement fatigué, repos complet aujourd’hui 🛌',
    'Évite la caféine aujourd’hui, laisse ton cœur souffler ☕🚫',
  ],
  vfcBasse: [
    'Ton corps récupère encore : séance douce ou repos actif aujourd’hui 🧘',
    'Prends 10 minutes au calme, respiration lente : c’est ce qui fait remonter ta VFC 🌬️',
    'Une marche dehors, à la lumière du jour, aide ton système nerveux à se recharger ☀️',
    'Mange bien et bois suffisamment : la récupération passe aussi par l’assiette 🥗',
    'Réduis l’intensité : garde le gros effort pour quand ta VFC sera remontée 📈',
    'Ce soir, écrans éteints 30 minutes avant de dormir pour une nuit plus réparatrice 📵',
  ],
  surcharge: [
    'Ton corps demande du repos : journée off ou étirements seulement 🛌',
    'Signes de fatigue marqués : saute l’intensité aujourd’hui, ton cœur te remerciera ❤️',
    'Repos, eau, sommeil : la trilogie pour remettre ton cœur d’aplomb 💧😴',
    'Si ça dure plusieurs jours ou que tu te sens mal, parles-en à un professionnel de santé 🩺',
  ],
};

const moyenne = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

/**
 * Bilan de la dernière nuit avec FC au repos ou VFC, comparée aux 14 nuits d'avant (au moins 3 pour juger).
 * FC haute : ≥ +5 bpm ; VFC basse : ≤ −15 % ; top : FC ≤ −2 bpm et VFC ≥ moyenne.
 */
export function bilanCoeur(nuits: readonly Nuit[]): BilanCoeur | null {
  const triees = [...nuits].filter((n) => n.rhr || n.hrv).sort((a, b) => +new Date(b.d) - +new Date(a.d));
  const n = triees[0];
  if (!n) return null;
  const avant = triees.slice(1, 15);
  const rhrs = avant.map((x) => x.rhr).filter((x): x is number => !!x);
  const hrvs = avant.map((x) => x.hrv).filter((x): x is number => !!x);
  const rhrMoy = rhrs.length >= 3 ? moyenne(rhrs) : null;
  const hrvMoy = hrvs.length >= 3 ? moyenne(hrvs) : null;
  const fcHaute = !!(n.rhr && rhrMoy && n.rhr >= rhrMoy + 5);
  const vfcBasse = !!(n.hrv && hrvMoy && n.hrv <= hrvMoy * 0.85);
  const top = !!(n.rhr && rhrMoy && n.rhr <= rhrMoy - 2 && (!n.hrv || !hrvMoy || n.hrv >= hrvMoy));
  const etat: EtatCoeur = fcHaute && vfcBasse ? 'surcharge' : fcHaute ? 'fcHaute' : vfcBasse ? 'vfcBasse' : top ? 'top' : 'stable';
  return { etat, rhr: n.rhr, rhrMoy: rhrMoy && Math.round(rhrMoy), hrv: n.hrv, hrvMoy: hrvMoy && Math.round(hrvMoy), d: n.d };
}

const VERDICTS: Record<EtatCoeur, [string, string]> = {
  top: ['Cœur en super forme 💚', 'Ton cœur est reposé et efficace.'],
  stable: ['Cœur stable ❤️', 'Rien à signaler, tu es dans tes valeurs habituelles.'],
  fcHaute: ['Cœur un peu sollicité 🧡', 'Ta FC au repos est au-dessus de ta moyenne.'],
  vfcBasse: ['Récupération en cours 💛', 'Ta VFC est sous ta moyenne.'],
  surcharge: ['Cœur fatigué ❤️‍🩹', 'FC au repos haute et VFC basse en même temps.'],
};

/** Conseil du jour pour un état : change chaque jour (tirage déterministe sur la date). */
export function conseilCoeur(etat: EtatCoeur, d: Date = new Date()): string {
  const l = CONSEILS_COEUR[etat];
  return l[Math.floor(hash(`coeur:${etat}:${d.toDateString()}`) * l.length) % l.length];
}

const ecart = (v: number, moy: number | null) =>
  moy == null ? '' : v === moy ? ' (comme ta moyenne)' : ` (${v > moy ? '+' : '−'}${Math.abs(v - moy)} vs ta moyenne)`;

/** Notification « Ton cœur ce matin » : chiffres, verdict, conseil. */
export function texteBilanCoeur(b: BilanCoeur, d: Date = new Date()): { title: string; body: string } {
  const [titre, phrase] = VERDICTS[b.etat];
  const chiffres = [b.rhr ? `FC au repos ${b.rhr} bpm${ecart(b.rhr, b.rhrMoy)}` : '', b.hrv ? `VFC ${b.hrv} ms${ecart(b.hrv, b.hrvMoy)}` : '']
    .filter(Boolean)
    .join(' · ');
  return { title: `Ton cœur ce matin · ${titre}`, body: `${chiffres}. ${phrase} ${conseilCoeur(b.etat, d)}` };
}

/** Conseil « rythme » programmé à l'avance (app fermée) : un conseil d'amélioration différent chaque jour. */
export function conseilRythme(d: Date): { title: string; body: string } {
  const l = [...CONSEILS_COEUR.stable, ...CONSEILS_COEUR.top];
  // Un conseil après l'autre, jour après jour : jamais le même deux jours de suite.
  const jour = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
  return { title: 'Ton conseil cœur du jour ❤️', body: l[((jour % l.length) + l.length) % l.length] };
}
