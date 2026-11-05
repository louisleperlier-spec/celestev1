/// <reference types="node" />
/**
 * Régénère src/data/exercicesAxel.ts d'après les fichiers présents dans assets/exercices/axel/ (un `require` statique par image,
 * comme l'exige Metro). Un exercice sans image Axel garde son ancienne illustration (repli de `EXERCICE_IMAGES`).
 * Lancer après chaque lot : npx tsx scripts/axel-sport-integrer.ts
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { EXERCICES } from '../src/data/exercices';

const ids = new Set(EXERCICES.map((e) => e.id));
const presents = existsSync('assets/exercices/axel') ? readdirSync('assets/exercices/axel').filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)) : [];
const inconnus = presents.filter((id) => !ids.has(id as never));
if (inconnus.length) throw new Error('Images sans exercice : ' + inconnus.join(', '));
const ordre = EXERCICES.map((e) => e.id).filter((id) => presents.includes(id));
const lignes = ordre.map((id) => `  ${id}: require('@/assets/exercices/axel/${id}.webp'),`).join('\n');
writeFileSync(
  'src/data/exercicesAxel.ts',
  `// Généré par scripts/axel-sport-integrer.ts d'après assets/exercices/axel/ : ne pas modifier à la main.
import type { ImageSourcePropType } from 'react-native';

import type { ExerciceId } from './types';

/** Illustrations Axel Sport déjà produites (${ordre.length} / ${EXERCICES.length}) ; les autres exercices gardent l'ancienne image. */
export const AXEL_EXERCICE_IMAGES: Readonly<Partial<Record<ExerciceId, ImageSourcePropType>>> = {
${lignes}
};

/** Les images Axel ne s'affichent qu'une fois la bibliothèque complète (pas de mélange avec les anciennes dans l'app publiée). */
export const AXEL_COMPLET = ${ordre.length === EXERCICES.length};
`,
);
console.log(`${ordre.length} / ${EXERCICES.length} exercices avec une illustration Axel Sport`);
