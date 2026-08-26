---
description: "Où j'en suis ?" — Claude lit l'état de ton projet et de tes comptes, et te dit la seule prochaine étape.
---

# /status — où en est ma recette

Répond à « où j'en suis ? / pourquoi c'est pas en ligne ? / il reste quoi ? » avec un **état clair** du
projet et **une** prochaine action. Pas un rapport technique : un point de situation qu'un débutant comprend
en 10 secondes.

## 0. Constitution
Applique **recette-core**. Tu résumes, tu ne noies pas. Tu finis **toujours** par la prochaine étape et une
proposition de la lancer.

## 1. Lire l'état réel (sans l'embêter)
Rassemble les faits depuis les fichiers et, si utile, un check léger des comptes :
- **Dossier d'app** : y a-t-il un `.recette/config.json` (créé par `new-app.mjs`) ? S'il manque, l'app n'a
  même pas encore été créée — la prochaine étape sera de la créer (voir §3), pas `/setup`.
- **Comptes** : ne devine pas d'après la présence du fichier (`.recette/secrets.env` peut exister **vide**).
  Lance le **même** script que `/setup` — `node "$CLAUDE_PROJECT_DIR/scripts/verify-secrets.mjs"` — c'est la
  **source unique de vérité** sur l'état des comptes : vert/rouge par un vrai appel réseau, avec le lien de
  réparation en cas d'échec. (Il teste en ligne ; si tu viens de le lancer, réutilise le résultat plutôt que
  de re-tirer pour rien.)
- **Idée** : `APP-SPEC.md` présent et verrouillé ?
- **Build** : `PROGRESS.md` — quelle est la **dernière phase cochée** (infra / scaffold / backend / cœur
  métier / paywall / landing / assets / audit) ? Reste-t-il des `⚠️`/`⛔` du dernier audit Definition-of-Done ?
- **En ligne** : la landing est-elle déployée (URL Vercel) ? Y a-t-il eu un build EAS / une soumission App
  Store (indices dans PROGRESS.md) ?

## 2. Afficher la carte de progression
Montre une frise simple avec des ✅ / 🔧 (en cours) / ⬜ (à faire) :

```
Ta recette
✅ Comptes branchés
✅ Idée cadrée (APP-SPEC verrouillé)
🔧 Construction : 4/7 phases  (backend ✅, cœur métier ✅, paywall ✅, landing 🔧)
⬜ Testée sur ton iPhone
⬜ Publiée sur l'App Store
```

Adapte-la à la réalité du projet. Si un audit a laissé des points ouverts, dis **combien** de `⛔`/`⚠️`
restent et lesquels comptent (surtout les bloquants Apple).

## 3. Donner LA prochaine étape
Traduis l'état en **une** action, comme le routeur de `/recette` :
- Pas de dossier d'app (`.recette/config.json` absent) → **créer l'app** avec `new-app.mjs` (avant tout secret).
- Comptes non branchés (rouge/absent chez `verify-secrets.mjs`) → `/setup`.
- Comptes OK, spec encore pleine de `TODO` → `/new`.
- Spec OK, build inachevé → `/build` (« je reprends là où on s'était arrêté »).
- Build fini, jamais testée → `/preview`.
- Testée, pas soumise → `/app-store`.
- Publiée → maintenance (`/fix`, `/update`, `/blog`).

Formule-la en proposition proactive : « Il te reste une étape avant de pouvoir la publier : la tester sur ton
téléphone. Je lance `/preview` ? »

## 4. Si quelque chose cloche
Si `/status` révèle une incohérence (build marqué fini mais l'audit a des `⛔`, landing pas vraiment en
ligne, token cassé…), dis-le calmement et propose de le régler (`/doctor` ou l'étape concernée). Jamais un
« tout va bien » de façade qui cache un blocage.
