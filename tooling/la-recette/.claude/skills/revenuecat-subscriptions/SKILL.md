---
name: revenuecat-subscriptions
description: >
  Intègre les abonnements in-app (IAP) iOS via RevenueCat + App Store Connect, avec paywall, essai
  gratuit, entitlements et vérité serveur côté Supabase, selon un playbook éprouvé en production. Utilise
  ce skill dès qu'on ajoute des abonnements, un paywall, un modèle freemium, des achats intégrés,
  RevenueCat, un essai gratuit, ou qu'on doit configurer/tester des subscriptions iOS (sandbox/TestFlight)
  ou débloquer le premium d'un utilisateur. Couvre les pièges « Missing Metadata », le webhook →
  is_premium, et le test d'achat.
---

# RevenueCat Subscriptions — IAP iOS

Modèle type : freemium (un quota d'actions gratuites → **Premium**), abo hebdo + annuel, essai gratuit
3 jours sur l'hebdo. Vérité serveur = `profiles.is_premium` dans Supabase.

## 1. App Store Connect — créer les produits
- **Abonnements auto-renouvelables** dans un **groupe d'abonnement** (ex. « App plus »).
  Ex : `app_plus_weekly` (1 semaine) + `app_plus_annual` (1 an), prix, 175 pays.
- ⚠️ **Piège « Missing Metadata »** : un abo reste bloqué (et les offerings RevenueCat restent **VIDES**)
  tant qu'il manque : (a) un **screenshot de review** (ex. capture du paywall, 1290×2796) ET (b) la
  **localisation du GROUPE d'abonnement** (display name localisé). Faire les deux → « Ready to Submit ».
- **Essai gratuit** : sur l'abo → Subscription Prices → **Introductory Offers** → Free / 3 days, tous
  territoires. RevenueCat le lit tout seul. Visible **uniquement en build réel** (pas Expo Go).

## 2. RevenueCat — config
- Projet RC → **app iOS liée** via une **In-App Purchase Key `.p8`** (App Store Connect → Keys).
- Importer les 2 produits → créer un **entitlement** (ex. `app_plus`) contenant les 2 → un **offering**
  `default` marqué **Current** avec les packages `$rc_weekly` + `$rc_annual`.
- **Clé SDK iOS publique** (`appl_…`) → dans `.env` (`EXPO_PUBLIC_REVENUECAT_IOS_KEY`) **et dans les 3
  profils de `eas.json`** (les env sont gravées au build).

## 3. App (Expo) — `react-native-purchases`
- No-op propre en Expo Go (module natif absent) : garder l'app fonctionnelle sans crash.
- Configurer au démarrage, lier l'app user à l'user Supabase (`configurePurchases(userId)` + `logIn`).
- Paywall : lire l'offering courant, afficher les packages. Pour l'essai : lire
  `weekly.product.introPrice` → afficher « Gratuit 3 jours, puis X/sem » + mention légale ; fallback propre
  au prix simple si pas d'offre. Ancrer l'annuel avec un équivalent hebdo neutre (« ≈ X/sem »).
- **« Restaurer les achats »** OBLIGATOIRE sur **chaque** surface d'achat (règle Apple 3.1.1) — y compris
  un éventuel paywall « cadeau ».
- `usePremium` = `profiles.is_premium` (serveur) **OU** entitlement RC actif (secours local).

## 4. Webhook RevenueCat → Supabase (vérité serveur)
- Edge Function `revenuecat-webhook` : à chaque event RC (GRANT/EXPIRE…), **upsert** `profiles.is_premium`.
  Auth par header secret (`REVENUECAT_WEBHOOK_SECRET`). Faire un **UPSERT** sur GRANT (créer le profil s'il
  manque) — sinon un payant reste bloqué côté serveur.
- Coller l'URL du webhook RC dans RevenueCat, et l'URL **Apple Server-to-Server** (Production V2) dans
  App Store Connect → App Information → App Store Server Notifications.
- Le quota (actions offertes) est vérifié/incrémenté **côté serveur** (Edge Function), jamais par le client.

## 5. Tester l'achat
- **TestFlight** : les achats sont **automatiquement en sandbox** (gratuits) — pas besoin de compte sandbox
  séparé. C'est la façon la plus simple de tester le flux complet + Restore + l'essai 3j.
- Sinon : App Store Connect → Users and Access → **Sandbox** → testeur neuf → build dev/preview.
- **Rebuild obligatoire** après avoir changé la clé RC dans `eas.json` (gravée au build).
- Vérifier : le paywall affiche l'essai/les prix, l'achat débloque Premium, « Restaurer » marche,
  `profiles.is_premium=true` après achat.

## 6. Pour la review Apple (voir skill `app-store-launch`)
- Fournir un **compte démo gratuit** (qui atteint le paywall) pour que le reviewer teste l'abo, EN PLUS
  d'un compte premium. Sélectionner les abonnements **dans la version** au moment de la soumission (sinon
  ils ne passent pas la review).
- Small Business Program (15 % au lieu de 30 %) : s'inscrire + activer la date dans RevenueCat.
