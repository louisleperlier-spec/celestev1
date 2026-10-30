import { POSTURES, type Posture, type PostureId, type SeanceYoga } from '@/data/yoga';

/** Secondes laissées pour passer d'une posture (ou d'un côté) à la suivante. */
export const TRANSITION = 5;

export type Cote = 'droit' | 'gauche';
/** Étape jouée : une posture, un côté éventuel, une durée. */
export type EtapeJouee = { posture: Posture; sec: number; cote: Cote | null };

const PAR_ID = new Map(POSTURES.map((p) => [p.id, p]));
export const posture = (id: PostureId): Posture => PAR_ID.get(id)!;

/** Étapes dans l'ordre, les postures à deux côtés dédoublées (droit puis gauche). */
export function etapesJouees(s: SeanceYoga): EtapeJouee[] {
  return s.etapes.flatMap(([id, sec]): EtapeJouee[] => {
    const p = posture(id);
    return p.cotes
      ? [
          { posture: p, sec, cote: 'droit' as const },
          { posture: p, sec, cote: 'gauche' as const },
        ]
      : [{ posture: p, sec, cote: null }];
  });
}

/** Durée totale en secondes (tenues + transitions). */
export function dureeSec(s: SeanceYoga): number {
  const e = etapesJouees(s);
  return e.reduce((a, x) => a + x.sec, 0) + TRANSITION * Math.max(0, e.length - 1);
}

export const dureeMin = (s: SeanceYoga) => Math.max(1, Math.round(dureeSec(s) / 60));

/** Postures différentes de la séance, dans l'ordre d'apparition. */
export function posturesDe(s: SeanceYoga): Posture[] {
  const vues = new Set<PostureId>();
  return s.etapes.flatMap(([id]) => (vues.has(id) ? [] : (vues.add(id), [posture(id)])));
}

export const NIVEAUX_YOGA = ['', 'Débutant', 'Intermédiaire', 'Avancé'] as const;

/**
 * Séance proposée du moment : le matin une séance « matin », le soir une séance « sommeil »,
 * sinon une séance qui tourne chaque jour parmi les autres (même proposition toute la journée).
 */
export function seanceDuMoment(seances: readonly SeanceYoga[], now: Date = new Date()): SeanceYoga {
  const h = now.getHours();
  const jour = Math.floor((+now - now.getTimezoneOffset() * 60e3) / 864e5);
  const pool = h < 11 ? seances.filter((s) => s.objectif === 'matin') : h >= 20 ? seances.filter((s) => s.objectif === 'sommeil') : seances.filter((s) => s.objectif !== 'matin' && s.objectif !== 'sommeil');
  const liste = pool.length ? pool : seances;
  return liste[jour % liste.length];
}

export const mmss = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
