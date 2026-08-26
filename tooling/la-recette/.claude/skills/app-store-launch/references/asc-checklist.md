# App Store Connect — checklist champ par champ

Naviguer : appstoreconnect.apple.com → My Apps → ton app. Trois pages distinctes.

## A. App Information (menu gauche, section *General*) — commun à toutes versions
- **Name** (30) : marque + mots-clés ASO forts (ex. `App — AI X, Y & Z`).
- **Subtitle** (30) : la punchline / positionnement (par langue via le sélecteur en haut).
- **Category** : Primary (ex. Lifestyle) ; Secondary vide.
- **Content Rights** : « No, it does not contain, show, or access third-party content » (contenu généré, pas de contenu tiers copyrighté).
- **Age Rating** : répondre None/No partout (UGC=No si contenu privé non partagé, Messaging=No, Web=No, Advertising=No, thèmes matures=None). Résultat 4+ (ou 9+ avec le nouveau système si IA → OK).
- **License Agreement** : Apple Standard suffit (les Terms sont liés in-app + description).
- **App Store Server Notifications → Production URL** : coller l'URL RevenueCat (V2).
- ⚠️ **Privacy Policy URL** n'est PAS ici → page App Privacy.

## B. Page Version (menu gauche, « iOS App » → 1.0 Prepare for Submission)
Sélecteur de **langue** en haut à droite → remplir English puis ajouter/remplir French.
- **Promotional Text** (170) : accroche modifiable à tout moment.
- **Description** (4000) : longue, honnête (jamais suggérer une authenticité qu'on n'a pas). Ne pas prétendre
  embarquer d'écriture si ce n'est pas le cas.
- **Keywords** (100) : sans espaces après les virgules ; ne pas répéter les mots du Name.
- **Support URL** : `https://tondomaine.com/support` · **Marketing URL** (option) : `https://tondomaine.com`.
- **Copyright** : `2026 Prénom Nom`.
- **Screenshots** : iPhone 6,5" (1242×2688 / 1284×2778) et/ou 6,9" (1290×2796). Capturer depuis le device
  (compte démo rempli). Les 3 premières servent sur la fiche d'installation.
- **Build** : attacher le build uploadé (après processing TestFlight).
- **In-App Purchases and Subscriptions** : **sélectionner les abos** (marqué « Optional » mais OBLIGATOIRE
  à la 1ère soumission, sinon les abos ne passent pas la review).
- **App Review Information** : Sign-in required ✅ ; User name/Password = **compte premium** ; Contact
  (prénom/nom/tél/email) ; **Notes** = les 2 comptes (premium en login + gratuit-pour-paywall décrit) +
  flux de test + « clé API server-only ».
- **App Store Version Release** : **Manually release** (contrôler le moment de sortie).

## C. App Privacy (menu gauche, section *General*)
« Do you collect data? » → Yes. Pour chaque type : **Linked = Yes**, **Tracking = No** :
| Donnée | Catégorie | Usage |
|---|---|---|
| Email Address | Contact Info | App Functionality |
| User Content | User Content | App Functionality (+ « shared with third parties » → prestataire IA si IA) |
| Coarse Location | Location | App Functionality *(jamais Precise)* |
| Purchases | Purchases | App Functionality |
❌ Rien dans **Tracking** ni **Advertising**. Renseigner la **Privacy Policy URL** ici.

## Modèle de notes reviewer (EN, à adapter)
```
<App> composes/does <one line>.

Two demo accounts:
- PREMIUM (login fields above): <email> / <pw> — unlimited, review every feature.
- FREE (to test the subscription): <email> / <pw> — after 1 action the paywall appears; test the
  auto-renewable subscription with your sandbox Apple ID.

How to test: 1) sign in (premium) 2) <core action> 3) <where content appears>
4) To review the paywall/subscription: sign in with the FREE account → <action> → paywall (Weekly/Yearly).
   "Restore Purchases" is on every purchase surface.

Privacy/AI: <AI provider> API key is server-only (Edge Function), never in the app bundle. The app never
embeds copyrighted/third-party content in generated output.
Account deletion & data export in Profile.
Privacy: https://tondomaine.com/privacy — Terms: /terms — Support: /support
```

## Ordre de dé-blocage si « Add for Review » est grisé
Il manque presque toujours : (1) **screenshots**, (2) **build attaché**. Les deux nécessitent le build
processé. Le point rouge (!) sur Save = « version incomplète », normal tant que ces 2 items manquent.
