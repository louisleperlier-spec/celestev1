---
description: "Erreur bizarre, ça marche pas ?" — Claude diagnostique la panne, la répare, et enrichit sa base de pannes.
argument-hint: "[décris ce qui se passe, ou colle le message d'erreur]"
---

# /doctor — diagnostiquer + réparer une panne

Le filet de sécurité de La Recette. Dès que quelque chose casse et que ce n'est pas clairement un bug d'app
(`/fix`) ou un rejet Apple (`/rejected`) — un token qui ne marche plus, un build qui échoue, un déploiement
qui casse, un « network request failed » — tu **diagnostiques** via la base de pannes, tu **répares**, et tu
**notes** tout cas inédit pour rendre le système plus robuste.

Symptôme / erreur : **$ARGUMENTS** (si vide : demande *ce qu'elle faisait* + *le message exact* — elle peut
coller/screenshotter).

## 0. Constitution
Applique **recette-core**. **Jamais de stacktrace brute** : rassure (« pas de panique, c'est courant ») →
explique en une phrase → corrige ou donne LA prochaine action. Jamais de boucle infinie qui brûle ses tokens
ou son argent. Jamais de cul-de-sac.

## 1. Consulter la base de pannes AVANT de réfléchir dans le vide
Charge le skill **doctor** et cherche le symptôme dans sa table **symptôme → diagnostic → fix**. Elle couvre
les pièges connus (accumulés sur de vrais lancements en production), entre autres :
- **SDK Expo ≠ Expo Go** (l'app ne s'ouvre pas sur le téléphone) → pinner le bon SDK.
- **Token au mauvais scope / expiré** (GitHub, Supabase, Vercel, Expo…) → régénérer, re-`/setup` du secret.
- **« Agreements not signed »** côté Apple → signer les contrats dans App Store Connect.
- **Creds/provisioning EAS** au build iOS → régénérer via EAS.
- **Bundle id déjà pris** → en choisir un autre, mettre à jour la config.
- **RLS récursif / policy Supabase** → corriger la policy.
- **Free tier Supabase plein (2 projets)** → réutiliser un projet, pas en créer un 3e.
- **Scroll/swipe imbriqués RN** (« je peux ni scroller ni swiper ») → `ScrollView`/`FlatList` de
  `react-native-gesture-handler`.
- **« Network request failed » au signup** → **vérifie D'ABORD** que le projet Supabase n'est **pas en
  pause** (free tier : ~7 j d'inactivité = backend en veille, *pas* transitoire — il faut le réveiller) ;
  **seulement ensuite**, backend confirmé actif, conclus au hoquet **réseau/DNS transitoire** → retry
  automatique. Ne jamais conclure « transitoire » avant d'avoir écarté la pause (fiche C2).

## 2. Diagnostiquer méthodiquement (si pas dans la base)
- Isole **la couche** en cause : app (Expo/RN) · backend (Supabase/edge fn) · build/soumission (EAS/Apple) ·
  site (Vercel) · comptes (tokens `.recette/secrets.env`).
- Regarde les **preuves réelles** : sortie de commande, logs Metro, logs Edge Function, statut EAS, réponse
  HTTP d'un endpoint. Ne devine pas quand tu peux vérifier.
- Forme une hypothèse unique, teste-la, ajuste. Une chose à la fois.

## 3. Réparer + self-verify
- Applique le fix, puis **prouve** que c'est réglé : `tsc --noEmit` + `expo export` pour le code ; un appel
  réel pour un token/endpoint ; un rebuild pour un souci de build.
- Si après des essais raisonnables c'est **vraiment** bloqué : **stop propre** → explication simple de ce qui
  coince → LA prochaine action, ou la **passerelle support** (lien communauté/support). Jamais « je ne peux
  pas » tout court.

## 4. Enrichir la base (ce qui rend La Recette meilleure)
Tout **bug inédit** résolu → note-le dans `$CLAUDE_PROJECT_DIR/.claude/skills/doctor/journal.md` (symptôme observé → diagnostic → fix
appliqué). C'est le mécanisme qui fait que chaque panne rencontrée protège le prochain client.

## 5. Reporter
Dis en clair : ce qui n'allait pas, ce que tu as réparé, et comment vérifier que c'est bon. Puis remets-la
sur les rails vers ce qu'elle voulait faire (`/preview`, `/deploy`, `/app-store`…).
