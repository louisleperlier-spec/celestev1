# Vidéo promo NÉA (reel 1080 × 1920, 25 s, sans son)

Style : iPhone 3D incliné sur fond noir à lueur orange, caméra qui tourne lentement, écrans de l'app refaits en 10K
(Accueil, Programme, Calendrier, Progrès, Profil), titres mot à mot, fin sur l'icône + « Disponible sur l'App Store ».

1. `npx expo export -p web --output-dir <dossier>/web`, servir ce dossier sur le port 8124 (pages `/x` → `x.html`).
2. `node capture.cjs <dossier>/ecrans` : profil de démonstration (Léa, coach Axel, 20 jours de série) injecté dans `nea2`,
   10 captures 1179 × 2556 ; copier `assets/images/icon.png` dans `ecrans/`.
3. `ecrans/` à côté de `video.html`, puis `node rendre.cjs 25` (750 images dans `frames/`) et
   `ffmpeg -framerate 30 -i frames/%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart nea-promo-reel.mp4`.
