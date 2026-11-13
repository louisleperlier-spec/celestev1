# NÉA — Cahier des charges (référence pour Claude Code)

> Ce document décrit l'app NÉA à construire pour iOS et Android.
> Le fichier `nea-app.html` (prototype web) est la **référence visuelle et fonctionnelle exacte**. En cas de doute sur un écran, une couleur ou une règle, ouvrir le prototype.
> Langue de l'app : **français (tutoiement)**. Anglais plus tard.

---

## 1. Produit

**NÉA — Coaching sportif IA.** L'utilisateur choisit un coach robot parmi 6 personnalités, répond à un onboarding et reçoit un programme 100 % personnalisé : séances prêtes, charges calculées selon son poids, suivi cardio (FC, VFC), vélo avec carte, sommeil, XP et ligue entre amis.

- Slogan : « Plus qu'un programme. Un coach qui te connaît vraiment. »
- Signature : « Ton meilleur toi, chaque jour. »
- Âge minimum : **14 ans**.
- Modèle économique : freemium + abonnement **NÉA Plus**.

---

## 2. Stack technique

| Besoin | Outil |
|---|---|
| App | Expo (React Native, TypeScript), Expo Router |
| État local | Zustand + persistance (MMKV ou AsyncStorage) |
| Serveur | Supabase : Auth, Postgres, Row Level Security, Edge Functions |
| Connexion | Email + mot de passe, Google, **Sign in with Apple** (obligatoire sur iOS) |
| Abonnements | RevenueCat (+ Superwall plus tard pour tester les paywalls) |
| Santé | react-native-health (Apple Santé), Health Connect (Android) |
| Carte vélo | react-native-maps (Apple Plans sur iOS, Google Maps sur Android), expo-location |
| Notifications | expo-notifications |
| Coach IA | Edge Function Supabase qui appelle l'API du modèle (clé **jamais** dans l'app) |
| Graphiques | react-native-svg |
| Animations | react-native-reanimated |
| Analytics | PostHog |
| Builds | EAS Build + EAS Submit + TestFlight |

---

## 3. Direction artistique

Thème sombre premium, néon rose, effet glow. Reprendre exactement les valeurs du prototype.

**Couleurs**
- Fond : `#070708` / `#0A0A0C`
- Surfaces : `#121215`, bordure `#26262B`
- Rose néon (accent) : `#FF4FA3`, rose clair `#FF8CC6`, rose pâle `#FFC2DF`
- Texte : `#FFFFFF`, secondaire `#9A9AA3`
- Bouton principal : dégradé `#FFFFFF → #FFD6EA → #F7A9CF`, texte `#0A0A0C`
- Or (NÉA Plus) : `#FFE38A → #FFC23D`
- Zones cardio : Z1 `#6B7CFF`, Z2 `#3EE07A`, Z3 `#FFD21F`, Z4 `#FF8A1F`, Z5 `#FF3B5C`
- Calories : badge orange `#FF8A1F`

**Composants** : cartes radius 16, boutons pilule hauteur 52, élément sélectionné = bordure rose + glow, barre d'onglets flottante arrondie.

**Typo** : Inter (300 à 900). Titres en gras très épais.

**Mascottes** : 6 robots chibi (grosse tête ronde, corps noir brillant, casque audio, yeux en arcs lumineux, « N » sur le torse), un par couleur de coach. Axel a une nouvelle version avec bandeau, gants et montre. Animation d'accueil : respiration, clignement des yeux, reflet brillant, podium qui pulse, particules roses.

---

## 4. Les 6 coachs

Chaque coach a un style de programme différent. Valeurs exactes dans le prototype (`COACHES`).

| Coach | Couleur | Style | Reps | Repos | Particularité |
|---|---|---|---|---|---|
| Axel | Rose | Hypertrophie | 8-12 | 75 s | Push / Pull / Jambes |
| Nova | Bleu | Renfo doux | 12-15 | 45 s | Pas de barre, gainage, mobilité |
| Kai | Vert | Endurance | 15-20 | 30 s | Circuits + vélo |
| Luna | Jaune | HIIT fun | 40 s / 20 s | 20 s | Tout en intervalles |
| Blaze | Orange | Intensité | 6-10 | 60 s | Explosif + finisher cardio |
| Rex | Rouge | Force | 4-6 | 150 s | Gros mouvements lourds |

Chaque coach a **3 programmes** de plusieurs semaines (18 au total, voir `PROGS`). Le premier est gratuit.

---

## 5. Contenu

- **50 exercices** (`EXL`) : groupe musculaire, matériel, ratio de charge, niveau, MET, type (reps ou temps), muscles, 3 étapes « comment faire », erreur à éviter, illustration PNG.
- **41 séances prêtes** (`CAT`) : lieu (maison, salle, extérieur), niveau, objectif, coach, description, liste d'exercices avec séries, reps ou durée, et repos. Certaines sont des sorties vélo.
- 3 séances gratuites : `m_circuit`, `s_machines`, `e_parc`.

Extraire toutes ces données du prototype dans `/src/data/*.ts`, et les images en fichiers dans `/assets`.

---

## 6. Parcours et écrans

### Onboarding (8 étapes, une question par écran, barre de progression)
1. Prénom
2. Objectifs (multi-choix)
3. Niveau (débutant, intermédiaire, avancé)
4. Lieu (maison, salle, les deux)
5. Rythme : séances par semaine (2 à 7) + durée d'une séance (20, 30, 45, 60 min)
6. Profil physique : poids (curseur), âge (+/−), FC max affichée. **Blocage sous 14 ans.**
7. **Santé** : 5 questions (cœur/tension, douleur thoracique, malaises, blessure, grossesse). Si une réponse est oui : conseil de consulter un professionnel, niveau forcé à débutant, 2e case obligatoire. Case « NÉA ne remplace pas un avis médical » toujours obligatoire.
8. Choix du coach, avec badge « Recommandé » calculé selon les objectifs.

Puis : animation « ton coach prépare ton programme », **paywall**, **création de compte** (Apple, Google, email, ou « plus tard »).

### Onglets
- **Accueil** : salut, semaine, séance du jour, série, séances, VFC moyenne, cartes Nuit et Récupération, barre XP, carte NÉA Plus (gratuits), objectif hebdo, citation du coach.
- **Programme** : recherche, « Mon plan » (carrousel des 3 programmes du coach), « Plan d'entraînement » (onglets par lieu + filtres par objectif), « À la une », les 50 exercices. Sous-onglet **Calendrier** (semaine + calories prévues).
- **Vélo** : extérieur (GPS + carte + tracé rose) ou stationnaire (résistance), FC, VFC, zones, historique, bouton « Ouvrir dans Plans ».
- **Ligue** : niveau et rang, boosts, Turbo x2, quêtes du jour, classement Amis et Équipes, équipe, code ami et invitation.
- **Progrès** : semaine, mois, année, séances, volume, temps, calories, moyenne générale FC et VFC, sommeil, courbe de poids datée.
- **Profil** : NÉA Plus, compte, coach, objectifs, réglages, notifications, sommeil, capteur cardio, poids, conditions, confidentialité, **supprimer mon compte**.

### Autres écrans
- Détail d'une séance (image, tags, kcal, durée, matériel, muscles, exercices, boutons Modifier l'intensité, Planifier, Commencer)
- Séance en cours (chrono, FC et VFC en direct, kcal en direct, charge conseillée, barre de zone de reps, compteur de reps ou minuteur, repos avec conseil du coach, démo guidée)
- Récap de séance (durée, volume, FC moyenne et max, VFC, calories, XP, courbe FC, zones)
- Fiche exercice, démo guidée animée
- Chat avec le coach IA
- Mesure de récupération (1 minute), Sommeil, Notifications, Paywall, Conditions, Confidentialité

---

## 7. Règles de calcul (reprendre la logique du prototype)

- **Programme** : fonction `buildPlan()`. Découpage de la semaine selon le coach, le programme et le nombre de jours. Choix des exercices par groupe musculaire selon le matériel, le niveau et les favoris du coach, avec rotation pour éviter les doublons. Adaptations selon les objectifs (finisher cardio, +1 série pour la masse, retour au calme pour le mental). Séances raccourcies pour tenir dans la durée choisie.
- **Progression** : +2,5 % de charge par semaine du programme, semaine de décharge (−15 %) à la fin des programmes de 6 semaines et plus.
- **Charge conseillée** : poids du corps × ratio de l'exercice × facteur de reps × facteur de niveau (0,6 / 1 / 1,25), arrondi à 1 kg (haltères) ou 2,5 kg (barre, machine).
- **Calories par exercice** : séries × (MET × poids × temps d'effort + 2 × poids × temps de repos) / 3600.
- **FC max** : formule de Tanaka, 208 − 0,7 × âge. Zones à 60, 70, 80 et 90 % de la FC max.
- **VFC** : RMSSD calculé sur les intervalles RR (lus depuis Apple Santé ou un capteur Bluetooth).
- **Score de nuit (sur 100)** : durée (50 pts, 8 h = max) + qualité (25 pts) + VFC nocturne par rapport à la moyenne (25 pts).
- **Récupération** : VFC ≥ 90 % de la moyenne = bien récupéré ; 75 à 90 % = récupération en cours ; moins de 75 % = fatigue élevée.
- **Série de jours** : jours consécutifs avec une activité ; un jour de repos prévu ne casse pas la série.
- **XP** : +2 par série, +40 par séance (+5 × série de jours, maximum +50), +30 + 4 par km de vélo, quêtes. Niveau n coûte 100 + 20 × (n − 1) XP. Rangs Bronze, Argent, Or, Platine, Diamant tous les 5 niveaux.
- **Boosts** (produit, plafond x3) : série ≥ 3 jours x1,2, ≥ 7 jours x1,5 ; Turbo x2 pendant 24 h (1 gagné par niveau, NÉA Plus seulement) ; équipe x1,2 si 3 membres actifs dans la semaine.

---

## 8. Monétisation : NÉA Plus

**Offres (dollars canadiens)**
- **Annuel** : 3 jours gratuits, puis 59,99 $/an (présélectionné, « Meilleure offre », −62 %)
- **Mensuel** : 12,99 $/mois
- ~~**À vie** : 149,99 $~~ (retirée, décision du 26 septembre 2026)
- **Offre de sortie** (une seule fois, en fermant le paywall) : 3 jours gratuits, puis 39,99 $ la 1re année, ensuite 59,99 $/an. Compte à rebours réel de 10 minutes.

**Version gratuite** : 3 séances, le 1er programme de chaque coach, 3 messages au coach par jour, pas de Turbo.

**Paywall** : titre personnalisé avec le prénom et le programme, courbe de progression prévue, 5 avantages, frise de l'essai (aujourd'hui, rappel au jour 2, facturation au jour 3), X visible après 2 secondes, textes légaux complets, liens Restaurer, Conditions, Confidentialité.

**Obligatoire** : notification de rappel la veille de la fin de l'essai. Bouton Restaurer fonctionnel. Aucune fausse note ni faux avis.

---

## 9. Notifications

- VFC post-entraînement (délai réglable, 10 min par défaut) : ouvre la mesure de récupération.
- Bilan de la nuit à l'heure du réveil : score, VFC nocturne, conseil pour la séance.
- Rappel du coucher.
- Rappel de fin d'essai NÉA Plus.
- Rappel de séance le jour prévu.

---

## 10. Données, confidentialité, légal

- Données de santé (FC, VFC, sommeil, poids, questionnaire santé) = **renseignements sensibles au sens de la Loi 25 (Québec)** : consentement explicite, responsable de la protection des renseignements personnels désigné, lieu d'hébergement indiqué.
- Supabase : Row Level Security sur toutes les tables, chaque utilisateur ne voit que ses données.
- Coach IA : envoyer les messages et un résumé du profil, jamais l'email. Pas de conseil médical. Limite quotidienne par utilisateur.
- Conditions d'utilisation et politique de confidentialité : brouillons dans le prototype (écran Conditions et Confidentialité), à compléter et faire valider, puis **publier en ligne** (URL exigée par Apple).

---

## 11. Checklist App Store

- [ ] Sign in with Apple
- [ ] Suppression du compte dans l'app (efface vraiment les données serveur)
- [ ] Achats intégrés via RevenueCat, bouton Restaurer
- [ ] Contrat « Paid Apps » accepté dans App Store Connect, **coordonnées bancaires et fiscales remplies** (sinon les abonnements ne marchent pas)
- [ ] Abonnements créés dans App Store Connect (groupe NÉA Plus, essai de 3 jours, offre promotionnelle 39,99 $)
- [ ] Textes de permission clairs : santé, localisation (y compris en arrière-plan pour le vélo), notifications, Bluetooth
- [ ] Politique de confidentialité en ligne + étiquettes de confidentialité (App Privacy) remplies honnêtement
- [ ] Avertissement santé dans l'onboarding et les conditions
- [ ] Classification d'âge adaptée
- [ ] Captures d'écran iPhone (6,9 po et 6,5 po), icône 1024 × 1024, description et mots-clés en français
- [ ] Compte de démo fourni à Apple pour la révision (avec NÉA Plus actif)
- [ ] Tests TestFlight sur plusieurs iPhone

---

## 12. Plan de construction

Avancer étape par étape, et tester sur iPhone à la fin de chaque étape.

1. **Base** : projet Expo, structure, design system, données extraites, images en fichiers, `CLAUDE.md`.
2. **Onboarding complet** + génération du programme (`buildPlan`).
3. **Onglets Accueil, Programme, Calendrier**, détail de séance, fiche exercice.
4. **Séance en cours** + récap (FC simulée en attendant Apple Santé).
5. **Supabase** : comptes Apple, Google, email, sauvegarde, suppression du compte.
6. **Apple Santé** : FC, VFC, sommeil, poids. Mesure de récupération réelle.
7. **Vélo** : GPS, carte Plans, tracé, historique.
8. **Notifications**.
9. **Coach IA** (Edge Function) + limite gratuite.
10. **Ligue** : XP, boosts, quêtes, vrais amis et équipes sur Supabase.
11. **NÉA Plus** : RevenueCat, paywall, offre de sortie, restrictions gratuites.
12. **Analytics**, polish, accessibilité, performance.
13. **TestFlight**, corrections, puis **dépôt sur l'App Store**.

**Règle pour chaque étape** : ne rien inventer qui n'est pas dans le prototype ou ce document, demander en cas de doute, et garder le code propre et typé.
