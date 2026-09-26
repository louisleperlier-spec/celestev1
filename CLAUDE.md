# celestev1

## Landing page « nea »

Pour construire la landing page **nea**, utilise le skill **copycat** installé dans
`.claude/skills/copycat` (source : https://github.com/minosdevs/copycat-skill, commit `3df978b`, licence MIT).

- Workflow : `.claude/skills/copycat/SKILL.md` (capture → lecture → fondations → sections → vérification → livraison).
- Dépendances, une seule fois : `cd .claude/skills/copycat/scripts && npm install`
  (Chromium est déjà fourni dans l'environnement cloud ; ne pas lancer `playwright install` là-bas).
- Capture : `node .claude/skills/copycat/scripts/capture.mjs <url> --out copycat/<host>`
- Comparaison : `node .claude/skills/copycat/scripts/compare.mjs --original copycat/<host> --clone http://localhost:3000`
- Objectif : verdict A (< 2 % de mismatch, console propre).
- Remplacer logos, photos et textes d'un tiers par les assets propres à nea.
