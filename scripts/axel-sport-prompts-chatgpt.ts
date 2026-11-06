/// <reference types="node" />
/**
 * Prompts pour générer la bibliothèque Axel Sport dans ChatGPT (images) : un message de mise en place à coller une fois avec les deux
 * planches de référence, puis un prompt court par exercice (fiches de scripts/axel-sport-specs.ts). Écrit docs/axel-sport/prompts-chatgpt.md.
 * Lancer : npx tsx scripts/axel-sport-prompts-chatgpt.ts
 */
import { existsSync, writeFileSync } from 'node:fs';
import { EXERCICES } from '../src/data/exercices';
import { SPECS } from './axel-sport-specs';

const MISE_EN_PLACE = `Je joins deux images de référence : la planche personnage « NÉA / AXEL SPORT » et la planche des 30 mouvements.
Tu vas créer, une par une, les illustrations d'exercices de mon app NÉA avec ce personnage. Règles pour TOUTES les images de cette conversation :

PERSONNAGE (identique à la planche, à chaque image) : la mascotte Axel Sport. Corps athlétique stylisé en ivoire satiné (#F5EFE4), articulations
discrètes, anatomie cohérente ; tête arrondie sculptée ; deux yeux distincts lumineux dans des logements graphite ; petit sourire orange ; bandeau
orange (#FF6B1A) reprenant la forme en zigzag du logo NÉA ; short orange à bande ivoire ; poignets orange ; chaussures ivoire et orange ; petit
symbole NÉA orange sur le torse. Même rendu 3D doux et même lumière de studio que les planches.

MATÉRIEL : graphite (#242328) avec petits détails orange, proportions réalistes de salle de sport, aucun logo ni nom de marque.

MUSCLES : une lueur orange translucide SOUS la surface ivoire, uniquement sur les muscles que je cite, bien distincte des vêtements orange.

CADRAGE : personnage ET matériel entièrement visibles, centrés, marges généreuses ; fond ivoire uni et continu, ombre de contact douce ;
aucun texte, chiffre, étiquette ni cadre ; un seul personnage, exactement deux bras et deux jambes, contacts physiquement possibles avec la machine ;
format carré 1:1.

Réponds seulement « Prêt » ; je t'envoie ensuite un exercice par message et tu génères une image à chaque fois.`;

let md = `# Prompts ChatGPT : bibliothèque Axel Sport

## Mode d'emploi

1. Nouvelle conversation ChatGPT (modèle avec génération d'images). Joins **les deux planches** : \`docs/axel-sport/references/axel-sport-personnage.webp\`
   et \`axel-sport-30-mouvements.webp\` (ou tes fichiers d'origine), puis colle le **message de mise en place** ci-dessous.
2. Envoie ensuite **un exercice par message** (bloc « Prompt »). Si une image dérive (personnage différent, membre en trop, machine impossible),
   réponds « Refais en respectant exactement la planche personnage » plutôt que de continuer.
3. Après ~10 images, ouvre une nouvelle conversation avec les planches et la mise en place : la ressemblance tient mieux.
4. Télécharge chaque image sous le **nom de fichier indiqué** (\`<id>.png\`) et renvoie-les-moi : je les détoure, les intègre à l'app,
   et je mets à jour le manifeste et les planches.

## Message de mise en place (à coller une fois, avec les deux planches)

\`\`\`
${MISE_EN_PLACE}
\`\`\`

## Exercices (${EXERCICES.length})

`;
EXERCICES.forEach((e, i) => {
  const s = SPECS[e.id];
  const fait = existsSync(`assets/exercices/axel/${e.id}.webp`);
  md += `### ${String(i + 1).padStart(2, '0')}. ${e.nom} → \`${e.id}.png\`${fait ? ' · déjà fait (à refaire si la posture ne va pas)' : ''}\n\n\`\`\`\n`;
  md += `Exercice : ${e.nom}.\nPose : ${s.posture}.\nMatériel : ${s.materiel}.\nCaméra : ${s.camera}.\nPoints de contact : ${s.contacts}.\nLueur orange uniquement sur : ${s.muscles}.\nRespecte toutes les règles de la mise en place (Axel identique à la planche, fond ivoire uni, carré, tout visible, aucun texte).\n\`\`\`\n\n`;
});
md += `## Vues de départ et d'arrivée (optionnel, après les ${EXERCICES.length} images principales)

Pour un mouvement marqué « vues prévues » dans \`manifeste.md\`, envoie le même prompt en remplaçant la ligne « Pose » par :
- \`Pose : position de DÉPART de ce mouvement, même cadrage, même caméra et même matériel que l'image précédente.\` → \`<id>_depart.png\`
- \`Pose : position d'ARRIVÉE (fin de l'effort) de ce mouvement, même cadrage, même caméra et même matériel que l'image précédente.\` → \`<id>_arrivee.png\`
`;
writeFileSync('docs/axel-sport/prompts-chatgpt.md', md);
console.log('docs/axel-sport/prompts-chatgpt.md :', EXERCICES.length, 'prompts');
