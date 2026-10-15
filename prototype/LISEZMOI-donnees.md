# Données et images de NÉA (extraites du prototype)

- `data/` : toutes les données du prototype en JSON (coachs, 50 exercices, 41 séances, 18 programmes, modèles de séances, objectifs, offres NÉA Plus, quêtes, questions santé, rangs).
- `assets/exercices/` : les 50 illustrations en WebP haute qualité (900 px, fond transparent), nommées par l'id de l'exercice.
- `assets/coachs/` : `<coach>_corps.png` (mascotte entière, Axel = nouvelle version avec bandeau) et `<coach>_tete.webp` (avatar).
- `assets/deco/` : podium, poses d'Axel, vidéo d'accueil en boucle (`v_axel.mp4`), image de secours.

La logique (génération du programme, charges, calories, VFC, XP) est dans `nea-app.html`, section `<script>`.
