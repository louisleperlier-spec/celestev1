/**
 * Partie Sommeil (maquettes de l'utilisateur, oct. 2026) : réveil lié à l'iPhone, heure de coucher déduite de l'objectif de sommeil,
 * notes du soir. Fonctions pures (pas d'import de `@/data`).
 */
import { hm } from './sommeil';

/** Jours : 0 = lundi … 6 = dimanche (comme `JOURS` de lib/semaine). */
export type SonReveil = 'doux' | 'classique';
export type Reveil = { h: string; jours: number[]; son: SonReveil; vibration: boolean; actif: boolean };

export const REVEIL_DEFAUT: Reveil = { h: '07:15', jours: [0, 1, 2, 3, 4], son: 'doux', vibration: true, actif: false };
export const OBJECTIF_SOMMEIL = 8;

export const SONS: Record<SonReveil, string> = { doux: 'Réveil doux', classique: 'Classique' };
export const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

export const hhmm = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Heure de coucher pour dormir `objectif` heures avant le réveil. */
export const coucherPour = (reveil: string, objectif: number) => hhmm(hm(reveil) - objectif * 60);

/** Heures au lit entre le coucher et le réveil. */
export const heuresAuLit = (coucher: string, reveil: string) => ((hm(reveil) - hm(coucher) + 1440) % 1440) / 60;

/** « Lun · Mar · Mer · Jeu · Ven », « Tous les jours », « Semaine », « Week-end », « Une fois ». */
export function libelleJours(j: readonly number[]): string {
  const s = [...j].sort((a, b) => a - b);
  if (!s.length) return 'Une fois';
  if (s.length === 7) return 'Tous les jours';
  if (s.join() === '5,6') return 'Week-end';
  return s.map((i) => JOURS_COURTS[i]).join(' · ');
}

/** Prochaine sonnerie après `now` (null si désactivé). */
export function prochaineSonnerie(r: Reveil, now: Date = new Date()): Date | null {
  if (!r.actif) return null;
  const min = hm(r.h);
  for (let k = 0; k < 8; k++) {
    const d = new Date(now);
    d.setDate(now.getDate() + k);
    d.setHours(Math.floor(min / 60), min % 60, 0, 0);
    if (+d <= +now) continue;
    const jour = (d.getDay() + 6) % 7;
    if (!r.jours.length || r.jours.includes(jour)) return d;
  }
  return null;
}

/** Notes du soir : ce qui a marqué la journée (journal du sommeil). */
export type GroupeNote = 'habitudes' | 'bienetre' | 'routine';
export type TagSoir = { id: string; nom: string; groupe: GroupeNote };

export const GROUPES_NOTE: Record<GroupeNote, string> = { habitudes: 'Habitudes', bienetre: 'Bien-être', routine: 'Routine' };

export const TAGS_SOIR: readonly TagSoir[] = [
  { id: 'cafe', nom: 'Café tardif', groupe: 'habitudes' },
  { id: 'repas', nom: 'Repas tardif', groupe: 'habitudes' },
  { id: 'alcool', nom: 'Alcool', groupe: 'habitudes' },
  { id: 'sieste', nom: 'Sieste', groupe: 'habitudes' },
  { id: 'stress', nom: 'Stress', groupe: 'bienetre' },
  { id: 'fatigue', nom: 'Fatigue', groupe: 'bienetre' },
  { id: 'bonne', nom: 'Bonne journée', groupe: 'bienetre' },
  { id: 'malade', nom: 'Malade', groupe: 'bienetre' },
  { id: 'lecture', nom: 'Lecture', groupe: 'routine' },
  { id: 'infusion', nom: 'Infusion', groupe: 'routine' },
  { id: 'bain', nom: 'Bain', groupe: 'routine' },
  { id: 'ecrans', nom: 'Écrans tardifs', groupe: 'routine' },
];

export type NoteSoir = { d: string; tags: string[]; note: string };
