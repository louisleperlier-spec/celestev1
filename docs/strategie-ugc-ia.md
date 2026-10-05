# Stratégie contenu TikTok IA — mémo

Objectif : faire connaître l'app via TikTok avec un persona IA et du contenu UGC généré et publié automatiquement.

## 1. La référence : @irsaslaw (« Irsa », app Fibi)

- Persona **100 % IA** (images Gemini, vidéos Sora) qui promeut une app de muscu pour femmes, Fibi.
- Format : histoire de fondatrice avec de l'émotion, texte d'accroche en surimpression.
  - « Maman papa j'arrête mes études pour créer mon application de musculation pour les filles » → **17 455 vues**
  - Même accroche, autre vidéo → 5 692 vues
  - « tu vas quand même pas arrêter l'école pour ton appli pour les femmes ? » → 2 928 vues
- Bio avec appel à l'action direct : « L'app c'est Fibi dans l'AppStore les filles 💕 ».
- Compte tout neuf (3 posts, 134 followers) : le format suffit à faire des vues.

## 2. Le stack retenu

| Étape | Outil |
|---|---|
| Brief, matrice d'angles, scripts | Claude |
| Images de départ du persona (même visage partout) | **Astra** (choix de Louis). À confirmer : s'il s'agit d'Astria (astria.ai), on entraîne un modèle sur le visage du persona et on l'appelle par API. Gemini (Nano Banana) en solution de secours |
| Vidéo qui parle (voix et lèvres synchronisées) | Veo 3 (même clé Google) ou Sora 2 |
| Carrousels photo (moins chers) | Images Astra + texte posé par du code |
| Sous-titres au mot près | Whisper (timestamps par mot) → `.ass` → ffmpeg |
| Montage, 9:16, musique, grain | ffmpeg (scripts) |
| Publication programmée | Postiz (API publique) |
| Lancement quotidien | GitHub Action |

Clés nécessaires : Astra (images), Google AI Studio (Veo), OpenAI si Sora, Postiz (avec le compte TikTok connecté), Anthropic.

## 3. Le pipeline

1. **Le brief** (`brief.txt`) : produit, avatar (qui achète : âge, douleurs, désirs, c'est le champ n°1), angles, casting, décor, ton, format et durée, CTA, ce qu'on évite.
2. **La fiche persona et la fiche décor** : un paragraphe figé chacune, réutilisé **mot pour mot** dans chaque prompt, jamais paraphrasé. C'est ce qui garde le même visage et le même décor d'un plan à l'autre.
3. **La matrice d'angles** (CSV, par exemple 24 lignes) : accroche, script, créateur, décor, produit, CTA. **À valider avant toute génération.**
4. **Les scripts** : écrits pour l'oral, avec élisions, une digression perso et une hésitation. Calibrage : 4 s = 10 à 12 mots. La ponctuation pilote le débit.
5. **Les images de départ d'abord, la vidéo ensuite.** On valide chaque image à 100 % de zoom : visage identique à la référence, 5 doigts, aucun texte déformé, produit exact. Une image ratée se relance en changeant **une seule variable** à la fois. Compter 3 à 5 essais par plan.
   - Prompt d'image en 7 blocs : sujet et action · produit tenu ou posé · cadrage · décor (fiche) · lumière (fiche) · style « iPhone brut, grain, aucune retouche » · interdits (texte inventé, logo déformé, mains coupées).
6. **L'animation** : image vers vidéo, **à la durée exacte du plan** (chaque seconde en trop se paie). Le prompt décrit uniquement le mouvement et ce qui ne doit PAS bouger. Tout est dicté : texte exact, ton, geste précis. Plans courts (2 à 5 s), visage de face. On contrôle les lèvres sur les b, p et m. Une seule voix et une seule configuration pour tout le batch.
7. **Le montage avec ffmpeg** : normaliser les plans (30 fps, 1080×1920, H.264, AAC 44,1 kHz), couper à la frame près (avec ré-encodage), concaténer, couper les silences de plus de 0,5 s, incruster les sous-titres au mot, filtre « téléphone » sur la voix (highpass, lowpass, légère réverb), musique à environ 0,12–0,15 sous la voix, léger grain (`noise=alls=6:allf=t`), `-crf 19 -pix_fmt yuv420p -movflags +faststart`.
8. **La publication** : Postiz programme 1 à 3 posts par jour. On passe par un **brouillon TikTok** pour ajouter un son tendance à la main.
9. **Le contrôle qualité** : les 2 premières secondes sans le son accrochent-elles ? Les sous-titres sont-ils lisibles ? Même visage d'un plan à l'autre ? Aucun rush en double ? CTA clair ? Rendu « filmé au tel » ? On ne refait que ce qui est raté.
10. **La boucle** : stats hebdo (rétention et vues pour l'organique, pas le taux de clic des pubs), on garde les accroches gagnantes et on les décline.

## 4. Dupliquer une vidéo qui marche (méthode « duplique une ad »)

On copie **la mécanique**, on regénère **la surface** : produit, persona, décor, texte. On ne reprend jamais les mots exacts ni les visages.

1. **Décoder** : `ffmpeg -i ad.mp4 -vf fps=1 frames/f_%03d.png` + transcription Whisper. Une fiche par plan : timecode, ce qu'on voit, fonction (accroche / problème / démo / preuve / objection / CTA), audio, texte à l'écran, énergie. Puis une ligne par plan pour résumer.
2. **Transposer** : mêmes timecodes, mêmes fonctions, avec notre app. Les variantes se préparent ici (5 à 10 versions du plan 1).
3. **Regénérer** : images de départ, puis animation, puis voix et lèvres (voir le pipeline ci-dessus).
4. **Monter** avec ffmpeg.

Coût d'une duplication d'environ 25 s (6 plans) : environ 6 à 15 $ de génération.

## 5. Accroches à adapter

- « Maman papa j'arrête mes études pour créer [app] » (le format Irsa)
- « J'ai testé [app] pendant 30 jours, voilà ce qui s'est passé »
- « Personne t'a dit ça sur [problème] »
- « Arrête de [erreur commune] tout de suite »
- « J'aurais aimé savoir ça avant de [action] »
- « POV : tu découvres [app] et tu peux plus revenir en arrière »
- « 3 signes que t'as besoin de [app] »
- « Si t'as [problème], regarde ça jusqu'au bout »
- « Avant / après [durée] avec [app] »
- « Arrête de scroller si t'as [problème] »

Pour démultiplier : accroche ×4 · musique ×4 · personnage ×3–5 · langue. Sur TikTok, seul le 9:16 compte.

## 6. Coûts estimés

- Vidéo parlante : environ 0,13 à 0,15 $ par seconde générée, soit environ 2 à 3 $ pour une vidéo de 15 s (2 ou 3 clips de 8 s).
- Carrousel photo : quelques centimes.
- Rythme d'1 vidéo par jour : environ 60 à 90 $ par mois, moins en alternant avec des carrousels.
- Économies : générer d'abord des aperçus courts, réutiliser les images de départ validées, ne jamais générer plus long que le plan.

## 7. Règles à respecter

- Cocher le **label « contenu généré par IA »** sur TikTok. Sans lui, le compte risque d'être bridé ou banni.
- Mention **« Image virtuelle »** obligatoire en France pour la promo commerciale avec image IA (loi influenceurs 2023).
- Pas de faux témoignages ni de faux chiffres présentés comme réels.

## Sources

- https://tivollem.com/fichiers/opus55-ugc-ia-process-fr.pdf (matrice d'angles, batch, rendu)
- https://tivollem.com/fichiers/ugc-ia-fr.pdf (playbook UGC IA, accroches, réalisme, coûts)
- https://tivollem.com/fichiers/duplique-une-ad-fr.pdf (décoder et dupliquer une pub)

## À faire

- [ ] Rédiger le brief de l'app et la fiche du persona
- [ ] Récupérer les clés API (Google AI Studio, Postiz, Anthropic)
- [ ] Coder le pipeline : brief → matrice → images de départ → vidéo → montage → Postiz
- [ ] GitHub Action quotidienne
