# Prompt pour construire NÉA dans Vibecode

> À coller tel quel dans Vibecode. Si Vibecode accepte des fichiers, joindre aussi `prototype/nea-app.html`
> (référence visuelle et logique exacte) et `docs/NEA-cahier-des-charges.md`.
> Ne jamais coller de clé, de jeton ni de mot de passe dans le prompt.

---

Tu construis **NÉA — Coaching sportif IA**, une app mobile iOS/Android (Expo, React Native, TypeScript strict, Expo Router).
Langue de l'app : **français, tutoiement**. Slogan : « Plus qu'un programme. Un coach qui te connaît vraiment. »
Signature : « Ton meilleur toi, chaque jour. » Âge minimum : **14 ans**.

## Règles de travail

- Si un prototype `nea-app.html` est joint, c'est la **référence exacte** : écrans, textes, couleurs et calculs (section `<script>` :
  `buildPlan()`, charges, calories, VFC, XP). Reproduis-le fidèlement, n'invente rien. En cas de doute, pose-moi la question.
- Avance **étape par étape** (plan en bas). À la fin de chaque étape, montre-moi l'écran pour que je teste sur mon iPhone.
- Code propre et typé, un fichier par écran, logique de calcul dans des fonctions pures séparées de l'interface.
- État local avec Zustand + persistance AsyncStorage. Ne jamais modifier un objet d'état en place (copies immuables).
- Aucune clé secrète dans l'app : tout appel payant (modèle d'IA) passe par une fonction serveur.

## Direction artistique

Thème sombre premium, néon rose, effet de lueur (glow).

- Fonds `#070708` / `#0A0A0C` · surfaces `#121215` (2e niveau `#18181C`) · bordures `#26262B`
- Rose néon (accent) `#FF4FA3`, rose clair `#FF8CC6`, rose pâle `#FFC2DF`
- Texte `#FFFFFF`, secondaire `#9A9AA3`, tertiaire `#6C6C75`, vert `#3EE07A`
- Bouton principal : pilule hauteur 52, dégradé horizontal `#FFFFFF → #FFD6EA → #F7A9CF`, texte `#0A0A0C`
- Or NÉA Plus : `#FFE38A → #FFC23D` · calories : orange `#FF8A1F`
- Zones cardio : Z1 `#6B7CFF`, Z2 `#3EE07A`, Z3 `#FFD21F`, Z4 `#FF8A1F`, Z5 `#FF3B5C`
- Cartes radius 16 ; élément sélectionné = bordure rose + lueur rose ; barre d'onglets flottante arrondie
- Police **Inter** (300 à 900), titres très épais. Grands chiffres (poids, FC, prix, chrono) avec une hauteur de ligne ≥ taille de police
  (sinon le haut des chiffres est rogné sur iOS). Lueurs en dégradé radial SVG, jamais d'ombre de texte colorée.
- Mascottes : 6 robots chibi (grosse tête ronde, corps noir brillant, casque audio, yeux en arcs lumineux, « N » sur le torse),
  un par couleur de coach. Accueil : respiration, clignement des yeux, podium qui pulse, particules roses.

## Les 6 coachs (3 programmes chacun, le 1er gratuit)

| Coach | Couleur | Style | Reps | Repos | Particularité |
|---|---|---|---|---|---|
| Axel | Rose | Hypertrophie | 8-12 | 75 s | Push / Pull / Jambes |
| Nova | Bleu | Renfo doux | 12-15 | 45 s | Pas de barre, gainage, mobilité |
| Kai | Vert | Endurance | 15-20 | 30 s | Circuits + vélo |
| Luna | Jaune | HIIT fun | 40 s / 20 s | 20 s | Tout en intervalles |
| Blaze | Orange | Intensité | 6-10 | 60 s | Explosif + finisher cardio |
| Rex | Rouge | Force | 4-6 | 150 s | Gros mouvements lourds |

## Contenu

- **50 exercices** : groupe musculaire, matériel, ratio de charge, niveau, MET, type (reps ou temps), muscles, 3 étapes « comment faire »,
  erreur à éviter, illustration.
- **41 séances prêtes** : lieu (maison, salle, extérieur), niveau, objectif, coach, description, exercices au format
  `id:séries:reps:repos`. Certaines sont des sorties vélo. 3 gratuites : `m_circuit`, `s_machines`, `e_parc`.
- Reprends ces données **telles quelles** depuis le prototype (constantes `COACHES`, `EXL`, `NAMES`, `CAT`, `FREE_WK`, `PROGS`, `TPL`,
  `SPECIAL`, `DAYSPOS`, `GRP`, `EQN`, `LIEUX`, `GEAR`, `GOALS`, `GOALF`, `HQ`, `PLANS`, `QUESTS`, `RANKS`) dans `src/data/`.

## Parcours

**Accueil** : vidéo/animation d'Axel, « Commencer », « J'ai déjà un compte ».

**Onboarding (8 écrans, une question par écran, barre 1/8…8/8, bouton retour)**
1. Prénom
2. Objectifs (choix multiples)
3. Niveau : débutant, intermédiaire, avancé
4. Lieu : maison, salle, les deux (+ matériel disponible)
5. Rythme : 2 à 7 séances/semaine + durée 20, 30, 45 ou 60 min
6. Profil : poids (curseur), âge (+/−), FC max affichée (208 − 0,7 × âge). **Blocage sous 14 ans.**
7. Santé : 5 questions (cœur/tension, douleur thoracique, malaises, blessure, grossesse). Un « oui » : conseil de consulter, niveau
   forcé à débutant, 2e case obligatoire. Case « NÉA ne remplace pas un avis médical » toujours obligatoire.
8. Choix du coach (carrousel), badge « Recommandé » selon les objectifs.

Puis animation « ton coach prépare ton programme » → **paywall** → **création de compte** (Apple, Google, email, ou « plus tard »).

**Onglets**
- **Accueil** : salut + prénom, semaine, séance du jour, série de jours, séances, VFC moyenne, cartes Nuit et Récupération, barre XP,
  carte « Essaie NÉA Plus » (gratuits), objectif de la semaine, citation du coach (ouvre le chat), cloche des notifications.
- **Programme** : recherche, « Mon plan » (carrousel des 3 programmes du coach), plan d'entraînement (onglets par lieu + filtres par
  objectif), « À la une », les 50 exercices ; sous-onglet **Calendrier** (semaine + calories prévues, « Modifier »).
- **Vélo** : extérieur (GPS, carte, tracé rose) ou stationnaire (résistance 2 à 10), FC, zones, dernière sortie, historique,
  « Ouvrir dans Plans ». Sortie enregistrée dès 30 s.
- **Ligue** : niveau et rang (hexagone), boosts, Turbo x2, quêtes du jour, classements Amis et Équipes, équipe (5 max), code ami.
- **Progrès** : semaine / mois / année, séances, volume, temps, calories, FC et VFC moyennes, sommeil, courbe de poids datée, pesée.
- **Profil** : NÉA Plus, compte, coach, objectifs, réglages, notifications, sommeil, capteur cardio, poids, Conditions,
  Confidentialité, **Supprimer mon compte** (efface vraiment les données serveur).

**Autres écrans** : détail de séance (image, tags, kcal, durée, matériel, muscles, exercices, Modifier l'intensité, Planifier,
Commencer) ; **séance en cours** (chrono, FC et VFC en direct, kcal, charge conseillée, zone de reps, compteur ou minuteur, repos avec
conseil du coach, démo guidée) ; **récap** (durée, volume, FC moy/max, VFC, calories, XP, courbe FC, zones) ; fiche exercice ;
**chat avec le coach IA** ; mesure de récupération d'1 min ; Sommeil (score de nuit, 7 nuits, VFC nocturne, saisie de la nuit) ;
Notifications ; Paywall ; Conditions ; Confidentialité.

## Règles de calcul (identiques au prototype)

- **Programme** `buildPlan()` : découpage de la semaine selon coach, programme et nombre de jours ; exercices choisis par groupe
  musculaire selon matériel, niveau et favoris du coach, avec rotation sans doublons ; finisher cardio, +1 série pour la masse, retour au
  calme pour le mental ; séances raccourcies pour tenir dans la durée choisie.
- **Progression** : +2,5 % de charge par semaine ; semaine de décharge (−15 %) à la fin des programmes de 6 semaines et plus.
- **Charge conseillée** : poids × ratio de l'exercice × facteur de reps × facteur de niveau (0,6 / 1 / 1,25), arrondi à 1 kg (haltères)
  ou 2,5 kg (barre, machine).
- **Calories d'un exercice** : séries × (MET × poids × temps d'effort + 2 × poids × temps de repos) / 3600.
- **FC max** (Tanaka) : 208 − 0,7 × âge ; zones à 60, 70, 80, 90 %.
- **VFC** : RMSSD sur les intervalles RR (simulés tant qu'Apple Santé n'est pas branché). En séance, prendre les **derniers** RR
  ajoutés (le prototype a un bug : `rr.slice(longueur avant)` ne renvoie plus rien quand sa mémoire de 300 RR est pleine).
- **Score de nuit /100** : durée (50 pts, 8 h = max) + qualité (25) + VFC nocturne vs moyenne (25).
- **Récupération** : VFC ≥ 90 % de la moyenne = récupéré ; 75-90 % = en cours ; < 75 % = fatigue élevée.
- **Série** : jours consécutifs avec activité ; un jour de repos prévu ne la casse pas.
- **XP** : +2 par série, +40 par séance (+5 × série de jours, max +50), vélo 30 + 4/km, quêtes. Niveau n = 100 + 20 × (n − 1) XP.
  Rangs Bronze, Argent, Or, Platine, Diamant tous les 5 niveaux.
- **Boosts** (produit, plafond x3) : série ≥ 3 j x1,2, ≥ 7 j x1,5 ; Turbo x2 pendant 24 h (1 par niveau, NÉA Plus) ; équipe x1,2 si
  3 membres actifs dans la semaine.

## NÉA Plus (dollars canadiens)

- **Annuel** : 3 jours gratuits puis **59,99 $/an** (présélectionné, « Meilleure offre », −62 %)
- **Mensuel** : **12,99 $/mois**
- **Pas d'offre « À vie ».**
- **Offre de sortie** (une seule fois, en fermant le paywall) : 3 jours gratuits puis 39,99 $ la 1re année, ensuite 59,99 $/an ;
  compte à rebours réel de 10 min.
- Gratuit : 3 séances, 1er programme de chaque coach, 3 messages au coach par jour, pas de Turbo.
- Paywall : titre avec le prénom et le programme, courbe de progression, 5 avantages, frise de l'essai (aujourd'hui, rappel jour 2,
  facturation jour 3), X visible après 2 s, textes légaux, Restaurer, Conditions, Confidentialité. Aucun faux avis.
- Achats réels via **RevenueCat** (build natif) ; rappel obligatoire la veille de la fin de l'essai.

## Notifications

VFC post-entraînement (délai réglable, 10 min par défaut, ouvre la mesure de récupération) ; bilan de la nuit à l'heure du réveil
(« Comment as-tu dormi ? » si la nuit n'est pas notée) ; rappel du coucher ; fin d'essai NÉA Plus ; bannière dans l'app + point rose
sur la cloche.

## Coach IA

Fonction serveur (la clé du modèle n'est jamais dans l'app) : compte connecté obligatoire, consigne = personnage du coach, tutoiement,
2 à 4 phrases, **aucun conseil médical** ; on envoie les 10 derniers messages + un résumé du profil, **jamais l'email** ; limite de
3 messages/jour comptée côté serveur (illimité avec NÉA Plus). Sans compte ou en cas d'erreur : réponses de secours du prototype.

## Données et légal

- Données de santé (FC, VFC, sommeil, poids, questionnaire) = renseignements sensibles (**Loi 25, Québec**) : consentement explicite.
- Base de données avec règles d'accès par utilisateur (chacun ne voit que ses données), suppression réelle du compte.
- Apple Santé en **lecture seule** (nuit, VFC nocturne, FC au repos, poids), textes de permission clairs en français.

## Plan de construction (une étape à la fois, test sur iPhone à chaque fin d'étape)

1. Base : structure, design system, données, images
2. Onboarding complet + `buildPlan`
3. Accueil, Programme, Calendrier, détail de séance, fiche exercice
4. Séance en cours + récap (FC simulée), puis Progrès
5. Comptes (email, Apple, Google), sauvegarde, suppression, Profil, Conditions, Confidentialité
6. Sommeil, récupération, Apple Santé
7. Vélo (GPS, carte, historique)
8. Notifications
9. Coach IA
10. Ligue (amis, équipes, classements)
11. NÉA Plus (paywall, RevenueCat)
12. Analytics (PostHog), finitions, accessibilité, performance
13. TestFlight + App Store

Commence par l'étape 1 et montre-moi le résultat.
