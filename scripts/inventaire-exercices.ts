/// <reference types="node" />
/**
 * Inventaire réel des exercices (pour la bibliothèque d'illustrations Axel Sport) : exécute `buildPlan` sur toutes les
 * combinaisons coach × programme × niveau × lieu × jours × durée × objectifs, puis lit les 41 séances prêtes.
 * Écrit docs/axel-sport/inventaire.json et inventaire.md. Lancer : npx tsx scripts/inventaire-exercices.ts
 */
import { writeFileSync } from 'node:fs';
import { COACHES } from '../src/data/coaches';
import { EXERCICES } from '../src/data/exercices';
import { PROGRAMMES } from '../src/data/programmes';
import { GOALS, GROUPES, MATERIEL } from '../src/data/referentiels';
import { SEANCES } from '../src/data/seances';
import { TEMPLATES } from '../src/data/templates';
import { buildPlan, type Profil } from '../src/lib/plan';

const NIVEAUX = ['deb', 'int', 'adv'] as const;
const LIEUX = ['maison', 'salle', 'deux'] as const;
const JOURS = [2, 3, 4, 5, 6, 7] as const;
const DUREES = [20, 30, 45, 60] as const;
const NOW = Date.parse('2026-11-05T12:00:00Z');
const goalsIds = GOALS.map((g) => g[0]);
// Toutes les combinaisons d'objectifs (les finishers et le retour au calme en dépendent).
const combis: (typeof goalsIds)[] = [];
for (let m = 0; m < 1 << goalsIds.length; m++) combis.push(goalsIds.filter((_, i) => m & (1 << i)));

type Ligne = { programme: string; coach: string; seance: string; titre: string; exercice: string; lieux: string[]; niveaux: string[] };
const prog: Record<string, Ligne> = {};
for (const c of COACHES)
  for (const pr of PROGRAMMES[c.id])
    for (const level of NIVEAUX)
      for (const gear of LIEUX)
        for (const days of JOURS)
          for (const dur of DUREES)
            for (const goals of combis) {
              const p: Profil = { coach: c.id, goals, level, gear, days, dur, weight: 75, age: 30, progs: { [c.id]: pr.id }, progStart: new Date(NOW).toISOString() };
              for (const se of buildPlan(p, NOW).sessions)
                for (const it of se.items) {
                  const k = `${pr.id}|${se.key}|${it.id}`;
                  const l = (prog[k] ??= { programme: pr.id, coach: c.id, seance: se.key, titre: TEMPLATES[se.key][0], exercice: it.id, lieux: [], niveaux: [] });
                  if (!l.lieux.includes(gear)) l.lieux.push(gear);
                  if (!l.niveaux.includes(level)) l.niveaux.push(level);
                }
            }

const catalogue = SEANCES.map((s) => ({ id: s.id, titre: s.t, lieu: s.lieu, coach: s.coach, exercices: s.ex.map((x, i) => ({ ordre: i + 1, id: x.split(':')[0], ligne: x })) }));
const utilises = new Set([...Object.values(prog).map((l) => l.exercice), ...catalogue.flatMap((s) => s.exercices.map((e) => e.id))]);
const exercices = EXERCICES.map((e) => ({
  id: e.id,
  nom: e.nom,
  groupe: GROUPES[e.groupe],
  materiel: MATERIEL[e.materiel],
  niveau: e.niveau,
  muscles: e.muscles,
  visuelActuel: `assets/exercices/${e.id}.webp`,
  utilise: utilises.has(e.id),
  programmes: [...new Set(Object.values(prog).filter((l) => l.exercice === e.id).map((l) => l.programme))],
  seancesPretes: catalogue.filter((s) => s.exercices.some((x) => x.id === e.id)).map((s) => s.id),
}));
const programmes = COACHES.flatMap((c) =>
  PROGRAMMES[c.id].map((pr) => {
    const lignes = Object.values(prog).filter((l) => l.programme === pr.id);
    const seances = [...new Set(lignes.map((l) => l.seance))].map((s) => ({
      seance: s,
      titre: TEMPLATES[s as keyof typeof TEMPLATES][0],
      exercices: lignes.filter((l) => l.seance === s).map((l) => ({ id: l.exercice, lieux: l.lieux, niveaux: l.niveaux })),
    }));
    return { id: pr.id, nom: pr.nom, coach: c.id, seances };
  }),
);
writeFileSync('docs/axel-sport/inventaire.json', JSON.stringify({ programmes, seancesPretes: catalogue, exercices }, null, 2));

let md = `# Inventaire des exercices de NÉA\n\nGénéré par \`scripts/inventaire-exercices.ts\` à partir du code réel : \`buildPlan\` sur ${COACHES.length} coachs × programmes × 3 niveaux × 3 lieux × 6 rythmes × 4 durées × ${combis.length} combinaisons d'objectifs, puis les ${SEANCES.length} séances prêtes.\n\n`;
md += `**${exercices.length} exercices uniques** dans la bibliothèque, **${utilises.size} utilisés** par les programmes ou les séances prêtes.\n\n## Programmes → séances → exercices\n\nLes séances des programmes sont construites selon le profil (lieu, niveau, objectifs) : chaque séance liste tous les exercices qu'elle peut contenir.\n\n`;
for (const p of programmes) {
  md += `### ${p.nom} (\`${p.id}\`, coach ${p.coach})\n\n`;
  for (const s of p.seances) md += `- **${s.titre}** (\`${s.seance}\`) : ${s.exercices.map((e) => `\`${e.id}\`${e.lieux.length < 3 ? ` (${e.lieux.join(', ')})` : ''}`).join(', ')}\n`;
  md += '\n';
}
md += `## Séances prêtes (${catalogue.length})\n\n`;
for (const s of catalogue) md += `- **${s.titre}** (\`${s.id}\`, ${s.lieu}, ${s.coach}) : ${s.exercices.map((e) => `${e.ordre}. \`${e.id}\``).join(', ')}\n`;
md += `\n## Exercices uniques (${exercices.length})\n\n| # | id | Nom | Groupe | Matériel | Programmes | Séances prêtes |\n|---|---|---|---|---|---|---|\n`;
exercices.forEach((e, i) => (md += `| ${i + 1} | \`${e.id}\` | ${e.nom} | ${e.groupe} | ${e.materiel} | ${e.programmes.length} | ${e.seancesPretes.length} |\n`));
writeFileSync('docs/axel-sport/inventaire.md', md);
console.log(`${programmes.length} programmes, ${catalogue.length} séances prêtes, ${exercices.length} exercices (${utilises.size} utilisés)`);
console.log('Non utilisés :', exercices.filter((e) => !e.utilise).map((e) => e.id).join(', ') || 'aucun');
