/**
 * Timings centralisés (en secondes). Chaque scène a son début et sa fin ; la voix off de la scène
 * démarre `VOIX_DELAI` après le début. Les mots et leurs instants viennent de `mots.json`
 * (généré par `scripts/voix.py`).
 */
import { FORMAT } from './theme';

export type IdScene = 'accroche' | 'solution' | 'etape1' | 'etape2' | 'etape3' | 'synthese' | 'conclusion';

export const SCENES: readonly { id: IdScene; debut: number; fin: number }[] = [
  { id: 'accroche', debut: 0, fin: 3.0 },
  { id: 'solution', debut: 3.0, fin: 7.0 },
  { id: 'etape1', debut: 7.0, fin: 11.8 },
  { id: 'etape2', debut: 11.8, fin: 17.4 },
  { id: 'etape3', debut: 17.4, fin: 22.8 },
  { id: 'synthese', debut: 22.8, fin: 26.8 },
  { id: 'conclusion', debut: 26.8, fin: 31.0 },
];

/** Délai entre le début d'une scène et le début de sa voix off. */
export const VOIX_DELAI = 0.15;

export const DUREE_TOTALE = SCENES[SCENES.length - 1].fin;

export const img = (s: number) => Math.round(s * FORMAT.fps);

export const scene = (id: IdScene) => {
  const s = SCENES.find((x) => x.id === id)!;
  return { ...s, from: img(s.debut), duree: img(s.fin - s.debut), index: SCENES.indexOf(s) };
};
