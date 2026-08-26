---
description: Publie une nouvelle version de ton app déjà en ligne — bump de version, build, et soumission de la mise à jour.
---

# /update — sortir une nouvelle version au store

L'app est déjà publiée (ou déjà passée en review) et on veut envoyer une **mise à jour** (nouvelles
features, corrections). Tu montes la version, tu builds, tu soumets — en expliquant chaque étape simplement.

## 0. Constitution + skill
Applique **recette-core**. Charge **app-store-launch**. Détecte sa langue. Confirme l'irréversible (un
nouveau build coûte du temps machine ; une soumission part chez Apple).

## 1. Récapituler ce qui part
En une phrase humaine, liste **ce que cette version apporte** (« cette mise à jour ajoute le partage de
recettes et corrige le bug de connexion »). Ça servira aussi aux **notes de version** (« What's New »)
sur l'App Store — prépare-les.

Vérifie d'abord que les changements sont **finis et testés** : self-verify (`tsc --noEmit` + `expo export`),
et si ça touche du natif/paywall, un passage TestFlight s'impose (voir plus bas). Ne builds pas du code cassé.

## 2. Monter la version (bump)
Deux numéros à distinguer, explique-les simplement :
- **Version marketing** (`version` dans `app.json`, ex. 1.0.1) = ce que voient les utilisateurs. On la monte
  pour une vraie nouveauté.
- **Build number** (`ios.buildNumber`) = compteur interne exigé par Apple, **doit augmenter à chaque
  upload**. EAS l'auto-incrémente (`autoIncrement` en profil production), mais vérifie qu'il est bien
  supérieur au dernier soumis.
- **Commit le bump** pour garder l'historique propre.

## 3. Build + upload (EAS, cloud)
- `npx eas-cli@latest build --profile production --platform ios --non-interactive --no-wait` (les creds sont
  déjà sur EAS depuis la 1re fois → pas de login Apple à refaire).
- Suis le statut : `npx eas-cli@latest build:list --platform ios --limit 1 --non-interactive`.
- Upload : `npx eas-cli@latest submit --profile production --platform ios --latest --non-interactive`
  (l'API Key ASC est déjà stockée).

## 4. Tester la mise à jour sur TestFlight (si le changement le mérite)
Pour tout ce qui touche le **natif, le paywall, l'auth, les deep-links** : attends *Ready to Test* sur
TestFlight et **teste la nouvelle version en réel** avant de soumettre. Un correctif purement cosmétique déjà
validé en Expo Go peut sauter cette étape — à toi de juger et de le dire.

## 5. Soumettre la mise à jour
Dans App Store Connect : crée la **nouvelle version** (le numéro marketing), colle les **notes « What's
New »**, sélectionne le **nouveau build**, vérifie que rien de nouveau n'exige une mise à jour de l'App
Privacy ou du compte démo. Puis, avec sa confirmation : **Add for Review → Submit for Review**.

> ⚠️ Si la mise à jour ajoute une **nouvelle donnée collectée**, un **login social**, de l'**IA**, ou de
> l'**UGC**, repasse par la Definition-of-Done : ces ajouts déclenchent de nouvelles obligations Apple
> (App Privacy, Sign in with Apple, consentement IA, modération). Ne soumets pas sans les fermer.

## 6. Après
Explique le délai de review et les statuts. Reste dispo pour un `/rejected` si besoin. Félicite-la : sortir
des mises à jour, c'est ce qui fait vivre une app.
