/// <reference types="node" />
/**
 * Vérifie que les données extraites du prototype sont complètes
 * et que chaque coach et chaque exercice a son image dans /assets.
 *
 * Lancer : npx tsx scripts/verifier-donnees.ts
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { COACHES } from '../src/data/coaches';
import { EXERCICES } from '../src/data/exercices';
import { PROGRAMMES } from '../src/data/programmes';
import { SEANCES, SEANCES_GRATUITES } from '../src/data/seances';

const ROOT = join(__dirname, '..');
const erreurs: string[] = [];
const verifier = (ok: boolean, message: string) => {
  if (!ok) erreurs.push(message);
};

// Nombres attendus (cahier des charges, sections 4 et 5)
const programmes = Object.values(PROGRAMMES).flat();
const comptes = [
  ['Coachs', COACHES.length, 6],
  ['Exercices', EXERCICES.length, 50],
  ['Séances', SEANCES.length, 41],
  ['Programmes', programmes.length, 18],
] as const;
for (const [nom, trouve, attendu] of comptes) {
  console.log(`${trouve === attendu ? '✔' : '✘'} ${nom} : ${trouve} / ${attendu}`);
  verifier(trouve === attendu, `${nom} : ${trouve} au lieu de ${attendu}`);
}
for (const coach of COACHES) {
  verifier(PROGRAMMES[coach.id].length === 3, `${coach.id} : ${PROGRAMMES[coach.id].length} programmes au lieu de 3`);
}

// Identifiants uniques
const uniques = (nom: string, ids: readonly string[]) =>
  verifier(new Set(ids).size === ids.length, `${nom} : identifiants en double`);
uniques('Coachs', COACHES.map((c) => c.id));
uniques('Exercices', EXERCICES.map((e) => e.id));
uniques('Séances', SEANCES.map((s) => s.id));

// Références croisées
const exIds = new Set<string>(EXERCICES.map((e) => e.id));
for (const s of SEANCES) {
  for (const spec of s.ex) verifier(exIds.has(spec.split(':')[0]), `Séance ${s.id} : exercice inconnu ${spec}`);
}
for (const c of COACHES) {
  for (const id of c.fav) verifier(exIds.has(id), `Coach ${c.id} : favori inconnu ${id}`);
}
const seanceIds = new Set<string>(SEANCES.map((s) => s.id));
for (const id of SEANCES_GRATUITES) verifier(seanceIds.has(id), `Séance gratuite inconnue : ${id}`);

// Images : une par exercice, corps + tête par coach, et pas d'image orpheline
const dossierEx = join(ROOT, 'assets/exercices');
for (const e of EXERCICES) verifier(existsSync(join(dossierEx, `${e.id}.webp`)), `Image manquante : exercices/${e.id}.webp`);
for (const f of readdirSync(dossierEx)) verifier(exIds.has(f.replace(/\.webp$/, '')), `Image sans exercice : exercices/${f}`);
for (const c of COACHES) {
  for (const f of [`${c.id}_corps.png`, `${c.id}_tete.webp`]) {
    verifier(existsSync(join(ROOT, 'assets/coachs', f)), `Image manquante : coachs/${f}`);
  }
}
const imagesTs = readFileSync(join(ROOT, 'src/data/images.ts'), 'utf8');
for (const [, chemin] of imagesTs.matchAll(/require\('@\/assets\/([^']+)'\)/g)) {
  verifier(existsSync(join(ROOT, 'assets', chemin)), `images.ts référence un fichier absent : ${chemin}`);
}
const nbImagesEx = EXERCICES.filter((e) => existsSync(join(dossierEx, `${e.id}.webp`))).length;
const nbCoachs = COACHES.filter((c) => existsSync(join(ROOT, 'assets/coachs', `${c.id}_corps.png`)) && existsSync(join(ROOT, 'assets/coachs', `${c.id}_tete.webp`))).length;
console.log(`${nbImagesEx === 50 ? '✔' : '✘'} Images d'exercices : ${nbImagesEx} / 50`);
console.log(`${nbCoachs === 6 ? '✔' : '✘'} Images de coachs (corps + tête) : ${nbCoachs} / 6`);

if (erreurs.length) {
  console.error(`\n${erreurs.length} problème(s) :\n- ${erreurs.join('\n- ')}`);
  process.exit(1);
}
console.log('\nExtraction complète.');
