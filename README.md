# SelfMax 🚀

**Le contraire du lookmaxing.** On ne maxe pas juste le physique, on maxe *toi*, en entier :
Physique, Apparence, Énergie, Discipline, Mental. Une mission par pilier chaque jour, un check-in
(Manquée / Partielle / Terminée), et un **Max Score /100** calculé en continu à partir de ta
régularité — plus un suivi manuel de tes mesures et photos de progression.

MVP construit avec **Expo (React Native) + expo-router**, dark-only, 100% local (AsyncStorage,
aucun compte, aucun backend) pour aller vite. Pas de paywall dans ce MVP — objectif : sortir vite,
itérer ensuite.

## Fonctionnalités

- **Accueil** — Max Score du jour (anneau /100 + delta vs hier), série actuelle (streak +
  historique 7 jours), barre par pilier.
- **Plan** — vue Jour (missions du jour + statut, conseil du jour, CTA "Démarrer ma journée"),
  Semaine (score par jour) et Mois (score moyen, bons jours).
- **Check-in** (modal) — pour une mission donnée : Manquée / Partielle / Terminée + note optionnelle.
- **Scan** — suivi manuel du poids, masse grasse, tour de taille + photo de progression locale.
  Pas d'analyse IA dans ce MVP (aucune fausse promesse) — c'est indiqué clairement dans l'écran.
- **Progrès** — évolution du Max Score (courbe 7 jours), répartition des piliers (radar), historique
  des scans (onglet Corps), Performances en placeholder pour la v1.1.
- **Onboarding** au premier lancement (pas de photo de tiers, tout est illustré en interne).

### Comment le Max Score est calculé

Chaque pilier a un score 0-100 = moyenne glissante de ses check-ins sur les 14 derniers jours
(Terminée = 100, Partielle = 50, Manquée = 0 ; les jours sans check-in ne comptent pas contre toi).
Le **Max Score** est la moyenne des 5 piliers. La **série** compte les jours consécutifs avec au
moins une mission non manquée.

## Développer / prévisualiser

```bash
npm install
npx expo start
```

Scanne le QR code avec l'app **Expo Go** sur ton iPhone, ou lance un simulateur iOS si tu es sur Mac.

## Où en est le projet pour l'App Store

Le code est **fonctionnel et validé** (typecheck + lint + export iOS/web sans erreur, parcours testé
écran par écran : onboarding → check-in → Plan → Accueil → Scan → Progrès). Il reste des étapes qui
**nécessitent ton compte Apple/Expo et des clics humains** (2FA, formulaires App Store Connect) —
impossibles à automatiser depuis cet environnement. Voici exactement quoi faire, dans l'ordre, ce
soir :

### 1. Connecte-toi à Expo (une fois)

```bash
npx eas-cli login
```

### 2. Configure le projet EAS (une fois)

```bash
npx eas-cli build:configure
```

Ça va créer/lier un projet Expo et proposer un `bundleIdentifier` iOS. Le fichier `app.json`
contient déjà `com.selfmax.app` comme identifiant — **change-le si tu as déjà une convention**
(ex. `com.tonstudio.selfmax`), sinon garde-le tel quel, EAS l'enregistrera sur ton compte Apple
Developer au premier build.

### 3. Build de production iOS

```bash
npx eas-cli build --platform ios --profile production
```

EAS va te demander de te connecter à ton compte Apple Developer (identifiants + 2FA) pour générer
les certificats de signature — **c'est le seul moment où Apple te demande une action manuelle** à ce
stade. Laisse EAS gérer les certificats automatiquement (recommandé) sauf si tu en as déjà.

Le build tourne dans le cloud (~15-25 min), pas besoin de Mac.

### 4. Envoie le build sur TestFlight

```bash
npx eas-cli submit --platform ios --latest
```

Là encore, identifiants Apple + 2FA demandés (ou une clé API App Store Connect si tu en crées une).
Une fois fait, le build apparaît dans **TestFlight** en général sous 10-30 min (traitement Apple).

### 5. Fiche App Store Connect (à faire à la main, une fois)

Sur [appstoreconnect.apple.com](https://appstoreconnect.apple.com), crée la fiche de l'app si ce
n'est pas déjà fait, puis renseigne :

- **Nom, sous-titre, description, mots-clés** (FR — propose-moi un jet si tu veux, je peux l'écrire).
- **Captures d'écran** iPhone 6.9"/6.7" (1290×2796) — prends-les depuis le simulateur ou ton iPhone
  une fois le build installé (Expo Go ne suffit pas pour les vraies captures store). Je peux les
  encadrer proprement avec `node scripts/generate-assets.mjs screenshots --in ./raw --lang fr` une
  fois que tu as les brutes.
- **Politique de confidentialité (URL obligatoire)** — l'app ne collecte **aucune donnée** (tout
  reste sur l'appareil, aucun compte, aucun réseau, y compris les photos de scan). Héberge le texte
  ci-dessous n'importe où (une page de ton site, un Gist) et colle l'URL dans App Store Connect :

  > SelfMax ne collecte, ne transmet et ne stocke aucune donnée personnelle sur un serveur.
  > Toutes les données que tu saisis (missions, check-ins, mesures, photos de progression) restent
  > uniquement sur ton appareil, dans le stockage local de l'application. Aucun compte, aucun
  > tracking, aucun partage avec des tiers.

- **Catégorie** : Santé et forme, ou Style de vie.
- **Classification d'âge** : 4+ (aucun contenu sensible ; l'app ne fait aucune évaluation
  automatique de l'apparence physique — tout est déclaratif par l'utilisateur).
- Choisis le build envoyé à l'étape 4, remplis les infos de review, puis **Soumettre pour
  validation**.

### ⚠️ Sur le timing « ce soir »

Le code, le build EAS et l'envoi sur TestFlight peuvent réellement être faits **ce soir** si tes
comptes Apple/Expo sont prêts (build ~20 min, traitement TestFlight ~30 min). En revanche, une fois
**soumis** à la review Apple, le délai d'approbation (souvent 24-48h, parfois plus) est **entièrement
côté Apple** — aucun outil ne permet de l'accélérer. Objectif réaliste ce soir : **build + TestFlight
+ soumission envoyée**. L'app sera **live sur l'App Store** dès qu'Apple valide, généralement le
lendemain ou surlendemain.

## Architecture

```
src/
├─ app/
│  ├─ _layout.tsx          # gate onboarding + Stack racine (dark-only)
│  ├─ (tabs)/               # Accueil, Plan, Scan, Progrès
│  ├─ check-in.tsx         # modal : statut d'une mission (Manquée/Partielle/Terminée)
│  └─ add-scan.tsx         # modal : nouvelle mesure + photo
├─ components/             # ScoreRing, PillarBar, StreakRow, MissionCard, RadarChart, TrendLineChart
├─ constants/              # theme (dark/blue), piliers (5), missions (1 par pilier)
└─ lib/                    # types, score engine (moyenne glissante), storage, check-ins store, tips
```

## Prochaines étapes (v1.1+)

- Personnalisation des missions par objectif (perte de gras / prise de masse / discipline pure...).
- Paywall / abonnement (RevenueCat) si tu veux monétiser.
- Compte + sync cloud (Supabase) pour ne pas perdre les données à la désinstallation.
- Notifications de rappel quotidien + rappel de check-in.
- Analyse photo assistée (mesures approximatives) — à traiter avec précaution (précision, guidelines
  santé Apple) plutôt qu'une "IA" qui invente des chiffres.
- Vrais screenshots App Store + description marketing.
