---
name: app-store-launch
description: >
  Publie une app Expo/iOS sur l'App Store de A à Z : EAS build & credentials, upload, TestFlight, fiche
  App Store Connect (ASO, App Privacy label, âge, comptes démo, notes review), screenshots, et « Add for
  Review ». Utilise ce skill dès qu'on veut builder pour iOS, soumettre/publier une app, uploader sur
  TestFlight, tester un build de prod, remplir App Store Connect, gérer les certificats/provisioning EAS,
  répondre à un rejet Apple, ou débloquer quoi que ce soit lié à la soumission App Store. Contient les
  pièges éprouvés en production (creds, TestFlight invite, ascAppId, abos, App Privacy, export compliance).
---

# App Store Launch — Expo → App Store

**Pas besoin de Mac** → tout passe par **EAS** (cloud). CLI : `npx eas-cli@latest` (pas `eas` global).

## Vue d'ensemble (ordre)
`eas build` (creds/certs) → `eas submit` (upload ASC) → **TestFlight** (tester le VRAI build) → remplir la
fiche App Store Connect → screenshots + attacher le build → **Add for Review → Submit for Review**.

Le **même build de prod** sert pour TestFlight ET pour la soumission App Store. Toujours **tester sur
TestFlight avant** de soumettre (reset mdp deep-link, IAP, perf ne se valident qu'en build standalone).

## 1. EAS build
- `eas.json` : profils `development` (dev-client, ad-hoc, `simulator:false`), `preview` (internal, release-like,
  install direct), `production` (`autoIncrement:true`, App Store). Mettre les **env** (URL Supabase, clé anon,
  clé RC) dans chaque profil.
- **1ère fois = login Apple pour générer** le **Distribution Certificate** + **Provisioning Profile**.
  Par défaut c'est **interactif** (Apple ID + **code 2FA** tapé au terminal) → **un agent ne peut pas
  remplir ce prompt stdin**. Rends-le **non-interactif AVANT de lancer**, par deux env posés en amont :
  - **App Store Connect API Key** (`.p8` généré une fois dans ASC → *Users and Access* → *Integrations*) :
    `EXPO_ASC_API_KEY_PATH` (le `.p8`), `EXPO_ASC_API_KEY_ID`, `EXPO_ASC_API_ISSUER_ID`. (Ce sont les
    mêmes valeurs que `APPLE_ASC_*` de `.recette/secrets.env`, déjà vérifiées par `verify-secrets.mjs`.)
  - **Mot de passe spécifique à l'app** (appleid.apple.com → *Mots de passe des apps*) pour éteindre le 2FA :
    `EXPO_APPLE_ID` + `EXPO_APPLE_APP_SPECIFIC_PASSWORD`.
  Ensuite les creds sont sur EAS → tous les builds suivants sont non-interactifs.
```bash
# Non-interactif (clé API + app-specific password posés en env AVANT) — chemin par défaut pour un agent :
npx eas-cli@latest build --profile production --platform ios --non-interactive --no-wait
# À défaut de clé API : login interactif → ÉTAPE HUMAINE (l'utilisateur lance ça dans SON terminal,
# iPhone à portée pour le code 2FA). Ne jamais laisser un agent bloqué sur ce prompt.
npx eas-cli@latest build --profile production --platform ios
```
- **dev build** ≠ **prod build** : le dev/preview s'installe en **direct** (device UDID enregistré, ad-hoc) ;
  le **production** est signé App Store → s'installe **uniquement via TestFlight**.
- `buildNumber` s'auto-incrémente (commit le bump de `app.json`).
- Vérifier le statut : `npx eas-cli@latest build:list --platform ios --limit 1 --non-interactive`.

## 2. Upload vers App Store Connect
```bash
npx eas-cli@latest submit --profile production --platform ios --latest --non-interactive
```
- **Piège** : en non-interactif il faut **`ascAppId`** dans `eas.json` → `submit.production.ios.ascAppId`
  (= l'Apple ID de l'app, visible dans ASC → App Information).
- Il propose de **générer une App Store Connect API Key** → **Yes** (stockée sur EAS, réutilisée ensuite,
  plus de login Apple). Rôle **App Manager** suffit (ou Admin).
- Après : « Submitted… » → Apple **processe** le binaire ~5-15 min (email quand prêt).

## 3. TestFlight (tester le vrai build)
- Suivre le traitement : ASC → onglet **TestFlight** (en HAUT, pas le menu gauche) → build `1.0 (n)`
  passe de **Processing** → **Ready to Test**. Si **Missing Compliance** → cliquer → chiffrement **No**
  (chiffrement standard iOS = exempté).
- **Piège testeur interne** : dans le groupe interne, le testeur apparaît en statut **« Invited »** →
  l'app ne s'affiche PAS tant qu'il n'a pas **accepté l'invitation** (mail « invited to test » →
  bouton **View in TestFlight**). L'écran « entre un code » ≠ ce qu'il faut : les testeurs internes voient
  l'app **automatiquement** une fois l'invit acceptée, jamais par code.
- Vérifier que l'app TestFlight du device est connectée avec le **bon Apple ID** (celui listé comme testeur).
- Tester en priorité : **reset mot de passe** (deep-link), **IAP** (sandbox auto en TestFlight), **perf**,
  le flux complet. Trouver les bugs ICI, corriger, rebuild, re-tester **avant** de soumettre.

## 4. Remplir App Store Connect
Trois endroits (détail champ par champ dans `references/asc-checklist.md`) :
- **App Information** (General) : Name + Subtitle (localisés), Category, Content Rights, Age Rating, EULA,
  App Store Server Notifications URL. *(Privacy Policy URL se met sur la page App Privacy.)*
- **Page Version** (1.0 Prepare for Submission) : par langue → Promotional Text, Description, **Keywords**,
  Support URL, **Screenshots**, **Build**, **sélection des abonnements**, **App Review Information**
  (comptes démo + notes), Release (manuel recommandé).
- **App Privacy** (General) : le questionnaire « nutrition label ».

### ASO — le nom est le champ le plus puissant
- **Name** (30) = marque + mots-clés (pattern gagnant, ex. `MonApp — AI X, Y & Z`). Le nom pèse
  le plus dans le ranking. Mettre les mots-clés forts ICI.
- **Subtitle** (30) = positionnement/conversion (la punchline), PAS des mots-clés (déjà couverts).
- **Keywords** (100) = **ne pas répéter** les mots du nom ; d'autres termes, sans espaces après les virgules.

## 5. App Privacy label (cases)
Pour chaque donnée : **Linked to identity = Yes**, **Used for tracking = No**. Typique app SaaS :
Email (Contact Info), User Content (+ « shared with third parties » → prestataire IA si IA), Coarse Location
(jamais Precise), Purchases. **Ne cocher NI Tracking NI Advertising** (aucun SDK de pub).

## 6. Comptes démo pour le reviewer
- **Champ login** : un compte **premium** (accès total, jamais bloqué).
- **Notes** : décrire EN PLUS un compte **gratuit** qui atteint le paywall (pour tester l'abo en sandbox),
  + le flux de test, + « clé API server-only » (pour 5.1.2 si IA). Les deux comptes prêts en base
  (mot de passe posé via Management API — voir skill `supabase-backend`).

## 7. Soumettre
1. Attacher le **build** à la version. 2. **Sélectionner les abonnements** avec la version (piège : sinon
ils ne passent pas la review). 3. App Review Info remplie. 4. Export compliance (exempté), IDFA (non).
5. **Add for Review → Submit for Review.** Apple review ~24-48 h.

## Pièges de conformité (checklist rapide)
- Pages légales `/privacy` `/terms` `/support` en **HTTPS 200** (le reviewer clique → 404 = rejet) et la
  Privacy **nomme les tiers** (prestataire IA/Supabase/RevenueCat).
- **Export compliance** : mettre `ITSAppUsesNonExemptEncryption=false` dans `app.json` (ios.infoPlist) →
  plus de question à chaque build.
- **Âge** : le nouveau système Apple met souvent **9+** dès qu'il y a de l'IA/contenu généré — c'est OK,
  pas un blocker.
- Onboarding sans issue si une étape échoue (rate-limit) → toujours une porte de sortie.
- Divulgation IA : disclosure claire in-app (5.1.2) ; jamais de secret dans le bundle.

Voir `references/asc-checklist.md` pour le détail champ par champ et les valeurs types.
