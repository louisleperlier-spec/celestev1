# Carrousels TikTok

Tes images + mes textes → slides 9:16 avec texte style TikTok + légende prête à copier-coller.

## Le mode d'emploi (gratuit, sans Postiz)

1. Tu m'envoies tes images (faites avec GPT Astra) et ce que tu veux raconter.
2. J'écris le carrousel (`carousels/<id>.json`) et je génère les slides.
3. Je t'envoie les slides et la légende directement dans la conversation. Tu les enregistres sur ton téléphone.
4. Dans TikTok : **+** → **Photo** → tu sélectionnes les slides dans l'ordre → tu ajoutes un son tendance → tu colles la légende → tu actives le label « contenu généré par IA » → tu publies.

Tu peux aussi récupérer les slides depuis GitHub : chaque carrousel poussé sur `main` est rendu par la GitHub Action, et le zip est disponible dans l'onglet **Actions** → le run → **Artifacts**.

La publication automatique via Postiz (payant, 29 $/mois, 7 jours d'essai) est prête mais optionnelle : voir plus bas.

```
slideshow/
├── images/       # tes images (faites avec GPT Astra), en .jpg / .png
├── carousels/    # un fichier .json par carrousel (textes, ordre des images, légende, date)
├── fonts/        # TikTok Sans (licence OFL)
├── render.py     # images + textes → out/<id>/01.jpg, 02.jpg…
├── publish.py    # (optionnel) envoie out/<id>/ sur TikTok via Postiz
└── out/          # slides rendues + legende.txt (non versionnées)
```

## Un carrousel

`carousels/002-mon-histoire.json` :

```json
{
  "id": "002-mon-histoire",
  "title": "Titre du post (90 caractères max)",
  "caption": "La légende du post",
  "hashtags": ["#startup", "#appli"],
  "date": "2026-10-06T18:00:00+02:00",
  "style": { "variant": "outline", "position": "center", "size": 64 },
  "slides": [
    { "image": "cafe.jpg", "text": "Le texte de la slide 1" },
    { "image": "chambre.jpg", "text": "Slide 2", "style": { "position": "bottom" } },
    { "image": "salle.jpg", "text": "Slide 3", "style": { "variant": "box" } }
  ]
}
```

- `date` : optionnelle. Avec, le post est programmé dans Postiz ; sans, il part tout de suite.
- `style.variant` : `outline` (texte blanc contour noir) ou `box` (texte noir sur fond blanc).
- `style.position` : `top`, `center`, `bottom` ou une fraction de la hauteur (`0.3`).
- `style` peut être défini pour tout le carrousel et surchargé slide par slide.
- Utilise `\n` dans un texte pour forcer un retour à la ligne. Mets les emojis dans la légende plutôt que sur les slides : la police n'en contient pas.
- `"fit": "contain"` sur une slide : l'image entière est gardée (sans recadrage) sur un fond flou, utile pour une affiche. Options : `"scale"` (0.9 = 90 % de la largeur) et `"valign"` (`top`, `center`, `bottom`).
- Les fichiers qui commencent par `_` ne sont jamais publiés automatiquement.

## En local (optionnel)

```bash
pip install -r requirements.txt
python3 render.py carousels/002-mon-histoire.json     # regarde le résultat dans out/002-mon-histoire/
export POSTIZ_API_KEY=...                              # Postiz → Settings → Public API
python3 publish.py carousels/002-mon-histoire.json --dry-run   # affiche la requête sans rien envoyer
python3 publish.py carousels/002-mon-histoire.json
```

Modes de publication :

| Commande | Ce qui se passe |
|---|---|
| *(défaut)* | Le carrousel arrive dans ta **boîte de réception TikTok**. Tu ajoutes un son tendance et le label « contenu généré par IA », puis tu publies. |
| `--direct` | Publication directe, TikTok ajoute une musique automatiquement. L'API ne permet pas de cocher le label IA sur les photos. |
| `--draft` | Brouillon dans Postiz seulement, rien n'est envoyé à TikTok. |

Un carrousel déjà publié n'est pas renvoyé (`--force` pour le republier).

## Automatique avec GitHub

Le workflow `.github/workflows/carrousels-tiktok.yml` rend chaque nouveau carrousel poussé sur `main` dans `slideshow/carousels/` et met les slides à télécharger.
On peut aussi le lancer à la main depuis l'onglet **Actions**.

Pour activer en plus la publication automatique via Postiz, ajoute dans **Settings → Secrets and variables → Actions** du repo :

- `POSTIZ_API_KEY` (obligatoire)
- `POSTIZ_TIKTOK_ID` (si tu as plusieurs comptes TikTok dans Postiz)
- `POSTIZ_URL` (seulement si Postiz est auto-hébergé : `https://<domaine>/api/public/v1`)

## Règles

- Label « contenu généré par IA » sur TikTok pour les images IA réalistes.
- Mention « image virtuelle » en légende pour la promo commerciale avec une image IA (loi française de 2023 sur les influenceurs).
