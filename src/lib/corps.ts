/**
 * « Corps » : récupération par muscle, portage du design Process « Corps » (v2-flow-body : MuscleLoadEngine.swift,
 * MuscleAdvisor.swift, MuscleRecoveryView.swift). Mêmes 15 groupes, mêmes règles : dose d'une séance (exercices détaillés,
 * sinon sport × durée × intensité), décroissance exponentielle avec une constante personnelle (base 36 h, plus courte pour un
 * muscle entraîné souvent), seuils de 55 % (séance légère) et 30 % (séance intense), repos minimum après une grosse charge,
 * couleurs vert ≥ 50, jaune 34–49, rouge en dessous, séance conseillée (bloc le plus reposé), alertes.
 * Adaptations à NÉA : le journal (`Log`) au lieu des activités Strava ; correspondance des groupes et sports de NÉA ;
 * pas de 1RM (charges non gardées par série) ; intensité par la FC moyenne quand elle existe. Fonctions pures, sans `@/data`.
 */
import type { Log } from './xp';

export type Muscle =
  | 'traps'
  | 'shoulders'
  | 'chest'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'upperBack'
  | 'lats'
  | 'abs'
  | 'lowerBack'
  | 'glutes'
  | 'quads'
  | 'adductors'
  | 'hamstrings'
  | 'calves';

export const MUSCLES: readonly Muscle[] = ['traps', 'shoulders', 'chest', 'biceps', 'triceps', 'forearms', 'upperBack', 'lats', 'abs', 'lowerBack', 'glutes', 'quads', 'adductors', 'hamstrings', 'calves'];

export const NOM_MUSCLE: Record<Muscle, string> = {
  traps: 'Trapèzes',
  shoulders: 'Épaules',
  chest: 'Pectoraux',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  upperBack: 'Haut du dos',
  lats: 'Grands dorsaux',
  abs: 'Abdos',
  lowerBack: 'Lombaires',
  glutes: 'Fessiers',
  quads: 'Quadriceps',
  adductors: 'Adducteurs',
  hamstrings: 'Ischios',
  calves: 'Mollets',
};

export const REGIONS: readonly (readonly [string, readonly Muscle[]])[] = [
  ['Haut du corps', ['chest', 'shoulders', 'traps', 'upperBack', 'lats', 'biceps', 'triceps', 'forearms']],
  ['Tronc', ['abs', 'lowerBack']],
  ['Bas du corps', ['glutes', 'quads', 'adductors', 'hamstrings', 'calves']],
];

type Poids = Partial<Record<Muscle, number>>;

/** Groupes de NÉA (`GroupeId`) → muscles du design, muscle principal à 1 et muscles qui l'aident. */
const PAR_GROUPE: Record<string, Poids> = {
  pecs: { chest: 1, triceps: 0.5, shoulders: 0.5 },
  dos: { lats: 1, upperBack: 1, traps: 0.6, biceps: 0.5, lowerBack: 0.3, forearms: 0.3 },
  epaules: { shoulders: 1, traps: 0.5, triceps: 0.3 },
  biceps: { biceps: 1, forearms: 0.5 },
  triceps: { triceps: 1 },
  quads: { quads: 1, glutes: 0.6, adductors: 0.5 },
  ischios: { hamstrings: 1, glutes: 0.6, lowerBack: 0.4 },
  fessiers: { glutes: 1, hamstrings: 0.5 },
  mollets: { calves: 1 },
  abdos: { abs: 1, lowerBack: 0.3 },
  cardio: { quads: 0.6, calves: 0.6, glutes: 0.5, abs: 0.4 },
};

/** Poids par sport du design (`baseWeights`). */
const SPORTS: Record<string, Poids> = {
  run: { quads: 0.9, hamstrings: 0.8, calves: 1, glutes: 0.8, abs: 0.3, lowerBack: 0.2 },
  walk: { quads: 0.4, hamstrings: 0.35, calves: 0.5, glutes: 0.35 },
  ride: { quads: 1, hamstrings: 0.55, calves: 0.55, glutes: 0.7, lowerBack: 0.25 },
  swim: { shoulders: 1, upperBack: 0.95, lats: 0.95, traps: 0.95, biceps: 0.65, triceps: 0.65, chest: 0.6, abs: 0.4, forearms: 0.3 },
  row: { upperBack: 1, lats: 1, traps: 1, biceps: 0.75, triceps: 0.75, quads: 0.7, hamstrings: 0.5, lowerBack: 0.55, forearms: 0.6, glutes: 0.5 },
  elliptical: { quads: 0.6, glutes: 0.5, hamstrings: 0.4, calves: 0.4, biceps: 0.2, triceps: 0.2 },
  strength: { chest: 0.7, shoulders: 0.7, biceps: 0.75, triceps: 0.75, upperBack: 0.7, lats: 0.7, traps: 0.7, quads: 0.6, glutes: 0.55, hamstrings: 0.45, abs: 0.45, forearms: 0.5, lowerBack: 0.45 },
  hiit: { quads: 0.8, glutes: 0.7, abs: 0.6, shoulders: 0.5, chest: 0.4, calves: 0.6, hamstrings: 0.5 },
  yoga: { abs: 0.7, lowerBack: 0.5, glutes: 0.4, shoulders: 0.35, hamstrings: 0.4 },
  boxing: { shoulders: 0.9, biceps: 0.7, triceps: 0.7, abs: 0.7, forearms: 0.5, calves: 0.5, upperBack: 0.4, lats: 0.4, traps: 0.4, quads: 0.4 },
  climb: { forearms: 1, upperBack: 0.9, lats: 0.9, traps: 0.9, biceps: 0.9, triceps: 0.9, shoulders: 0.6, abs: 0.4 },
  field: { quads: 0.7, calves: 0.75, hamstrings: 0.55, glutes: 0.55, shoulders: 0.35, abs: 0.35 },
  ski: { quads: 1, glutes: 0.7, abs: 0.5, hamstrings: 0.4, calves: 0.4 },
  surf: { shoulders: 0.9, upperBack: 0.8, lats: 0.8, traps: 0.8, biceps: 0.6, triceps: 0.6, abs: 0.5, quads: 0.4 },
  dance: { calves: 0.7, quads: 0.6, glutes: 0.5, abs: 0.5 },
  golf: { abs: 0.4, lowerBack: 0.4, forearms: 0.3, shoulders: 0.3 },
  other: { quads: 0.3, abs: 0.3 },
};

/** Sports de NÉA (`lib/sports.ts`) → famille du design. */
const FAMILLE: Record<string, string> = {
  tennis: 'field', padel: 'field', badminton: 'field', squash: 'field', pickleball: 'field', football: 'field', basketball: 'field',
  volleyball: 'field', handball: 'field', hockey: 'field', rugby: 'field', baseball: 'field', ultimate: 'field', athletisme: 'run',
  boxe: 'boxing', kickboxing: 'boxing', lutte: 'boxing', natation: 'swim', aquaforme: 'swim', kayak: 'row', aviron: 'row', rameur: 'row',
  paddle: 'surf', surf: 'surf', snowboard: 'ski', patin: 'ski', skate: 'ski', yoga: 'yoga', pilates: 'yoga', etirements: 'yoga',
  danse: 'dance', zumba: 'dance', hiit: 'hiit', crossfit: 'hiit', corde: 'hiit', elliptique: 'elliptical', escaliers: 'run',
  marche: 'walk', escalade: 'climb', golf: 'golf', equitation: 'other',
};

/** Avec les quadriceps viennent les adducteurs (moitié), comme dans le design. */
function avecVoisins(p: Poids): Poids {
  return p.quads != null && p.adductors == null ? { ...p, adductors: p.quads * 0.5 } : p;
}

/** Poids d'une activité du journal (sans le détail des exercices). */
export function poidsActivite(l: Log): Poids {
  const fam = l.type === 'velo' ? 'ride' : l.type === 'course' ? 'run' : l.type === 'rando' ? 'run' : l.type === 'muscu' ? 'strength' : FAMILLE[l.sport ?? ''] ?? 'other';
  return avecVoisins(SPORTS[fam]);
}

/** Part « dure » de l'activité : FC moyenne (≥ 160 dur, ≥ 140 soutenu), sinon 0,3 comme le design. */
function partDure(l: Log): number {
  if (l.hrAvg && l.hrAvg > 0) return l.hrAvg >= 160 ? 1 : l.hrAvg >= 140 ? 0.5 : 0.15;
  return 0.3;
}

/**
 * Dose par muscle d'une séance détaillée : chaque série compte, pondérée par la plage de répétitions et la nouveauté
 * (exercice absent depuis 28 j : plus de courbatures) ; ~10 séries directes ≈ 45 min intenses. `null` sans exercice connu.
 */
function dosesExercices(l: Log, historique: readonly Log[], groupeDe: (id: string) => string | undefined): Poids | null {
  if (!l.exos?.length) return null;
  const fin = Date.parse(l.d);
  const d: Poids = {};
  let connu = false;
  for (const e of l.exos) {
    const g = groupeDe(e.id);
    const poids = g ? PAR_GROUPE[g] : undefined;
    if (!poids) continue;
    connu = true;
    const series = Math.min(Math.max(e.series, 1), 8);
    const fRep = e.reps <= 5 ? 1.1 : e.reps <= 12 ? 1 : e.reps <= 20 ? 0.85 : 0.7;
    const recent = historique.some((a) => {
      const t = Date.parse(a.d);
      return t < fin && fin - t < 28 * 864e5 && (a.exos ?? []).some((x) => x.id === e.id);
    });
    const stimulus = (series * fRep * (recent ? 1 : 1.3)) / 5.5;
    for (const [m, w] of Object.entries(poids) as [Muscle, number][]) d[m] = (d[m] ?? 0) + w * stimulus;
  }
  if (!connu) return null;
  for (const m of Object.keys(d) as Muscle[]) d[m] = Math.min(d[m]!, 3);
  return d;
}

export type Source = { titre: string; d: string; dose: number };
export type Etat = 'pret' | 'leger' | 'fatigue';

export type Entree = {
  muscle: Muscle;
  /** Fatigue (0 à 1). */
  charge: number;
  dernier: number | null;
  tau: number;
  jours28: number;
  sources: Source[];
  /** Récupération (0 à 100), l'inverse de la fatigue. */
  pourcent: number;
  heuresLeger: number;
  heuresIntense: number;
  etat: Etat;
};

const LEGER = 0.55;
const INTENSE = 0.3;
export const SURCHARGE = 0.85;
const FENETRE = 5 * 864e5;

/**
 * Récupération des 15 muscles à partir du journal. `recup` : score de récupération du jour (0 à 100), s'il est connu.
 * `groupeDe` : groupe NÉA d'un exercice (passé par l'appelant pour garder ce fichier sans `@/data`).
 */
export function recuperationMuscles(logs: readonly Log[], groupeDe: (id: string) => string | undefined, now: number = Date.now(), recup?: number | null): Entree[] {
  const jours = new Map<Muscle, Set<number>>();
  const poidsDe = (l: Log) => dosesExercices(l, logs, groupeDe) ?? poidsActivite(l);
  for (const l of logs) {
    const age = now - Date.parse(l.d);
    if (age < 0 || age >= 28 * 864e5) continue;
    const jour = Math.floor(Date.parse(l.d) / 864e5);
    for (const [m, w] of Object.entries(poidsDe(l)) as [Muscle, number][]) {
      if (w >= 0.5) jours.set(m, (jours.get(m) ?? new Set()).add(jour));
    }
  }
  // Récupération du jour : 100 % → 0,8 ; 50 % → 1,0 ; 20 % → 1,12.
  const fJour = recup != null ? 1.2 - (0.4 * Math.min(Math.max(recup, 0), 100)) / 100 : 1;
  const tau = (m: Muscle) => {
    const n = jours.get(m)?.size ?? 0;
    const adaptation = n >= 10 ? 0.65 : n >= 6 ? 0.78 : n >= 3 ? 0.9 : 1;
    return 36 * adaptation * fJour;
  };

  const brut = new Map<Muscle, number>();
  const dernier = new Map<Muscle, number>();
  const sources = new Map<Muscle, Source[]>();
  for (const l of logs) {
    const fin = Date.parse(l.d);
    const age = now - fin;
    if (age < 0 || age >= FENETRE) continue;
    const doses =
      dosesExercices(l, logs, groupeDe) ??
      (() => {
        const dose = Math.min(l.min / 45, 3) * (1 + 0.8 * partDure(l));
        const p = poidsActivite(l);
        return Object.fromEntries(Object.entries(p).map(([m, w]) => [m, (w as number) * dose])) as Poids;
      })();
    for (const [m, dose] of Object.entries(doses) as [Muscle, number][]) {
      if (dose <= 0) continue;
      const reste = dose * Math.exp(-age / 3600e3 / tau(m));
      brut.set(m, (brut.get(m) ?? 0) + reste);
      if (reste > 0.03) sources.set(m, [...(sources.get(m) ?? []), { titre: l.title, d: l.d, dose: reste }]);
      if ((dernier.get(m) ?? 0) < fin) dernier.set(m, fin);
    }
  }

  return MUSCLES.map((m) => {
    const charge = 1 - Math.exp(-(brut.get(m) ?? 0) * 1.1);
    const t = tau(m);
    const der = dernier.get(m) ?? null;
    const depuis = der != null ? (now - der) / 3600e3 : Infinity;
    const heures = (seuil: number) => (charge > seuil ? Math.ceil(Math.log(charge / seuil) * t) : 0);
    const reste = (min: number) => {
      const r = min - depuis;
      return Number.isFinite(r) && r > 0 ? Math.ceil(r) : 0;
    };
    const minLeger = charge >= SURCHARGE ? 36 : charge >= LEGER ? 20 : 0;
    const minIntense = charge >= SURCHARGE ? 72 : charge >= LEGER ? 44 : charge >= INTENSE ? 24 : 0;
    const heuresLeger = Math.max(heures(LEGER), reste(minLeger));
    const heuresIntense = Math.max(heures(INTENSE), reste(minIntense), heuresLeger);
    return {
      muscle: m,
      charge,
      dernier: der,
      tau: t,
      jours28: jours.get(m)?.size ?? 0,
      sources: (sources.get(m) ?? []).sort((a, b) => b.dose - a.dose),
      pourcent: Math.round((1 - charge) * 100),
      heuresLeger,
      heuresIntense,
      etat: heuresLeger > 0 ? 'fatigue' : heuresIntense > 0 ? 'leger' : 'pret',
    } satisfies Entree;
  }).sort((a, b) => b.charge - a.charge);
}

/** Niveau de couleur : vert dès 50, jaune 34–49, rouge en dessous. */
export const niveauPourcent = (p: number): 'bon' | 'moyen' | 'bas' => (p >= 50 ? 'bon' : p >= 34 ? 'moyen' : 'bas');

export const delai = (h: number) => (h >= 24 ? `${Math.round(h / 24)} j` : `${h} h`);

export function statut(e: Entree): string {
  if (e.etat === 'pret') return 'Prêt pour une séance intense';
  if (e.etat === 'leger') return `Séance légère OK · intense dans ${delai(e.heuresIntense)}`;
  return `Repos · léger dans ${delai(e.heuresLeger)}`;
}

export type Bloc = 'jambes' | 'push' | 'pull' | 'tronc';
export const BLOCS: Record<Bloc, { titre: string; muscles: readonly Muscle[] }> = {
  jambes: { titre: 'Jambes', muscles: ['quads', 'glutes', 'hamstrings', 'adductors', 'calves'] },
  push: { titre: 'Push (pecs, épaules, triceps)', muscles: ['chest', 'shoulders', 'triceps'] },
  pull: { titre: 'Pull (dos, biceps)', muscles: ['lats', 'upperBack', 'biceps', 'traps', 'forearms'] },
  tronc: { titre: 'Tronc', muscles: ['abs', 'lowerBack'] },
};

/** Bloc le plus reposé, à condition que ses 3 muscles principaux soient prêts ; muscles à ménager. */
export function suggestion(entrees: readonly Entree[]): { bloc: Bloc; moyenne: number; menager: Muscle[] } | null {
  const par = new Map(entrees.map((e) => [e.muscle, e]));
  const candidats = (Object.keys(BLOCS) as Bloc[]).flatMap((b) => {
    const liste = BLOCS[b].muscles.map((m) => par.get(m)!).filter(Boolean);
    if (!liste.length || !liste.slice(0, 3).every((e) => e.etat === 'pret')) return [];
    return [{ bloc: b, moyenne: Math.floor(liste.reduce((a, e) => a + e.pourcent, 0) / liste.length) }];
  });
  if (!candidats.length) return null;
  const meilleur = candidats.reduce((a, b) => (b.moyenne > a.moyenne ? b : a));
  return { ...meilleur, menager: entrees.filter((e) => e.etat === 'fatigue').map((e) => e.muscle) };
}

/** Alertes : muscle surchargé, ou retravaillé alors qu'il était encore rouge (séances des 3 derniers jours). */
export function alertes(entrees: readonly Entree[], logs: readonly Log[], groupeDe: (id: string) => string | undefined, now: number = Date.now()): { type: 'surcharge' | 'retravaille'; muscle: Muscle }[] {
  const res: { type: 'surcharge' | 'retravaille'; muscle: Muscle }[] = entrees.filter((e) => e.charge >= SURCHARGE).map((e) => ({ type: 'surcharge' as const, muscle: e.muscle }));
  for (const l of logs) {
    const fin = Date.parse(l.d);
    if (now - fin >= 3 * 864e5 || fin > now) continue;
    const debut = l.debut ? Date.parse(l.debut) : fin - l.min * 60e3;
    const avant = recuperationMuscles(logs, groupeDe, debut - 60e3);
    const touches = Object.entries(poidsActivite(l)).filter(([, w]) => (w as number) >= 0.5).map(([m]) => m);
    for (const e of avant) {
      if (touches.includes(e.muscle) && e.pourcent < 34 && !res.some((r) => r.muscle === e.muscle)) res.push({ type: 'retravaille', muscle: e.muscle });
    }
  }
  return res;
}

export function texteAlerte(a: { type: 'surcharge' | 'retravaille'; muscle: Muscle }): string {
  return a.type === 'surcharge'
    ? `${NOM_MUSCLE[a.muscle]} : surcharge, laisse au moins 3 jours avant de les retravailler fort.`
    : `${NOM_MUSCLE[a.muscle]} : retravaillés avant d'avoir récupéré. Espace ces séances.`;
}
