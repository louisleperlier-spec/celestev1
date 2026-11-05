/// <reference types="node" />
/**
 * Manifeste de la bibliothèque Axel Sport : exercice → fichier → statut → prompt (docs/axel-sport/manifeste.json et .md).
 * Sources : docs/axel-sport/inventaire.json (scripts/inventaire-exercices.ts), generations.json (journal), scripts/axel-sport-specs.ts.
 * Lancer : npx tsx scripts/axel-sport-manifeste.ts
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { SPECS, prompt } from './axel-sport-specs';

type Gen = { generation: string; modele: string; date: string; statut: string; remarques?: string };
const inv = JSON.parse(readFileSync('docs/axel-sport/inventaire.json', 'utf8')) as {
  exercices: { id: string; nom: string; groupe: string; materiel: string; muscles: string; programmes: string[]; seancesPretes: string[] }[];
};
const gens = JSON.parse(readFileSync('docs/axel-sport/generations.json', 'utf8')) as Record<string, Gen>;
const LIB: Record<string, string> = { genere_a_verifier: 'Généré · à vérifier', valide: 'Validé', a_refaire: 'À refaire', a_generer: 'À générer' };

const lignes = inv.exercices.map((e, i) => {
  const s = SPECS[e.id];
  const fichier = `assets/exercices/axel/${e.id}.webp`;
  const g = gens[e.id];
  const present = existsSync(fichier);
  const statut = present ? (g?.statut ?? 'genere_a_verifier') : 'a_generer';
  return {
    numero: i + 1,
    id: e.id,
    nom: e.nom,
    groupe: e.groupe,
    materiel: e.materiel,
    musclesFiche: e.muscles,
    fichier,
    brut: `docs/axel-sport/brut/${e.id}.webp`,
    repli: `assets/exercices/${e.id}.webp`,
    statut,
    generation: g?.generation ?? null,
    modele: g?.modele ?? 'gemini-3-pro-image',
    remarques: g?.remarques ?? null,
    vuesDepartArrivee: s.etapes ? 'prévues (à générer)' : 'non nécessaires (tenue ou mouvement continu)',
    camera: s.camera,
    contacts: s.contacts,
    surbrillance: s.muscles,
    programmes: e.programmes.length,
    seancesPretes: e.seancesPretes.length,
    parametres: { references: ['zc51MmjFoO1NCwzKC4gt', '1mSjsRGdD5W74mBXBn6t'], modele: 'gemini-3-pro-image', format: 'fond ivoire uni, puis détourage ISNet → WebP transparent 900 px' },
    prompt: prompt(e.nom, s),
  };
});
writeFileSync('docs/axel-sport/manifeste.json', JSON.stringify(lignes, null, 2));
const n = (st: string) => lignes.filter((l) => l.statut === st).length;
let md = `# Manifeste Axel Sport : exercice → image → statut\n\n${lignes.length} exercices uniques · ${n('valide')} validés · ${n('genere_a_verifier')} générés à vérifier · ${n('a_refaire')} à refaire · ${n('a_generer')} à générer.\n\nLes prompts complets et autonomes sont dans \`manifeste.json\` (champ \`prompt\`).\n\n| # | id | Nom | Fichier | Statut | Vues départ / arrivée | Remarques |\n|---|---|---|---|---|---|---|\n`;
for (const l of lignes) md += `| ${l.numero} | \`${l.id}\` | ${l.nom} | \`${l.fichier}\` | ${LIB[l.statut]} | ${l.vuesDepartArrivee} | ${l.remarques ?? ''} |\n`;
writeFileSync('docs/axel-sport/manifeste.md', md);
console.log(`${lignes.length} exercices : ${n('genere_a_verifier')} générés à vérifier, ${n('a_generer')} à générer`);
