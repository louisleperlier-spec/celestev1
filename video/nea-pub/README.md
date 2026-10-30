# Vidéo publicitaire NÉA (Remotion)

Vidéo verticale **1080 × 1920, 30 fps, 31 s** : accroche, solution, 3 étapes (Programme · Séance · Progrès), synthèse, conclusion.
Projet React / TypeScript indépendant de l'app (exclu du `tsc` et du lint de l'app).

## Commandes

```bash
cd video/nea-pub
npm install
npm run preview        # Remotion Studio : prévisualisation, timeline, image par image
npm run render         # export MP4 → out/nea-pub.mp4
npm run reseaux        # copie pour Instagram / TikTok (yuv420p, son normalisé à -15 LUFS) → out/nea-pub-reseaux.mp4
npm run still          # une image fixe (contrôle)
npm run typecheck
```

Remotion télécharge son propre Chrome au premier rendu. Pour utiliser un Chrome déjà installé :
`NEA_CHROME=/chemin/vers/chrome-headless-shell npm run render`.

## Où modifier quoi

| Fichier | Contenu |
|---|---|
| `src/config/textes.ts` | tous les textes affichés, la voix off ligne par ligne, groupes et mots orange des sous-titres |
| `src/config/timeline.ts` | début / fin de chaque scène (secondes), délai de la voix |
| `src/config/theme.ts` | couleurs (graphite #1D1E23, orange #FF6B1A, crème #F6F3ED), police, marges de sécurité, ressorts, durée des transitions (9 images) |
| `src/config/assets.ts` | fichiers attendus dans `public/`, zones repérées dans les captures (cadrages, surlignages), source de la voix |
| `src/components/` | `Decor` (cubes et disques 3D), `Mascotte` (regarde, pointe, acquiesce, célèbre), `CarteCapture` (capture recadrée, zoom, surlignage), `Etapes`, `TitreAnime`, `SousTitres`, `Scene` |
| `src/scenes/Scenes.tsx` | les 7 scènes |

Marges laissées libres pour l'interface des réseaux : 120 px en haut, 260 px en bas, 100 px à droite.

## Assets (`public/`)

- `mascotte-nea.png` : le robot NÉA (animé seulement par translation, rotation et rebond, sans déformation)
- `captures/accueil.png`, `captures/programme.png`, `captures/progres.png` : **vraies captures de l'app** (rendu web de l'app NÉA,
  profil de démonstration « Louis »), recadrées et zoomées, jamais redessinées. Pour mettre tes propres captures d'iPhone,
  remplace ces fichiers et ajuste `largeur` / `hauteur` et les `ZONES` dans `src/config/assets.ts`.
- `fonts/Inter.woff2` : Inter (variable, ExtraBold 800 utilisé)
- `audio/voix_0.wav` … `voix_6.wav` : voix off (une ligne par scène), `audio/musique.wav`, `audio/clic.wav`, `glisse.wav`, `pop.wav`

## Voix off, musique, sons

- **Voix** : générée avec edge-tts (voix fr-CA Antoine) par `npm run voix` (`scripts/voix.py`), qui écrit aussi
  `scripts/mots.json` (instant de chaque mot) ; copie-le dans `src/config/mots.json` pour recaler les sous-titres.
- **Ta propre voix** : pose `public/audio/voiceover.wav` (la voix complète, à partir de 0 s) et mets
  `VOIX_SOURCE = 'complete'` dans `src/config/assets.ts`. `VOIX_SOURCE = 'aucune'` donne une version sans voix.
  Les sous-titres suivent `mots.json` : avec une autre voix, recale `timeline.ts` ou régénère `mots.json`.
- **Musique** : composée par `scripts/sons.py` (synthèse, aucune œuvre tierce), donc utilisable commercialement ;
  elle baisse automatiquement sous la voix. **Sons** : clic aux étapes, glissement aux changements de scène, pop des coches.

## Script et timings

| Temps | Scène | Voix off |
|---|---|---|
| 0–3 s | Accroche | Tu arrives à la salle sans savoir quoi faire ? |
| 3–7 s | Solution (capture de l'accueil) | Avec NÉA, retrouve ton programme et passe à ta séance. |
| 7–11,8 s | 1. Ouvre ton programme (zoom et surlignage « Masse 8 semaines ») | Un : ouvre ton programme. Tu retrouves ce qui est prévu. |
| 11,8–17,4 s | 2. Retrouve tes exercices (séance « Bas du corps », séries × répétitions) | Deux : retrouve tes exercices, tes séries et tes répétitions. |
| 17,4–22,8 s | 3. Consulte tes progrès (« Ton ascension », puis la barre d'XP) | Trois : consulte tes progrès et garde le fil de ton parcours. |
| 22,8–26,8 s | Synthèse (fond orange, 3 coches) | Ton programme, tes séances, tes progrès. Au même endroit. |
| 26,8–31 s | Conclusion (logo, Découvre NÉA, neacoach.xyz) | Découvre NÉA sur neacoach point xyz. |

Les scènes durent un peu plus que le découpage de départ (3 / 6 / 11 / 17 / 23 / 26 / 30 s) pour que chaque phrase de la voix tienne
dans sa scène ; la dernière seconde reste fixe.
