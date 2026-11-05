/**
 * Coach caméra : analyse du squelette envoyé par la caméra (`NeaCamera`, Apple Vision, 15 images par seconde) pour compter
 * les répétitions et corriger le mouvement. Une rep = l'angle mesuré (coude, genou, hanche…) part de la position de repos,
 * atteint la position d'effort, puis revient ; une rep qui n'atteint pas l'effort ne compte pas (« partielle »).
 * Fonctions pures, sans `@/data` (exécutables avec Node).
 */

export type Articulation =
  | 'nez'
  | 'cou'
  | 'epauleG'
  | 'epauleD'
  | 'coudeG'
  | 'coudeD'
  | 'poignetG'
  | 'poignetD'
  | 'bassin'
  | 'hancheG'
  | 'hancheD'
  | 'genouG'
  | 'genouD'
  | 'chevilleG'
  | 'chevilleD';

export type Point = { x: number; y: number; c: number };
/** Articulations en pixels de l'image (origine en haut à gauche). */
export type Pose = Partial<Record<Articulation, Point>>;

type Cote = 'G' | 'D';
type Membre = 'epaule' | 'coude' | 'poignet' | 'hanche' | 'genou' | 'cheville';
const art = (m: Membre, c: Cote) => `${m}${c}` as Articulation;

/** Angle en degrés au point b (entre ba et bc). */
export function angle(a: Point, b: Point, c: Point): number {
  const v1 = Math.atan2(a.y - b.y, a.x - b.x);
  const v2 = Math.atan2(c.y - b.y, c.x - b.x);
  let d = Math.abs(((v1 - v2) * 180) / Math.PI);
  if (d > 180) d = 360 - d;
  return d;
}

/** Inclinaison du segment a → b par rapport à la verticale, en degrés (0 = vertical). */
export function inclinaison(a: Point, b: Point): number {
  return (Math.atan2(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 180) / Math.PI;
}

/** Angle a-b-c du côté le mieux vu ; moyenne des deux côtés s'ils sont tous deux nets (de face). */
export function angleCotes(p: Pose, a: Membre, b: Membre, c: Membre, choix: 'mieux' | 'min' = 'mieux'): number | null {
  const res: { v: number; c: number }[] = [];
  for (const s of ['G', 'D'] as Cote[]) {
    const pa = p[art(a, s)], pb = p[art(b, s)], pc = p[art(c, s)];
    if (pa && pb && pc) res.push({ v: angle(pa, pb, pc), c: Math.min(pa.c, pb.c, pc.c) });
  }
  if (!res.length) return null;
  if (choix === 'min') return Math.min(...res.map((r) => r.v));
  if (res.length === 2 && res[0].c > 0.55 && res[1].c > 0.55) return (res[0].v + res[1].v) / 2;
  return res.reduce((m, r) => (r.c > m.c ? r : m)).v;
}

/** Côté le mieux vu (de profil, l'autre côté est caché). */
function meilleurCote(p: Pose, membres: Membre[]): Cote | null {
  let mieux: Cote | null = null;
  let score = 0;
  for (const s of ['G', 'D'] as Cote[]) {
    const pts = membres.map((m) => p[art(m, s)]);
    if (pts.some((x) => !x)) continue;
    const v = Math.min(...pts.map((x) => x!.c));
    if (v > score) {
      score = v;
      mieux = s;
    }
  }
  return mieux;
}

export type Correction = { msg: string; joints: Articulation[] };

export type Profil = {
  /** Comment poser le téléphone. */
  cadrage: string;
  /** Angle suivi ; null si les articulations ne sont pas visibles. */
  mesure: (p: Pose) => number | null;
  /** Angle au repos et à l'effort (l'effort peut être plus petit, flexion, ou plus grand, extension). */
  repos: number;
  effort: number;
  /** Rep qui n'atteint pas l'effort. */
  partielle: string;
  /** Erreur de forme repérée sur cette image (pendant l'effort). */
  forme?: (p: Pose) => Correction | null;
  /** Exercice tenu (gainage) : pas de reps, seulement l'alignement. */
  tenue?: boolean;
};

const coude = (p: Pose) => angleCotes(p, 'epaule', 'coude', 'poignet');
const genou = (p: Pose) => angleCotes(p, 'hanche', 'genou', 'cheville');

/** Alignement épaule – hanche – cheville (ou genou) : hanches qui tombent ou fesses trop hautes. */
function gainage(p: Pose): Correction | null {
  const s = meilleurCote(p, ['epaule', 'hanche', 'cheville']) ?? meilleurCote(p, ['epaule', 'hanche', 'genou']);
  if (!s) return null;
  const e = p[art('epaule', s)]!, h = p[art('hanche', s)]!;
  const bas = p[art('cheville', s)] ?? p[art('genou', s)]!;
  if (angle(e, h, bas) >= 160) return null;
  // Position de la hanche par rapport à la ligne épaule → pied (y vers le bas de l'image).
  const t = (h.x - e.x) / (bas.x - e.x || 1);
  const yLigne = e.y + t * (bas.y - e.y);
  return h.y > yLigne
    ? { msg: 'Gaine les abdos : tes hanches tombent.', joints: [art('hanche', s)] }
    : { msg: 'Fesses trop hautes : aligne ton corps.', joints: [art('hanche', s)] };
}

/** Buste trop penché (épaule → hanche loin de la verticale). */
function buste(max: number, msg: string) {
  return (p: Pose): Correction | null => {
    const s = meilleurCote(p, ['epaule', 'hanche']);
    if (!s) return null;
    return inclinaison(p[art('hanche', s)]!, p[art('epaule', s)]!) > max ? { msg, joints: [art('epaule', s), art('hanche', s)] } : null;
  };
}

/** Genoux qui rentrent (de face) : écart des genoux bien plus petit que celui des chevilles. */
function genouxEnDedans(p: Pose): Correction | null {
  const { genouG: gg, genouD: gd, chevilleG: cg, chevilleD: cd } = p;
  if (!gg || !gd || !cg || !cd) return null;
  const eg = Math.abs(gg.x - gd.x), ec = Math.abs(cg.x - cd.x);
  return ec > 0 && eg < ec * 0.75 ? { msg: 'Pousse les genoux vers l’extérieur.', joints: ['genouG', 'genouD'] } : null;
}

/** Coudes qui s'écartent du corps pendant le curl. */
function coudesColles(p: Pose): Correction | null {
  const s = meilleurCote(p, ['epaule', 'coude']);
  if (!s) return null;
  return inclinaison(p[art('epaule', s)]!, p[art('coude', s)]!) > 35 ? { msg: 'Garde les coudes collés au corps.', joints: [art('coude', s)] } : null;
}

const PROFILS: Record<string, Profil> = {
  pompe: {
    cadrage: 'Pose le téléphone au sol, de profil, à 2 m : tout ton corps dans l’image.',
    mesure: coude,
    repos: 155,
    effort: 95,
    partielle: 'Descends plus bas : la poitrine près du sol.',
    forme: gainage,
  },
  dips: { cadrage: 'Téléphone de profil, à 2 m, tout ton corps dans l’image.', mesure: coude, repos: 155, effort: 100, partielle: 'Descends jusqu’à 90° aux coudes.' },
  couche: { cadrage: 'Téléphone de profil, à hauteur du banc, à 2 m.', mesure: coude, repos: 155, effort: 95, partielle: 'Descends la charge jusqu’à la poitrine.' },
  tirage: { cadrage: 'Téléphone de face ou de profil, tout le haut du corps dans l’image.', mesure: coude, repos: 150, effort: 85, partielle: 'Tire plus loin, coudes vers l’arrière.' },
  traction: { cadrage: 'Téléphone de face, à 3 m : bras et barre dans l’image.', mesure: coude, repos: 150, effort: 80, partielle: 'Monte le menton au-dessus de la barre.' },
  curl: {
    cadrage: 'Téléphone de profil, à 2 m, du genou à la tête dans l’image.',
    mesure: coude,
    repos: 145,
    effort: 60,
    partielle: 'Monte jusqu’en haut, sans tricher.',
    forme: coudesColles,
  },
  developpe: { cadrage: 'Téléphone de face, à 2 m, bras levés dans l’image.', mesure: coude, repos: 85, effort: 155, partielle: 'Tends les bras complètement en haut.' },
  extensionTete: { cadrage: 'Téléphone de profil, à 2 m, bras levés dans l’image.', mesure: coude, repos: 70, effort: 150, partielle: 'Tends les bras complètement.' },
  elevation: {
    cadrage: 'Téléphone de face, à 2 m, de la tête aux hanches.',
    mesure: (p) => angleCotes(p, 'hanche', 'epaule', 'coude'),
    repos: 20,
    effort: 75,
    partielle: 'Monte les bras à hauteur d’épaules.',
  },
  squat: {
    cadrage: 'Téléphone de profil (ou de face), à 2–3 m : de la tête aux pieds.',
    mesure: genou,
    repos: 160,
    effort: 100,
    partielle: 'Descends plus bas : cuisses parallèles au sol.',
    forme: (p) => buste(55, 'Garde la poitrine haute.')(p) ?? genouxEnDedans(p),
  },
  fente: {
    cadrage: 'Téléphone de profil, à 2–3 m : de la tête aux pieds.',
    mesure: (p) => angleCotes(p, 'hanche', 'genou', 'cheville', 'min'),
    repos: 155,
    effort: 105,
    partielle: 'Descends : genou arrière près du sol.',
    forme: buste(30, 'Garde le buste droit.'),
  },
  charniere: {
    cadrage: 'Téléphone de profil, à 2–3 m : de la tête aux pieds.',
    mesure: (p) => angleCotes(p, 'epaule', 'hanche', 'genou'),
    repos: 165,
    effort: 115,
    partielle: 'Bascule plus loin, hanches vers l’arrière.',
  },
  pont: {
    cadrage: 'Téléphone au sol, de profil, à 2 m.',
    mesure: (p) => angleCotes(p, 'epaule', 'hanche', 'genou'),
    repos: 140,
    effort: 165,
    partielle: 'Monte les hanches jusqu’à l’alignement.',
  },
  planche: {
    cadrage: 'Pose le téléphone au sol, de profil, à 2 m : tout ton corps dans l’image.',
    mesure: (p) => {
      const s = meilleurCote(p, ['epaule', 'hanche', 'cheville']);
      return s ? angle(p[art('epaule', s)]!, p[art('hanche', s)]!, p[art('cheville', s)]!) : null;
    },
    repos: 180,
    effort: 180,
    partielle: '',
    forme: gainage,
    tenue: true,
  },
};

const PAR_EXERCICE: Record<string, keyof typeof PROFILS> = {
  pompes: 'pompe',
  pompes_inclinees: 'pompe',
  dips: 'dips',
  developpe_couche_halteres: 'couche',
  developpe_incline_halteres: 'couche',
  developpe_couche_barre: 'couche',
  rowing_un_bras: 'tirage',
  rowing_barre: 'tirage',
  tractions: 'traction',
  tractions_assistees: 'traction',
  curl_biceps: 'curl',
  curl_marteau: 'curl',
  curl_pupitre: 'curl',
  curl_poulie: 'curl',
  developpe_epaules: 'developpe',
  presse_epaules: 'developpe',
  extension_triceps_tete: 'extensionTete',
  elevations_laterales: 'elevation',
  elevations_frontales: 'elevation',
  squat_barre: 'squat',
  goblet_squat: 'squat',
  squat_poids_corps: 'squat',
  fentes_arriere: 'fente',
  fentes_marche: 'fente',
  squat_bulgare: 'fente',
  souleve_terre: 'charniere',
  souleve_roumain: 'charniere',
  hip_thrust: 'pont',
  pont_fessier: 'pont',
  planche: 'planche',
};

/** Profil d'analyse d'un exercice ; null = squelette seul, sans comptage. */
export function profilDe(exo: string): Profil | null {
  const k = PAR_EXERCICE[exo];
  return k ? PROFILS[k] : null;
}

export type Suivi = {
  reps: number;
  /** Reps sans erreur de forme. */
  propres: number;
  partielles: number;
  phase: 'repos' | 'effort';
  /** Angle lissé. */
  valeur: number | null;
  /** 0 = repos, 1 = effort atteint. */
  amplitude: number;
  /** Angle le plus proche de l'effort pendant la rep en cours. */
  extreme: number | null;
  debutRep: number | null;
  erreurRep: string | null;
  message: string;
  ton: 'info' | 'ok' | 'alerte';
  joints: Articulation[];
  /** Images d'affilée sans les articulations utiles. */
  perdu: number;
  /** Tenue : secondes bien alignées. */
  tenueOk: number;
  dernier: number | null;
  evenement: 'rep' | 'partielle' | 'forme' | null;
};

export const suiviInitial = (p: Profil | null): Suivi => ({
  reps: 0,
  propres: 0,
  partielles: 0,
  phase: 'repos',
  valeur: null,
  amplitude: 0,
  extreme: null,
  debutRep: null,
  erreurRep: null,
  message: p ? p.cadrage : 'Place-toi en entier dans l’image.',
  ton: 'info',
  joints: [],
  perdu: 0,
  tenueOk: 0,
  dernier: null,
  evenement: null,
});

const borne = (v: number) => Math.max(0, Math.min(1, v));

/** Avance l'analyse d'une image (pose en pixels, t en ms). */
export function suivre(s: Suivi, prof: Profil | null, pose: Pose, t: number): Suivi {
  const dt = s.dernier == null ? 0 : Math.min(0.5, (t - s.dernier) / 1000);
  const base = { ...s, dernier: t, evenement: null as Suivi['evenement'] };
  const nb = Object.keys(pose).length;
  if (!prof) {
    return nb >= 6
      ? { ...base, message: 'Je te vois : le comptage arrive bientôt pour cet exercice.', ton: 'info', joints: [] }
      : { ...base, message: 'Place-toi en entier dans l’image.', ton: 'info', joints: [] };
  }
  const v = prof.mesure(pose);
  if (v == null) {
    const perdu = s.perdu + 1;
    return { ...base, perdu, message: perdu > 8 ? prof.cadrage : s.message, ton: perdu > 8 ? 'info' : s.ton, joints: [] };
  }
  const valeur = s.valeur == null ? v : s.valeur * 0.5 + v * 0.5;
  const correction = prof.forme?.(pose) ?? null;

  if (prof.tenue) {
    return correction
      ? { ...base, perdu: 0, valeur, amplitude: 0, message: correction.msg, ton: 'alerte', joints: correction.joints, evenement: s.ton !== 'alerte' ? 'forme' : null }
      : { ...base, perdu: 0, valeur, amplitude: 1, tenueOk: s.tenueOk + dt, message: 'Alignement parfait, tiens bon.', ton: 'ok', joints: [] };
  }

  const amp = (x: number) => borne((x - prof.repos) / (prof.effort - prof.repos));
  const amplitude = amp(valeur);
  const plusProche = (a: number, b: number) => (amp(a) >= amp(b) ? a : b);
  let n: Suivi = { ...base, perdu: 0, valeur, amplitude };

  if (s.phase === 'repos') {
    if (amplitude > 0.25) n = { ...n, phase: 'effort', extreme: valeur, debutRep: t, erreurRep: null };
    else if (s.perdu > 8 || s.reps === 0) n = { ...n, message: s.reps === 0 ? 'C’est parti : je compte tes reps.' : s.message, ton: s.reps === 0 ? 'info' : s.ton };
  } else {
    const extreme = plusProche(valeur, s.extreme ?? valeur);
    n = { ...n, extreme };
    if (correction && amplitude > 0.2) {
      n = { ...n, erreurRep: s.erreurRep ?? correction.msg, message: correction.msg, ton: 'alerte', joints: correction.joints, evenement: s.erreurRep ? null : 'forme' };
    }
    if (amplitude <= 0.1) {
      // Retour au repos : fin de la rep.
      const atteint = amp(extreme) >= 1;
      const duree = s.debutRep == null ? 2000 : t - s.debutRep;
      if (atteint) {
        const reps = s.reps + 1;
        const propre = !n.erreurRep;
        const msg = !propre ? n.erreurRep! : duree < 900 ? 'Plus lent : contrôle le mouvement.' : 'Propre, continue comme ça.';
        n = {
          ...n,
          phase: 'repos',
          reps,
          propres: s.propres + (propre ? 1 : 0),
          extreme: null,
          debutRep: null,
          message: msg,
          ton: propre && duree >= 900 ? 'ok' : 'alerte',
          joints: propre ? [] : n.joints,
          evenement: 'rep',
        };
      } else {
        n = { ...n, phase: 'repos', partielles: s.partielles + 1, extreme: null, debutRep: null, message: prof.partielle, ton: 'alerte', joints: [], evenement: 'partielle' };
      }
    } else if (!correction && s.ton === 'alerte' && s.erreurRep == null) {
      n = { ...n, ton: 'info', joints: [] };
    }
  }
  return n;
}
