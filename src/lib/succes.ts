/**
 * Cartes succès (hors prototype, cartes dessinées par l'utilisateur, oct. 2026) : 5 cartes d'Axel, 2 missions chacune.
 * Chaque mission réussie rapporte son XP ; la carte s'illumine quand ses 2 missions sont faites.
 * Les cartes d'exercices (lib/jeu.ts) restent la récompense de chaque activité.
 */
import type { EtatJeu } from './jeu';
import { serie } from './gel';
import { type Log } from './xp';

export type SuccesId = 'premier-pas' | 'endurance' | 'force' | 'explorateur' | 'inarretable';
export type MissionId = `${SuccesId}:${1 | 2}`;

/** Ce qu'il faut du profil pour mesurer les missions. */
export type EtatSucces = { logs: readonly Log[]; days: number; jeu: EtatJeu };

export type Mission = {
  id: MissionId;
  titre: string;
  texte: string;
  xp: number;
  but: number;
  /** Avancement (même unité que `but`). */
  fait: (e: EtatSucces) => number;
  /** « 120 / 250 m » ; sinon « n / but ». */
  unite?: string;
};

export type Succes = { id: SuccesId; nom: string; rarete: 0 | 1 | 2 | 3; num: number; missions: readonly [Mission, Mission] };

const dplusTotal = (e: EtatSucces) => e.logs.reduce((a, l) => a + (l.type === 'rando' ? (l.dplus ?? 0) : 0), 0);
const muscu = (e: EtatSucces) => e.logs.filter((l) => l.type === 'muscu');

/** Meilleure séance de musculation comparée à la toute première (en % de volume soulevé en plus). */
function progression(e: EtatSucces): number {
  const m = muscu(e);
  const premiere = m[m.length - 1];
  if (!premiere || premiere.vol <= 0) return 0;
  const max = m.reduce((a, l) => Math.max(a, l.vol), 0);
  return Math.max(0, Math.floor(((max - premiere.vol) / premiere.vol) * 100));
}

export const SUCCES: readonly Succes[] = [
  {
    id: 'premier-pas',
    nom: 'Premier pas',
    rarete: 0,
    num: 1,
    missions: [
      { id: 'premier-pas:1', titre: 'Première séance', texte: 'Termine ta première activité.', xp: 100, but: 1, fait: (e) => Math.min(1, e.logs.length) },
      { id: 'premier-pas:2', titre: 'Dénivelé', texte: 'Cumule 100 m de D+ en randonnée.', xp: 50, but: 100, unite: 'm', fait: dplusTotal },
    ],
  },
  {
    id: 'endurance',
    nom: 'Endurance',
    rarete: 1,
    num: 2,
    missions: [
      {
        id: 'endurance:1',
        titre: 'Garde le rythme',
        texte: 'Cours 5 km en une sortie.',
        xp: 150,
        but: 5,
        unite: 'km',
        fait: (e) => Math.floor(e.logs.reduce((a, l) => Math.max(a, l.type === 'course' ? (l.dist ?? 0) : 0), 0) * 10) / 10,
      },
      { id: 'endurance:2', titre: 'Dénivelé', texte: 'Cumule 250 m de D+ en randonnée.', xp: 100, but: 250, unite: 'm', fait: dplusTotal },
    ],
  },
  {
    id: 'force',
    nom: 'Force',
    rarete: 2,
    num: 3,
    missions: [
      { id: 'force:1', titre: 'Plus fort chaque jour', texte: 'Termine 10 séances de musculation.', xp: 200, but: 10, fait: (e) => muscu(e).length },
      { id: 'force:2', titre: 'Progression', texte: 'Soulève 10 % de plus qu’à ta 1re séance.', xp: 150, but: 10, unite: '%', fait: progression },
    ],
  },
  {
    id: 'explorateur',
    nom: 'Explorateur',
    rarete: 3,
    num: 4,
    missions: [
      { id: 'explorateur:1', titre: 'Conquiers le sommet', texte: 'Atteins ton 1er sommet en randonnée.', xp: 300, but: 1, fait: (e) => (e.logs.some((l) => l.sommet) ? 1 : 0) },
      { id: 'explorateur:2', titre: 'Dénivelé', texte: 'Cumule 500 m de D+ en randonnée.', xp: 200, but: 500, unite: 'm', fait: dplusTotal },
    ],
  },
  {
    id: 'inarretable',
    nom: 'Inarrêtable',
    rarete: 3,
    num: 5,
    missions: [
      {
        id: 'inarretable:1',
        titre: 'La force de l’habitude',
        texte: 'Entraîne-toi 7 jours de suite.',
        xp: 450,
        but: 7,
        unite: 'j',
        fait: (e) => Math.max(e.jeu.records.serie, serie(e)),
      },
      { id: 'inarretable:2', titre: 'Progression', texte: 'Bats 3 de tes records.', xp: 300, but: 3, fait: (e) => e.jeu.nbRecords ?? 0 },
    ],
  },
];

export const succes = (id: SuccesId) => SUCCES.find((s) => s.id === id)!;

/** Missions déjà récompensées. */
export const missionsPrises = (jeu: EtatJeu): readonly MissionId[] => jeu.missions ?? [];

/** Avancement d'une mission, plafonné à son but. */
export const avancement = (m: Mission, e: EtatSucces) => Math.min(m.but, m.fait(e));

/** Mission réussie (récompensée, ou but atteint). */
export const missionFaite = (m: Mission, e: EtatSucces) => missionsPrises(e.jeu).includes(m.id) || m.fait(e) >= m.but;

/** Carte débloquée : ses 2 missions sont faites. */
export const debloque = (s: Succes, e: EtatSucces) => s.missions.every((m) => missionFaite(m, e));

/** Carte complète au sens des récompenses : ses 2 missions ont déjà donné leur XP. */
export const recompensee = (s: Succes, jeu: EtatJeu) => s.missions.every((m) => missionsPrises(jeu).includes(m.id));

/** Missions réussies pas encore récompensées. */
export const nouvellesMissions = (e: EtatSucces): Mission[] =>
  SUCCES.flatMap((s) => s.missions).filter((m) => !missionsPrises(e.jeu).includes(m.id) && m.fait(e) >= m.but);
