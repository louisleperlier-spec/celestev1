# Bibliothèque d'illustrations Axel Sport

Remplacer les 50 illustrations d'exercices de NÉA par la mascotte **Axel Sport** (références de l'utilisateur dans `references/`) :
corps ivoire satiné, bandeau orange au logo Impulsion, short et poignets orange, machines graphite à détails orange.

## Fichiers

| Fichier | Rôle |
|---|---|
| `inventaire.md` / `.json` | Inventaire réel, tiré du code : 9 programmes → séances → exercices (selon lieu et niveau), 41 séances prêtes, 50 exercices uniques |
| `manifeste.md` / `.json` | Exercice → fichier → statut → prompt complet et autonome, paramètres, vues de départ / arrivée prévues |
| `generations.json` | Journal des images produites (id de génération ElevenLabs, modèle, date, statut, remarques de vérification) |
| `references/` | Planche personnage, planche des 30 mouvements, logo Impulsion recadré de la planche |
| `brut/<id>.webp` | Image brute générée (fond ivoire), pour pouvoir refaire le détourage |
| `prompts-chatgpt.md` | Mise en place à coller une fois avec les planches + un prompt par exercice, pour générer dans ChatGPT (`scripts/axel-sport-prompts-chatgpt.ts`) |
| `planches/` | Catalogue global (2 pages) et une planche par programme, assemblés depuis les visuels intégrés à l'app |

## Chaîne de production

**En une commande** : `scripts/axel-sport-ajouter.sh <id> <url_ou_fichier> <modele> [id_generation] [remarques]` fait tout ce qui suit après la
génération (outils de détourage installés tout seuls par `scripts/axel-sport-preparer.sh` dans /tmp). `a-generer.txt` = exercices restants, dans l'ordre.
**Automatique** (désactivée depuis le lot complet du 5 nov. 2026) : une tâche planifiée quotidienne génère les images suivantes avec le quota gratuit d'ElevenLabs, les ajoute et pousse sur la branche
(jamais de publication dans l'app tant que les 50 ne sont pas là).

1. **Générer** (ElevenLabs, flow « NÉA · Axel Sport · exercices » `BDRM2rFuELnvurnHQmGF`, modèle `gemini-3-pro-image`, les deux références
   branchées : assets `zc51MmjFoO1NCwzKC4gt` et `1mSjsRGdD5W74mBXBn6t`) avec le prompt du manifeste ; enregistrer l'image dans `brut/<id>.webp`
   et la ligne dans `generations.json`.
2. **Détourer** : `python scripts/axel-sport-detourer.py <isnet.onnx> docs/axel-sport/brut/<id>.webp assets/exercices/axel/<id>.webp`
   (ISNet + onnxruntime, recadrage, 900 px, WebP transparent : lisible sur fond graphite comme ivoire).
3. **Intégrer** : `npx tsx scripts/axel-sport-integrer.ts` régénère `src/data/exercicesAxel.ts` ; `EXERCICE_IMAGES` prend l'image Axel quand elle
   existe, sinon l'ancienne (repli). Aucun écran à modifier : listes, fiche, zoom, démo, séance guidée, Programme, cartes à jouer lisent `EXERCICE_IMAGES`.
4. **Manifeste et planches** : `npx tsx scripts/axel-sport-manifeste.ts` puis `python scripts/axel-sport-planches.py`.
5. **Vérifier** (`npm run verifier-donnees`, typecheck, lint, rendu) puis passer le statut à `valide` ou `a_refaire` après relecture humaine.

L'inventaire se régénère avec `npx tsx scripts/inventaire-exercices.ts` si les données changent.

## Règles

- Le personnage et les machines doivent être entiers, une seule figure, deux bras, deux jambes, contacts plausibles avec la machine.
- La surbrillance orange (lueur sous la surface) ne couvre que les muscles de la fiche (`muscles` de `src/data/exercices.ts`), distincte des vêtements.
- Un même exercice a un seul fichier, réutilisé dans tous les programmes et séances.
- Une image générée n'est pas une démonstration technique validée : chaque posture doit être relue avant publication.
- Les programmes, séries, répétitions, charges et repos ne changent pas pour coller aux images.
