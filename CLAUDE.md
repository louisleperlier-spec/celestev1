# NÉA — Coaching sportif IA

App iOS/Android (Expo, React Native, TypeScript, Expo Router). Langue : **français, tutoiement**.

## Sources de vérité

1. `docs/NEA-cahier-des-charges.md` : cahier des charges complet (produit, stack, règles de calcul, monétisation, plan de construction).
2. `prototype/nea-app.html` : prototype web = **référence visuelle et fonctionnelle exacte** (écrans, couleurs, textes). Toute la logique (`buildPlan()`, charges, calories, VFC, XP) est dans sa section `<script>`.
3. `src/data/` : données du prototype déjà extraites et typées (voir ci-dessous) ; ne pas les recopier depuis le HTML.

**Règle** : ne rien inventer qui n'est pas dans le prototype ou le cahier des charges. En cas de doute, demander. Code propre et typé (`strict`).

**Écarts validés avec le prototype** : âge minimum **14 ans partout** (`AGE_MIN`), le 13 ans de l'écran de réglages du prototype était une erreur ;
**pas d'offre « À vie »** : NÉA Plus = Annuel 59,99 $/an (3 jours gratuits) et Mensuel 12,99 $/mois (+ offre de sortie 39,99 $ la 1re année).
**Refonte graphite (sept. 2026, maquettes de l'utilisateur)** : fonds graphite `#222328`, cartes ardoise `#2D3038` (radius 20, sans
bordure), rose `#FF4FA3` réservé aux boutons principaux (rose plein), sélections, courbes, anneaux et icônes actives, mauve `#985275`
pour les séries secondaires (zones cardio en dégradé mauve → rose, toujours avec leur libellé) ; **police système** (`fonts.*` = graisses,
600 max pour les titres, 700 pour les plus forts) ; très peu de majuscules ; contrôle segmenté commun `Segmente`.
**4 onglets** (`TabBar`) : **Accueil** (Bonjour, anneaux « Ton bilan du jour » Effort / Récupération / Sommeil, mot du coach,
« Ta prochaine séance » + Commencer, NÉA Plus, « Tes repères » VFC nocturne et FC au repos ; avatar → Profil), **Entraînement**
(`EnTete` : titre, « + » → séances prêtes, segmenté Programme · Calendrier · Sorties (vélo, course, stationnaire)), **Progrès** (+ Ligue dessous, `Ligue integree`)
et **Coach** (`(tabs)/coach.tsx` : ressenti du jour, Adapter ma séance, Préparer ma semaine, dernier échange, saisie → `/chat`) ;
les routes `/accueil`, `/ligue`, `/programme`, `/velo`, `/progres`, `/profil` ne changent pas.
**Onboarding refait (maquettes, sept. 2026)** : petit titre en capitales (« TON EXPÉRIENCE »…), cartes à pastille de sélection (`Choices.tsx` :
`BigChoice`, `Coche`, `NombresSegmentes`, `PetitChoix`, `ListeCoches`, `InfoCarte`), niveau en barres, lieu + « Ton matériel » (matériel du lieu
d'après `GEAR`, pas de choix libre : `buildPlan` inchangé), rythme en bloc 2–7, poids sur une règle (`Regle.tsx`, affichage kg / lb, stocké en kg),
âge modifiable, santé en libellés courts (questions complètes dans « Pourquoi ces questions ? ») + « Aucune de ces situations », coach en carrousel
(spécialité = `style`, approche = 2 premiers `traits`, « Comparer les 4 coachs »), préparation en 4 étapes puis **`/onboarding/pret`** (« Ton
programme est prêt », jours de la semaine, 1re séance, « Modifier mes réponses ») → paywall refait (5 avantages, Annuel « Économise 62 % » /
Mensuel en $ CA, frise de l'essai) → compte. Bouton principal rose à texte graphite (`onPrimary`).
**4 coachs au lieu de 6** : Blaze et Rex retirés (coachs, 6 programmes, images) ; leurs 11 séances du catalogue passent à Luna (Blaze) et
Axel (Rex), leurs points de `recoCoach` aussi ; `coachValide()` remet un ancien état ou un joueur de la Ligue sur un coach existant ;
`comparer-plan` ne compare plus `recoCoach`. Nouvelles images des 4 coachs (style de l'icône), têtes avec un espace sous le visage (`CoachFace`).
**Onglet Programme allégé** : Mon plan (carrousel), « Séances prêtes » (onglets de lieu, 4 séances : accessibles puis proches du niveau,
« Tout voir » → `/seances` avec recherche, lieu et objectif) et une carte « Bibliothèque » → `/exercices` (recherche, groupes, fiche) ;
« À la une » et la recherche globale retirées ; morceaux communs dans `components/app/Catalogue.tsx`.
**Finitions** : barre d'XP de l'Accueil retirée ; « Connecter un capteur » (Progrès) et « Apple Santé et
Apple Watch » (Profil) ouvrent l'app Santé (`ouvrirSante`) ; bouton Google masqué (`GOOGLE_PRET` dans `compte.tsx`) tant qu'il n'est pas configuré.

**Accent orange (oct. 2026, choix de l'utilisateur) : tout le rose devient orange vif `#FF6B1A`** (les noms `colors.pink`, `pinkLight`,
`Nea.rose`… sont gardés) ; mauve secondaire → orange brûlé `#A0522D`, rose clair → `#FFA266`, zones Z1–Z5 `#7A6E66` → `#FFA266`,
badge kcal → `#FFB547` ; images recolorées (teinte +51°, script de décalage de teinte) : Axel, icône, démarrage, décor, 50 illustrations,
mascottes de la montre et des widgets, vidéo d'accueil (ffmpeg `hue=h=51:s=1.2`) ; `comparer-plan` traduit le rose du prototype en orange.
Partout ci-dessous, « rose » = cet orange. **Build 1.0.0 (15) envoyé à TestFlight** (thème orange).

**Direction artistique « nuit » (oct. 2026, maquettes de l'utilisateur, remplace la refonte graphite)** : fonds presque noirs
(`bg` #0E0E11, cartes `surface` #17171B à fin liseré `border`), orange #FF6B1A pour les actions, sélections, anneaux à lueur ;
**barre d'onglets flottante en pilule** (`TabBar`, 4 onglets : **Accueil**, **Programme** (rubriques Programme · Calendrier · Sorties ·
Rando ; `EnTete` avec sous-titre, `Rubriques`), **Progrès**, **Coach**) ; la Randonnée n'a plus d'onglet à elle (route `/rando` gardée) ;
**Accueil** (`Tableau.tsx`) : « NÉA » + cloche + profil, « Bonjour … · Ton rythme, aujourd'hui. », 2 grands anneaux Récupération / Effort,
carte du coach (tête, état de récupération, motivation du jour), prochaine séance avec image + Commencer, tuiles Sommeil / VFC, Ta journée ;
**Programme** (`ProgrammeHaut.tsx`) : semaine (coches / séances prévues), carte du programme avec progression, « Aujourd'hui » (image,
durée, 3 exercices, Lancer la séance), puis tes programmes, séances prêtes, bibliothèque ; **Coach** = conversation (`Conversation.tsx`,
aussi `/chat`) : en-tête centré « … , ton coach · À ton écoute », bulles, 2 séances adaptées, « Ta séance s'adapte à toi », ressentis
rapides, « Écris à … » ; **Progrès** (`ProgresHaut.tsx`) : jours de régularité en grand avec halo de points, semaine cochée, tuiles
séances / cartes gagnées, dernière récompense (dernière carte succès), Voir ma collection, puis le reste.

**Bug du prototype corrigé** : pendant une séance, le prototype récupère les nouveaux intervalles RR avec `rr.slice(longueur avant)`,
qui ne renvoie plus rien quand sa mémoire de 300 RR est pleine (après ~4 min), donc VFC de séance à 0. L'app prend les derniers battements ajoutés.

## Avancement (section 12 du cahier des charges)

- [x] 1. Base : projet Expo, structure, design system, données extraites, images en fichiers, `CLAUDE.md`
- [x] 2. Onboarding complet + `buildPlan` (« C'est parti » → paywall → création de compte)
- [x] 3. Onglets Accueil, Programme, Calendrier, détail de séance, fiche exercice
- [x] 4. Séance en cours + récap (FC simulée en attendant Apple Santé), puis **onglet Progrès** (fidèle au prototype)
  - « Connecter un capteur » et la carte Sommeil de Progrès renvoient à Apple Santé (étape 6)
- [ ] 5. Supabase (comptes, sauvegarde, suppression) + **onglet Profil** (avec Conditions, Confidentialité et Supprimer mon compte)
  - fait et **validé sur iPhone** : projet Supabase « NÉA COACH » (Canada Central), email + mot de passe, sauvegarde auto (table `etats`), suppression réelle
    (`supprimer_mon_compte`), écran de compte, onglet Profil, Conditions, Confidentialité
  - `supabase/schema.sql` à exécuter dans SQL Editor (tables + RLS + fonction) ; valeurs publiques dans `.env`
  - **Sign in with Apple codé** (`connecterApple`, `expo-apple-authentication`, jeton vérifié par `signInWithIdToken`, prénom repris à la 1re
    connexion) : à activer dans Supabase (Authentication → Providers → Apple, Client IDs `com.neacoach.app,host.exp.Exponent`) et cocher
    « Sign In with Apple » sur l'identifiant `com.neacoach.app` (developer.apple.com) ; avant l'App Store, la suppression du compte devra
    aussi révoquer le jeton Apple (règle 5.1.1(v))
  - **Mot de passe oublié codé** (`MotDePasseSheet`, sans lien profond) : code reçu par email (`resetPasswordForEmail` puis `verifyOtp`
    type `recovery`), nouveau mot de passe (`updateUser`) ; le modèle d'email « Reset Password » de Supabase doit contenir `{{ .Token }}`
  - reste : Google (Google Cloud) ; SMTP personnalisé dans Supabase avant la sortie (l'envoi intégré est limité et réservé à l'équipe)
- [ ] 6. Apple Santé
  - fait (fidèle au prototype, testable dans Expo Go) : écran **Sommeil** (`/sommeil`, vSleep : score de nuit, 7 nuits, VFC nocturne,
    mesures), saisie de la nuit (`NuitSheet`, sleepSheet), **mesure de récupération d'1 min** (`/recuperation`, vHrv, FC simulée,
    même correction des RR que la séance), cartes Nuit / Récupération de l'Accueil, carte Sommeil de Progrès, ligne Sommeil du Profil ;
    `lib/sommeil.ts` (sleepScore, lastNight, baseHrv, recovStatus, hm) comparé au prototype par `comparer-plan`
  - Apple Santé (`lib/sante.ts`, `@kingstinct/react-native-healthkit`, lecture seule) : la feuille « Ta nuit » est préremplie avec la nuit
    de l'Apple Watch (coucher, réveil, VFC nocturne SDNN, FC au repos), la pesée avec le dernier poids. Chargé seulement hors Expo Go
    (`santeDisponible()`), donc Expo Go garde la saisie manuelle
  - choix : `react-native-health` du cahier des charges est à l'ancienne architecture (absente de RN 0.86), d'où `@kingstinct/react-native-healthkit`
  - ajouts validés (hors prototype) : **nuit importée seule** (`store/sante.ts`, à l'ouverture, 30 min après le réveil, qualité 4, jamais sur une
    nuit notée à la main, `Nuit.src = 'sante'`) ; **FC de la montre** en séance et vélo (`store/montre.ts` lit la FC de moins de 20 s toutes les
    5 s, le cœur simulé la suit, `SourceFC = 'montre'`, VFC toujours estimée ; libellé « Apple Watch ») ; **séances et sorties écrites** dans
    Apple Santé (`enregistrerEntrainement`, renforcement / vélo, calories, distance) ; **cercles** (`lib/cercles.ts`, `store/cercles.ts`,
    `Cercles.tsx`) : Bouger (kcal, objectif = séance moyenne du programme), Exercice (min, objectif = durée choisie), Sommeil (8 h),
    Récupération (VFC du jour / référence), carte sur l'Accueil et semaine dans Progrès ; avec Apple Santé, Bouger et Exercice = données Apple ;
    la carte de l'Accueil **remplace les cartes Nuit et Récupération** (readyCard) : lignes touchables (Sommeil → /sommeil avec le score de nuit,
    Récupération → /recuperation avec l'état de la mesure du jour)
  - **build TestFlight 1.0.0 (2) validé sur iPhone** (29 sept. 2026) : Apple Santé, connexion Apple, cercles OK ;
    FC en direct et mesure réelle = ceinture Bluetooth (pas prévue pour l'instant)
- [ ] 7. Vélo : **codé, à valider sur iPhone** (onglet `(tabs)/velo.tsx`, vBike)
  - extérieur : GPS réel (`expo-location`, autorisation « pendant l'utilisation ») sinon parcours simulé après 6 s ; carte **Apple Plans**
    (`react-native-maps`, `Carte.tsx`) avec tracé rose, et le quadrillage SVG du prototype dans le navigateur (`Carte.web.tsx`)
  - stationnaire (résistance 2 à 10), FC simulée, zones, dernière sortie (courbe FC, zones, « Ouvrir dans Plans »), historique ;
    enregistrée dès 30 s, XP 30 + 4/km, quête vélo dès 5 km ou 20 min ; l'horloge continue si on change d'onglet (`store/velo.ts`)
  - les sorties vélo du programme ouvrent l'onglet (`lancerSortie`) ; `lib/velo.ts` (hav, proj) comparé au prototype
  - reste : suivi GPS en arrière-plan (écran verrouillé) = build natif ; notification VFC post-sortie (étape 8)
- [ ] 8. Notifications : **codées, à valider sur iPhone**
  - fidèles au prototype : rappel « VFC post-entraînement » après séance et sortie (délai 6 s à 1 h), « Bilan de ta nuit » /
    « Comment as-tu dormi ? » dans les 4 h après le réveil, « C'est l'heure de te coucher » ; écran `/notifications` (liste, « Tester »),
    feuille de réglages (`NotifSheet`, depuis la liste, Sommeil et Profil), bannière dans l'app (`NotifBanniere`), point rose sur la cloche
  - `lib/notifs.ts` (notifTick, textes) comparé au prototype ; état sauvegardé dans le profil (nset, pending, notifs, lastWake, lastBed)
  - notifications du téléphone app fermée (`store/notifs.ts`, `expo-notifications`, locales donc possibles dans Expo Go) après
    « Autoriser aussi hors de l'app » ; le bilan programmé d'avance affiche le plus souvent « Comment as-tu dormi ? »
  - l'essai NÉA Plus (« Ton essai se termine demain ») viendra avec l'étape 11
- [ ] 9. Coach IA (Edge Function) : **codé, à déployer puis valider sur iPhone**
  - écran `/chat` fidèle à vChat (accueil du coach, bulles, « … », questions rapides, « N messages gratuits aujourd'hui • Illimité avec
    NÉA Plus », saisie) ; ouvert par l'avatar et la citation de l'Accueil et « Parler à … » du Programme ; quête « coach »
  - `supabase/functions/coach/index.ts` (Deno, SDK `@anthropic-ai/sdk`, modèle `claude-opus-5`, effort bas, secours `fallbacks: "default"`) :
    compte connecté obligatoire, consigne du prototype (personnage, tutoiement, 2 à 4 phrases, pas de conseil médical), 10 derniers messages
    + résumé du profil (jamais l'email), clé `ANTHROPIC_API_KEY` en secret de la fonction
  - limite de 3 messages par jour comptée côté serveur (`supabase/coach.sql`, table `coach_quota`, RPC réservées à service_role) et
    dans l'app (`chatQ`) ; sans compte ou si le modèle ne répond pas : réponses de secours du prototype (`lib/coach.ts`)
  - à faire : exécuter `coach.sql`, ajouter le secret, déployer la fonction `coach` (sans « Verify JWT », la fonction vérifie elle-même)
- [ ] 10. Ligue : **codée, à valider sur iPhone** (onglet fidèle à vLigue ; amis et équipes réels à la place des exemples du mode démo)
  - `supabase/ligue.sql` à exécuter dans SQL Editor (après `schema.sql`) : tables `joueurs`, `amities`, `equipes` fermées (RLS sans règle),
    tout passe par des fonctions `security definer` limitées au compte connecté (`ligue_maj`, `ligue_etat`, `ajouter_ami`, `creer_equipe`,
    `rejoindre_equipe`, `quitter_equipe`, `renommer_equipe`)
  - choix validés : ami ajouté en saisissant son code (mutuel, immédiat) ; une équipe par personne, 5 membres max, on crée la sienne ou on
    rejoint celle d'un ami ; boost Équipe x1,2 si 3 membres actifs dans la semaine ; classement « Équipes » = toutes les équipes (nom + XP)
  - sans compte : niveau, boosts, Turbo et quêtes locaux, classement réduit à soi, carte « Créer mon compte »
  - Turbo « Activer » renvoie à NÉA Plus (étape 11) ; icône `bolt` absente du prototype (éclair ajouté)
- [ ] 11. NÉA Plus (RevenueCat) : **paywall, accès et vrais achats codés (en attente de la clé RevenueCat)**
  - paywall `/plus` fidèle à vPaywall (coach, titre personnalisé, courbe, 5 avantages, 2 offres (annuel, mensuel), frise de l'essai, X après 2 s, textes
    légaux, Restaurer / Conditions / Confidentialité) ; `?suite=compte` après « C'est parti » de l'onboarding (puis création de compte)
  - offre de sortie une seule fois (39,99 $ la 1re année, compte à rebours réel de 10 min), feuille d'achat, « Ton abonnement »
    (annuler / réactiver) depuis la ligne NÉA Plus du Profil, rappel « Ton essai se termine demain » au jour 2 (notifications)
  - `lib/premium.ts` : isPremium lit `premium` du profil (sauvegardé et synchronisé avec le compte) ; séances, programmes, coach illimité,
    Turbo et carte « Essaie NÉA Plus » suivent l'abonnement ; tous les boutons « NÉA Plus » passent par `ouvrirPlus()`
  - **vrais achats codés (build 1.0.0 (16) envoyé à TestFlight)** : `store/achats.ts` (RevenueCat `react-native-purchases`, droit `plus`) actif si
    `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (clé publique, variable EAS de l'environnement preview/production) et hors Expo Go, sinon achat simulé ;
    paywall → feuille de paiement d'Apple, Restaurer → `restorePurchases`, « Ton abonnement » → `showManageSubscriptions` ; compte NÉA =
    `appUserID` RevenueCat ; l'abonnement reçu remplace `premium` du profil (`recompenserAchat` : +50 XP, rappel de fin d'essai)
  - **produits créés via l'API** (groupe « NÉA Plus » 22431970, 175 pays, prix équivalents au Canada) : `com.neacoach.app.plus.annuel`
    (59,99 $/an, essai gratuit 3 j), `…plus.annuel.offre` (59,99 $/an, 1re année payée d'avance 39,99 $), `…plus.mensuel` (12,99 $/mois)
  - reste (utilisateur) : contrat « Paid Apps » + banque + fiscalité dans App Store Connect ; compte RevenueCat (projet, app iOS
    `com.neacoach.app`, clé In-App Purchase .p8, droit `plus` avec les 3 produits, offering par défaut) ; capture de revue de chaque
    abonnement ; puis la limite du coach côté serveur doit lire l'abonnement (aujourd'hui 3 messages/jour pour tous côté serveur)
- [ ] **App Apple Watch (maquettes de l'utilisateur, V1 = séances)** : **build TestFlight 1.0.0 (3) compilé et envoyé (30 sept. 2026), à valider sur la montre**
  - cible watchOS SwiftUI `targets/watch/` (`@bacons/apple-targets`, nom `NeaWatch`, `com.neacoach.app.watchkitapp`, watchOS 10) :
    Accueil (bonjour, coach, prochaine séance, Commencer), Tes séances, Détail (Démarrer), Répétitions (comptage **estimé** par
    l'accéléromètre, `Compteur.swift`), Validation (reps −/+, charge modifiable), Repos (anneau, + 15 s, Passer, À suivre), Bilan
    (durée, séries, FC moyenne, énergie, Enregistrer) ; FC et calories de la montre (`HKWorkoutSession`, `Entrainement.swift`),
    séance enregistrée dans Apple Santé par la montre
  - liaison `modules/nea-montre` (module Expo local, WatchConnectivity) + `store/liaisonMontre.ts` : l'iPhone envoie prénom, coach et
    séances de la semaine avec les charges (`updateApplicationContext`) ; la montre renvoie la séance terminée (`transferUserInfo`),
    ajoutée au journal avec XP, série, quête et rappel VFC ; contrat JSON commun `Modeles.swift` ↔ `liaisonMontre.ts`
  - **hub (build 4)** : Accueil = scores du jour (anneaux Effort / Récup. / Sommeil) + prochaine séance + mot du coach + menu (Séances, Vélo,
    Récup., Respirer, Coach, Progrès, Réglages) ; Récupération (sommeil, FC au repos, VFC nocturne), Respiration guidée 2 min (4 s / 6 s,
    enregistrée en pleine conscience), Mesure 1 min (FC du capteur + dernière VFC SDNN de Santé → `noterMesure`), Vélo extérieur (GPS,
    km, km/h, zone sur la FC max envoyée par l'iPhone, carte MapKit avec tracé, route enregistrée dans Santé → journal + XP comme sur
    l'iPhone), Coach (message du jour, dernier échange, ressenti envoyé au coach via l'iPhone), Progrès, Réglages (iPhone, Santé,
    vibrations, unités, synchroniser) ; contrat v2 (champs optionnels, compatible avec le build 3) ; messages montre → iPhone
    `{type, json}` (seance, velo, mesure, coach), événement `messageMontre` (le JS gère aussi `seanceMontre` du build 3)
  - **fin d'activité (build 5)** : la montre envoie aussi un message direct (réveille l'iPhone) ; le module iPhone démarre la liaison
    au lancement (`NeaMontreAppDelegate`, `subscriberDidRegister`) et pose une **notification** « Vélo · 02:12 » / « <séance> · mm:ss »
    quand NÉA n'est pas au premier plan (une fois par date de fin) ; au premier plan : bannière NÉA (`annoncer`, notification `activite`) ;
    toucher → **récap `/activite?d=`** (durée, calories, distance / volume, vitesse, FC moy / max, courbe de FC et zones lues dans
    Apple Santé via `fcEntre`) ; journal : `debut` et `src: 'montre'` ; calories estimées si la montre renvoie 0
  - **restructuration (maquettes 02–15 + cadran)** : titres roses avec retour (`.tint`), gros chiffres à lueur (`GrosChiffre`), Accueil =
    prochaine séance + Démarrer + menu en lignes ; Séances (celle du jour en avant) + **Explorer** (6 séances prêtes accessibles envoyées
    par l'iPhone) ; Détail avec **échauffement 5 min** (validé, `DUREE_ECHAUFFEMENT`) ; séance : Répétitions, Valider, Repos (barre),
    **En pause** (bouton pause en haut, temps arrêté), Bilan ; Vélo (vitesse en grand, pause Reprendre / Terminer), Parcours (carte plein
    écran), Récupération (sommeil en grand), Respiration, **Mon coach** (grille des 4, « Choisir » → iPhone `coach-choix` → `pickCoach`),
    Réglages en liste
  - **complications** `targets/watch-widgets/` (`NeaComplications`, `com.neacoach.app.watchkitapp.complications`, embarquées dans la montre) :
    Score santé (moyenne Effort / Récup. / Sommeil connus), Pas (Santé), Ma séance (`nea://seance` lance la séance du jour), Ton coach
    (rond, ou grand : mascotte + séance du jour, build 7) ;
    données via le groupe `group.com.neacoach.app` (`Cadran.publier`) : groupe créé et coché sur les deux identifiants de la montre ;
    profils App Store avec le groupe : montre 972FATG5W5, complications Y98HZL5A52 (QR8XTVUJF3, jusqu'au 29/09/2027) ;
    **build 1.0.0 (6)** validé (cadran Modulaire rose) ; **build 7** : coach en grand ; **build 9** : + widgets iPhone ; **build 10** : widgets roses, mascotte `_teinte` (opacité = clarté) sur les cadrans teintés (`widgetRenderingMode`)
  - **refonte « Entraînement au poignet » (maquette 01 Choisir · 02 Suivre · 03 Contrôler, build 17)** : Accueil = « Entraînement »
    (Musculation = prochaine séance, Course, Vélo ; choix gardé, Démarrer) puis « Plus » (séances, récup., respiration, coach, progrès,
    réglages) ; séance et sortie en pages à glisser comme l'app Exercice : Commandes (Terminer, Pause, Nouveau = enregistre et revient
    au choix, Segment) ← Suivre (chrono orange, kcal actives / totales, BPM ; km, vitesse ou allure pour les sorties) → séance guidée
    (revient devant à chaque étape) ou Parcours (carte fixe) ; `Activite.swift`, kcal au repos lues dans Santé
  - **« Du téléphone au poignet » (maquette, build 18)** : « Ouvrir sur la montre » (`BoutonMontre`, détail d'une séance de la
    semaine ou d'une séance prête, si une montre est jumelée) → `useChoixMontre` (`nea-montre-choix`, valable le jour même, effacé
    quand la montre renvoie une séance) → `choisie` + `choisieProg` (programme · semaine n/N, ou « Séance prête ») dans l'état ;
    le module lance l'app de la montre (`ouvrirSurMontre`, `startWatchApp`) qui ouvre « Ma séance · Liée à l'iPhone »
    (`BlocMaSeance` en haut de l'accueil, Démarrer, Voir les exercices ; `DelegueMontre.handle`) ; Musculation lance cette séance ;
    écran des reps : « Exercice n/N », « 08 / 10 reps », série, charge et FC, Fin de série
  - reste : `targets/watch/Info.plist` : version 1.0.0 à garder
    égale à celle de l'app (EAS remplace le numéro de build)
  - build : identifiant `com.neacoach.app.watchkitapp` (V7BH4BY5RD, HealthKit) + profil App Store S67853B35U (jusqu'au 29/09/2027) créés via l'API ;
    `credentials.json` multi-cibles (`NA` profil CD645KQZ8X avec le groupe, `NeaWatch`, `NeaComplications`, `NeaWidgets` A22Y52K2DH), `credentialsSource: local` temporaire, puis `eas submit` (clé API temporaire dans le profil d'envoi)
- [ ] **Profil, écran d'accueil, widgets** : Profil en sections (Mon programme, Mon écran, Alertes avec bascules, Santé, Abonnement et
  compte, Aide) ; « Mon écran d'accueil » (`/personnaliser`, `lib/accueil.ts`, `accueil` dans le profil : cartes affichées et ordre) ;
  **widgets iPhone** `targets/widgets/` (WidgetKit, `com.neacoach.app.widgets` 68R3D4T25T, HealthKit + groupe, profil PZ4KG737T5 ; groupe
  `group.com.neacoach.app` dans `app.json`) ; **build 11 = maquette noire à lueur rose** avec la mascotte du coach (`<coach>_corps`) :
  Prochaine séance (moyen, `nea://seance/<jour>`, + rectangulaire), Score NÉA (petit, même moyenne que la montre, + rond ; kind `NeaBilan`),
  Pas (petit, objectif 10 000), Fréquence cardiaque (moyen), Aperçu du jour (grand), Horloge (moyen) ; pas et dernière FC lus par
  l'extension dans Apple Santé (gardés dans le groupe pour l'écran verrouillé), le reste écrit par l'app (`ecrireWidget` : coach, jour) ;
  **build 1.0.0 (11) compilé et envoyé à TestFlight** (widgets + territoires + course) ;
  page `/widgets` (aperçu + marche à suivre) ; le groupe d'apps se crée à la main sur developer.apple.com (pas d'API)
- [ ] **Territoires + Course (hors cahier des charges, demandés par l'utilisateur, oct. 2026)** : **codés, à valider sur iPhone et montre**
  - règles validées : ville en hexagones (~150 m, `lib/territoires.ts`, grille Mercator pointe en haut, `TAILLE` 120) ; **cases traversées**
    (`casesTrace`, pas d'un tiers de case, sauts GPS > 600 m ignorés) ; **tous les joueurs NÉA** (amis et équipe en mauve) ; **vol + bouclier
    24 h** ; case sans passage depuis 14 jours = libre ; seul le vrai GPS compte (pas le simulé ni le stationnaire)
  - `supabase/territoires.sql` à exécuter (après `ligue.sql`) : table `territoires` (q, r, proprio, pris, vu) fermée, RPC `conquerir`
    (3 000 cases max), `territoires_zone` (4 000 max, lien moi / ami / equipe / autre, bouclier), `territoires_classement` (quartier ~20 cases,
    ville ~100) ; testé sur un Postgres local (prise, bouclier, vol, carte, classement)
  - `store/territoires.ts` : file d'attente sauvegardée (`nea-territoires`) envoyée à la connexion ; écran **`/territoires`** (carte Apple Plans
    avec hexagones `CarteTerritoires`, légende, tes cases, surface, bouclier, classement Quartier / Ville, règles) ; entrée `EntreeTerritoires`
    dans Sorties et Progrès ; résultat de la conquête dans « Dernière sortie »
  - **Course** : 3e mode de l'onglet **Sorties** (ex-« Vélo ») : GPS, allure min/km, calories ≈ 1 kcal/kg/km, XP 30 + 8/km, log `course`,
    Santé (HKWorkoutActivityType 37, distance course), rappel VFC ; **montre** : menu « Course » (`VeloView(course:)`, `.running`, allure),
    le vélo et la course envoient `sport` et `pts` (500 points max) → l'iPhone conquiert les cases
- [ ] **Alertes santé de l'iPhone (hors prototype, demandées par l'utilisateur, oct. 2026, comme StressWatch / OtterLife)** : **build 1.0.0 (14)
  envoyé à TestFlight** ; textes drôles avec emojis, plusieurs variantes tirées au hasard (validés par l'utilisateur) ; « Tester mes alertes »
  (Profil, 4 exemples `nea.test.*`, JS, publié en EAS Update) ; `reprogrammer()` n'annule plus les notifications `nea.*` du module natif
  - natif `modules/nea-montre/ios/AlertesSante.swift` : `HKObserverQuery` + livraison en arrière-plan (horaire) sur VFC SDNN, pas et calories
    actives, relancés au lancement (`NeaMontreAppDelegate`) ; notifications locales posées par l'iPhone même app fermée :
    **VFC et fatigue** (« VFC 84 ms · Excellent · 19:06 », au plus 1/h de 8 h à 22 h ; écart à la moyenne 14 j : ≥ +10 % Excellent,
    ±10 % Bon, jusqu'à −25 % Fatigue, au-delà Surcharge), **pas** (80 % puis 10 000, 1 fois/jour chacun), **vélo et dépense du jour**
    (1 fois entre 16 h et 20 h : kcal restantes de l'objectif Bouger et minutes de vélo selon la forme, repos si surcharge), **eau**
    (rappels quotidiens 10 h → 20 h toutes les 2 h, `UNCalendarNotificationTrigger`)
  - réglages `alertesSante` du profil (Profil → « Alertes santé (Apple Watch) »), envoyés par `store/alertes.ts` (`configurerAlertes`, groupe
    d'apps, clé `alertes`) avec objectif kcal, objectif de pas et poids ; toucher : VFC → /recuperation, vélo → /velo, pas → /accueil
- [ ] **Motivation + cœur (hors prototype, demandés par l'utilisateur, oct. 2026)** : **publiés en EAS Update, à valider sur iPhone**
  - `lib/motivation.ts` : **123 messages** (tutoiement, emojis, `{p}` = prénom), `motivationDuJour(progStart, prénom, date)` : ordre mélangé
    par personne et par cycle (compté depuis son 1er jour), aucun message revu avant d'avoir vu les 123 ; sur l'Accueil (carte du coach, à la
    place de `c.daily`), sur la montre (`coachInfo.daily`) et en notification chaque matin (7 jours programmés d'avance, `nset.motiv` / `motivT`)
  - `lib/bilanCoeur.ts` : **bilan du cœur** de la dernière nuit (FC au repos, VFC) vs les 14 nuits d'avant (≥ 3) : top, stable, FC haute
    (≥ +5 bpm), VFC basse (≤ −15 %), surcharge (les deux) ; verdict + conseil du jour (banque par état, pas un avis médical) ;
    `verifierCoeur` (store/notifs) une fois par nuit des dernières 24 h → notification `coeur` (liste + bannière, toucher → Sommeil) ;
    **conseil cœur** programmé un jour sur deux à 17 h 30 (`conseilRythme`, jamais le même deux jours de suite) ; réglage `nset.coeur`
  - bascules « Motivation du jour », « Rappel de séance » et « Mon cœur » dans `NotifSheet` et Profil → Alertes ; « Tester mes alertes » : 8 exemples
  - **notifications dessinées sur la montre (maquettes de l'utilisateur, comme OtterLife, build 21)** : `AlertesSante.swift` pose la VFC de l'heure
    (au plus 1/h, 8 h–22 h, dernière mesure) avec la catégorie `NEA_VFC_<niveau>` (0 Excellent, 1 Stable, 2 Fatigue, 3 Surcharge) et `nea`
    (ms, écart %, heure) dans `body`, la **récupération du matin** (6 h–12 h, VFC du jour / moyenne, `NEA_RECUP`) ; catégories et boutons
    enregistrés au lancement (`enregistrerCategories`) ; JS : **« On bouge ensemble ? »** à 18 h les jours de séance (`NEA_SEANCE`, `nset.seance`),
    boutons gérés dans `demarrerNotifs` (`nea.plustard` = même notification dans 30 min, `nea.seance`, `nea.respirer` / `nea.calme`, `nea.recup`) ;
    montre : `Notifications.swift` (`ControleurNotif` + `WKNotificationScene` par catégorie : Axel selon l'état (`ax_*` recadrés des maquettes),
    « Stable · 62 ms », barre gris → orange, « Dernière mesure », ressenti Énergique / Détendu / Fatigué / Stressé et son bouton : Lancer ma
    séance, Moment calme, Mode récupération, Respirer 1 min ; `ReponsesNotif` ouvre Respiration, Récupération ou la séance)
- [ ] **Transitions + « Ta journée » (hors prototype, demandés par l'utilisateur, oct. 2026)** : **publiés en EAS Update, à valider sur iPhone**
  - transitions natives (`_layout.tsx`) : détails `ios_from_right` + retour par glissement plein écran, activités en cours / récaps /
    ouverture des cartes `fade_from_bottom`, paywall et chat `slide_from_bottom`, accueil / onboarding / onglets en fondu ; onglets `shift`
    avec ressort ; **`Appui`** (`components/ui/Appui.tsx`) : carte qui s'enfonce et rebondit au toucher (Reanimated, `s.set`), placement
    gardé dehors (flex, largeur, marges) ; cartes de l'Accueil, liste « À explorer » et fiche d'un sentier qui apparaissent en cascade (`FadeInDown`)
  - **« Ta journée »** (`lib/journee.ts`, `components/app/Journee.tsx`, carte `journee` de l'Accueil sous le bilan, ajoutée aussi aux ordres
    déjà personnalisés) : séance du jour (ou « Bouge 20 minutes » les jours de repos), objectif Bouger, mesure de récupération, nuit,
    8 verres d'eau (bouton +), 2 min pour souffler ; cochées d'après le journal, l'eau et la respiration à la main (`journee` du profil,
    remis à zéro chaque jour) ; anneau n/6 animé, toucher → l'écran qui va avec ; tout coché → fête « Journée parfaite ! » + 30 XP (1 fois/jour)
- [ ] **Fiche App Store (oct. 2026)** : 5 visuels iPhone 6,9" (`APP_IPHONE_67`) + 4 captures Apple Watch (`APP_WATCH_SERIES_4`, 368 × 448)
  téléversés par l'API ; sous-titre, description (avec mentions d'abonnement), mots-clés, texte promotionnel (fr-CA) ; **site public**
  `site/` sur l'hébergement Expo **https://nea-coach.expo.app** (`npm run site` : `scripts/generer-site.ts` génère confidentialite.html,
  conditions.html, support.html depuis `src/data/legal.ts` ; `index.html` gardé s'il existe, à remplacer par la page ChatGPT) ; URL de
  confidentialité, support et marketing renseignées ; contact : NÉA, édité par Louis Leperlier, Québec, nea.coach.app@gmail.com
  - catégories Santé et forme + Sports, classification d'âge remplie (13+, l'app impose 14 ans) ; reste : questionnaire « App Privacy »
    (pas d'API, à remplir dans App Store Connect), vrais achats (RevenueCat, contrat Paid Apps)
- [ ] **Jeu : cartes récompense, records, défis, fêtes (hors prototype, demandés par l'utilisateur, oct. 2026)** : **codés, publiés en EAS Update, à valider sur iPhone**
  - choix validés : 1 carte par activité terminée (iPhone ou montre) ; booster de 3 (1 Rare garantie) par niveau et par défi de la semaine ;
    1 carte Rare+ par record ; collection + bonus (doubles → XP : Commune 5, Rare 15, Épique 40, Légendaire 100 ; Légendaire nouvelle → +1 Turbo x2) ;
    cartes = 50 exercices + 4 coachs (`lib/jeu.ts` : Légendaire = coach, Épique = exercice niveau ≥ 2, Rare = niveau 1 machine / poulie / vélo,
    Commune = le reste ; chances 62 / 26 / 10 / 2 %)
  - état `jeu` dans le profil (sauvegardé avec le compte) : cartes, paquets à ouvrir, records, défis réussis ; `store/jeu.ts` écoute le profil
    (activité ajoutée une à une, niveau via addXp, défis) et pose les fêtes (`useFetes`) ; la montée de niveau n'affiche plus de toast
  - écrans `/cartes` (collection, filtres de rareté, fiche) et `/cartes/ouvrir` (cartes face cachée à retourner, lueur des rares, doubles → XP) ;
    `FeteHost` (confettis Reanimated, coach, vibration `Vibration`, « Ouvrir mes cartes ») ; **cadres dessinés par l'utilisateur** (`assets/cartes/` :
    commune, epique, legendaire, dos ; **rare dérivé de l'épique** (3e étoile effacée, orange éclairci) en attendant le sien), étoiles comprises,
    `CarteJeu` place l'illustration et le nom dans leurs zones (`ZONE_IMG`, `ZONE_NOM`) ; Progrès : bandeau, **Défis de la semaine**
    (séances = rythme choisi + 2 tirés : km, nuits, mesures, XP, minutes), Ma collection, Tes records ; bandeau aussi sur l'Accueil et le récap
  - **cartes succès (cartes d'Axel dessinées par l'utilisateur, choix A : à côté des cartes d'exercices)** : `lib/succes.ts` (5 cartes,
    2 missions chacune, XP par mission ; textes de l'app corrigés là où la carte se contredisait : 1er sommet pour Explorateur, 3 records
    battus pour Inarrêtable, +10 % de volume par rapport à la 1re séance pour Force), images `assets/succes/` (`SUCCES_IMAGES`) ;
    `jeu.missions` (missions récompensées) et `jeu.nbRecords` ; `Log.sommet` (rando) ; `verifierSucces` (store/jeu, aussi au lancement :
    l'historique compte) → XP + toast par mission, fête avec la carte quand les 2 sont faites ; section « Tes succès » dans Progrès (`Succes.tsx`)
- [ ] **Randonnée (hors cahier des charges, maquettes de l'utilisateur, oct. 2026)** : **codée, publiée en EAS Update, à valider sur iPhone**
  - **5e onglet « Randonnée »** (`(tabs)/rando.tsx`, icône `rando`) : Axel randonneur, filtres (Facile, Modéré, Difficile, < 2 h, Vue
    panoramique, Chutes d'eau ; « Avec chien » de la maquette retiré faute de données fiables), Rando de la semaine (`randoSemaine`, selon le lundi),
    « À explorer », Rando libre ; fiche `/randonnee/[id]` (photo, distance, D+, durée, difficulté, profil approximatif `profilSentier`, carte
    satellite Apple Plans du secteur `CarteSentier` + « Itinéraire dans Plans », Ce que tu vas voir, Conseils d'Axel, météo au sommet
    **Open-Meteo** `useMeteo`) ; `/randonnee/en-cours` (carte satellite qui suit, sommet à mi-parcours, temps, distance, D+ fait / restant,
    altitude, FC, Pause, Terminer) ; `/randonnee/recap` (Sommet atteint si D+ ≥ 60 % du sentier, chiffres, profil mesuré, carte Explorateur,
    badges 1re rando / 500 m de D+ / Lève-tôt / 10 km, Partager)
  - `store/rando.ts` : GPS + altitude (dénivelé `denivele`, lissé, seuil 3 m), sinon marche simulée ; journal `type: 'rando'` (`dplus`, `rando`),
    XP 40 + 6/km + D+/25, calories MET 6 + montée, Apple Santé (HKWorkoutActivityType 24, distance marche), rappel VFC, territoires (vrai GPS)
  - 5 sentiers dans `data/randos.ts` (valeurs **indicatives des maquettes, à vérifier** avant la sortie), photos recadrées des maquettes
    (`data/randosImages.ts`, `assets/randos/`) ; cartes **Explorateur** `rando:<id>` (Légendaires, jamais tirées, gagnées au sommet ; collection 59)
  - **vrais sentiers « Près de toi »** (`lib/osm.ts`, `store/randosPres.ts`, cache `nea-randos-pres` 24 h / 10 km) : position, relations
    `route=hiking` nommées d'OpenStreetMap à 30 km (Overpass, 2 serveurs), 1,5 à 25 km, les 8 plus proches ; altitude du terrain sur 60 points
    (Open-Meteo `/v1/elevation`) → D+, profil, sommet ; tracé linéaire = aller-retour (distance doublée, profil en miroir) ; durée 4 km/h + 1 h / 600 m ;
    difficulté (facile < 6 km et < 250 m, difficile > 15 km ou > 700 m) ; **Suggestion du jour** (`suggestion` : niveau, récupération du jour) ;
    fiche avec la carte du tracé, « Itinéraire jusqu'au départ », mention © OpenStreetMap ; pas de carte Explorateur pour ces sentiers
    (Overpass bloqué dans l'environnement de dev : testé avec des réponses simulées, à valider sur iPhone)
  - **illustrations de l'utilisateur (oct. 2026)** : vraies photos des 5 sentiers (`<id>_grand.jpg` + vignette ; Montmorency sert aussi au point « Chute »),
    au style NÉA (voile chaud orange, ombres graphite, vignette : `python3 scripts/photo-sentier.py <photo> <id>`) ;
    scènes d'Axel en bandeau 16:9 (`DECO_IMAGES`) : salle (carte « Ta prochaine séance » le jour J), étirements (jours de repos),
    trail (Course avant le départ, à la place de la carte vide), sommet (carte « Rando libre »)
  - **13 sentiers** : + Mont Albert, Mont Jacques-Cartier, Ernest-Laforce, Pic Champlain, Sentier de la Statue, Pain de Sucre, Mont-Chauve,
    Le Centenaire (distances / D+ / durées des fiches des parcs, altitudes approximatives) ; **galerie** « Photos du sentier » (`GalerieSentier`,
    visionneuse plein écran) et « Ce que tu vas voir » avec les vraies photos du sentier (`galerie`, `imageVoir` dans `randosImages.ts`) :
    photos libres de **Wikimedia Commons** teintées au style NÉA, crédit auteur + licence affiché (photo, visionneuse, héros `creditPrincipal`)
  - **rando sur la montre (build 19)** : 4e activité « Randonnée » (`TypeActivite.rando`, `SortieVelo(rando:)`, HKWorkoutActivityType
    `.hiking`) : GPS, D+ au baromètre (`CMAltimeter`, seuil 3 m ; altitude GPS sans baromètre), altitude, sommet (60 % du D+ du sentier),
    bilan ; « Ouvrir sur la montre » sur la fiche (`BoutonRandoMontre`, `ouvrirRandoSurMontre`, `rando` dans l'état) → « Ma rando · Liée à
    l'iPhone » (`BlocMaRando`, `MaRandoView`) ; la montre renvoie `sport: 'rando'` + `dplus`, `altMax`, `sentier` → `recevoirRando`
    (journal, XP, sommet, carte Explorateur `gagnerExplorateur`, territoires) ; récap `/activite` avec D+
  - reste : liste validée, photo au sommet
- [ ] 12. Analytics, polish, accessibilité, performance
- [ ] 13. TestFlight + App Store

## Structure

```
src/
  app/              routes Expo Router (un fichier = un écran, _layout = navigateur)
    bienvenue.tsx   accueil (vidéo d'Axel)
    onboarding/     prenom, objectifs, niveau, lieu, rythme, profil, sante, coach (8 écrans) + preparation + pret
    (tabs)/         accueil.tsx, programme.tsx (?vue=calendrier), velo, rando.tsx (Randonnée), progres.tsx (+ Ligue dessous), coach.tsx, ligue.tsx (Ligue seule), profil + barre à 4 onglets
    seance-en-cours séance guidée (séries, reps, minuteur, repos, FC simulée) puis récap
    seance/[jour]   détail d'une séance de la semaine · catalogue/[id] : séance prête · plan/[id] : programme
    (tabs)/velo     onglet Vélo (extérieur / stationnaire, carte, historique)
    chat.tsx        discussion avec le coach IA · plus.tsx : paywall NÉA Plus (?suite=compte dans l'onboarding)
    seances.tsx     toutes les séances prêtes (?lieu=) · exercices.tsx : bibliothèque des 50 exercices
    notifications   liste des notifications · sommeil.tsx : Sommeil (?ajout=1 ouvre la saisie de la nuit)
    sommeil.tsx     Sommeil (nuits, score, VFC nocturne) · recuperation.tsx : mesure de récupération d'1 min
    activite.tsx    récap d'une activité (montre) : FC d'Apple Santé, zones · personnaliser.tsx, widgets.tsx
    randonnee/      [id] fiche d'un sentier, en-cours, recap · cartes/ : collection, ouvrir
    territoires.tsx carte des territoires conquis (hexagones), classements quartier / ville, règles
    reglages.tsx    « Modifier » du calendrier · design.tsx : écran de vérification du design system
    compte.tsx      création de compte / connexion (?onb=1 en fin d'onboarding, ?mode=login|signup)
    (tabs)/profil   onglet Profil · legal/[doc] : conditions, confidentialite
  components/ui/    design system (Text, BigNumber, Button, Card, SelectableCard, Segmente, Icon, Glow, RadialBackground, Toast, Screen)
  components/app/  TabBar, Sheet, ExerciceSheet, DemoSheet, PlanifierSheet, ZoneBar, LivePills, Recap, Coeur (courbe FC, zones),
                    Detail (en-tête, hero, tags…), Rows, CoachFace, Kcal, Thumb, Lvl (hexagone du niveau), confirmer,
                    BarresVFC, NuitSheet, NotifSheet, NotifBanniere, AbonnementSheet, ouvrirPlus, Carte (.web : SVG du prototype), CarteVide, lancerSortie,
                    Cercles (anneaux Bouger / Exercice / Sommeil / Récupération, BilanDuJour), Reperes, MotDePasseSheet, Ligue (écran de la Ligue), EnTete (titre + segmenté d'un onglet)
  components/onboarding/  ObScaffold (barre 1/8…8/8), choix (.goal, .big2, .chip, .opt, .hq, .ackb, .warn), ordre des étapes
  lib/plan.ts       buildPlan et calculs (portage fidèle du prototype, fonctions pures)
  lib/semaine.ts    semaine, séances du catalogue ajoutées (catSession, sessionForDay, nextSession)
  lib/charges.ts    charge conseillée (loadFor), itemLine, zone de reps · lib/xp.ts : série, niveaux, rangs, boosts, quêtes
  lib/coeur.ts      FC et VFC simulées (Coeur.tick, rmssd, zone), hrStats · lib/premium.ts : accès NÉA Plus
  store/profil.ts   état utilisateur Zustand sauvegardé (AsyncStorage, clé nea2) + usePlan(), useSemaine(), addXp, quest, addLog
  store/seance.ts   séance en cours (non sauvegardée), mises à jour immuables (React Compiler)
  store/compte.ts   compte Supabase : inscrire, connecter, deconnecter, supprimerCompte, sauvegarde auto de l'état (+ joueur de la Ligue)
  store/coach.ts    envoi d'un message au coach (fonction Edge ou secours) · lib/coach.ts : accueil, secours, quota, résumé du profil
  store/notifs.ts   horloge des notifications, bannière, ouverture, notifications du téléphone · lib/notifs.ts : réglages, textes, échéances
  store/velo.ts     sortie vélo en cours (non sauvegardée) · lib/velo.ts : distance, tracé, parcours simulé, calories, XP
  store/mesure.ts   mesure de récupération en cours (non sauvegardée) · lib/sommeil.ts : score de nuit, VFC de référence, récupération
  store/ligue.ts    Ligue en ligne (non sauvegardée) : code ami, amis, équipe, classement ; RPC de supabase/ligue.sql
  lib/ligue.ts      semaine de la Ligue : lundiISO, xpSemaine (myWeekXp), actifSemaine, actifsEquipe (teamActiveN)
  lib/supabase.ts   client Supabase (session : lib/stockage.ts via expo-sqlite, stockage.web.ts dans le navigateur)
  theme/            tokens : couleurs, dégradés, zones cardio, typo système, rayons, glow
  data/             données statiques extraites du prototype (typées, voir « Données »)
assets/
  exercices/        50 illustrations <id-exercice>.webp
  coachs/           <coach>_corps.png (mascotte entière) et <coach>_tete.webp (avatar)
  deco/             podium, poses d'Axel, vidéo d'accueil v_axel.mp4
  images/           icône et écran de démarrage
docs/               cahier des charges
prototype/          nea-app.html (référence) + LISEZMOI des données
supabase/           schema.sql, ligue.sql, coach.sql, territoires.sql (SQL Editor) · functions/coach (fonction Edge, exclue du tsc et du lint de l'app)
targets/watch/      app Apple Watch (SwiftUI) · targets/watch-widgets : complications du cadran · modules/nea-montre : liaison WatchConnectivity (module Expo local)
scripts/            verifier-donnees.ts, comparer-plan.ts (+ prototype-plan.cjs)
```

Alias d'import : `@/…` → `src/…`, `@/assets/…` → `assets/…`.

## Données (`@/data`)

Générées depuis `NEA-donnees-et-images.zip`, identiques aux constantes du prototype (clés d'origine conservées).

| Export | Prototype | Contenu |
|---|---|---|
| `COACHES` | `COACHES` | 4 coachs (Blaze et Rex retirés) |
| `EXERCICES` | `EXL` + `NAMES` | 50 exercices |
| `SEANCES`, `SEANCES_GRATUITES` | `CAT`, `FREE_WK` | 41 séances, 3 gratuites |
| `PROGRAMMES` | `PROGS` | 3 programmes par coach (12) |
| `TEMPLATES`, `SPECIAL`, `DAYSPOS` | `TPL`, `SPECIAL`, `DAYSPOS` | modèles de séance pour `buildPlan` |
| `GROUPES`, `MATERIEL`, `LIEUX`, `GEAR`, `GOALS`, `GOALF` | `GRP`, `EQN`, `LIEUX`, `GEAR`, `GOALS`, `GOALF` | référentiels |
| `HEALTH_QUESTIONS` | `HQ` | questionnaire santé |
| `PLANS` | `PLANS` | offres NÉA Plus |
| `QUESTS`, `RANKS` | `QUESTS`, `RANKS` | ligue |
| `EXERCICE_IMAGES`, `COACH_IMAGES`, `DECO_IMAGES`, `VIDEO_ACCUEIL` | — | images dans `/assets` |

Les exercices d'une séance gardent le format du prototype `id:séries:reps:repos` (`SeanceExercice`).
Vérifier l'extraction : `npm run verifier-donnees` (4 / 50 / 41 / 12 + une image par coach et par exercice).

## Logique (`@/lib/plan`)

`buildPlan`, `recoCoach`, `estMin`, `exKcal`, `sesKcal`, `progWeek`, `progFactor`, `hrMax`, `catSession`, `loadFor`,
`streak`, `lvlInfo`, `rankOf`, la FC simulée (`HR.tick`, `rmssd`, `zone`), `hrStats`, les quêtes du jour et le sommeil (`sleepScore`,
`lastNight`, `baseHrv`, `recovStatus`, `hm`) sont portés **à l'identique** du prototype.
Toute modification doit garder `npm run comparer-plan` à 0 différence : ce script exécute le code d'origine
de `prototype/nea-app.html` et compare : buildPlan sur 3 888 profils, loadFor sur ~92 000 exercices, catSession sur
les 41 séances × 3 intensités × 4 poids, streak, lvlInfo, 40 × 400 s de FC simulée (même suite aléatoire), 730 jours de quêtes,
le sommeil, le vélo (hav, proj) et les notifications dues (notifTick).
`src/lib/*` n'importe pas `@/data` (qui charge les images) pour rester exécutable avec Node.

## Design system

- Toujours passer par `@/theme` (jamais de couleur en dur dans un écran).
- Polices : police système ; `<Text weight="semibold">` etc. ou `...fonts.semibold` dans un style (`fonts.*` = `fontWeight`).
- Cartes radius 20 sans bordure, boutons pilule hauteur 52 (principal rose plein), sélection = bordure rose.
- Couleurs ponctuelles du CSS du prototype dans `ui` (`@/theme`) ; `mix()` et `alpha()` pour `color-mix`.
- Lueurs : `<Glow>` (dégradé radial SVG) ou `<RadialBackground>`, jamais de `textShadow` coloré (rectangle sur iOS).
- Avec le React Compiler, ne jamais modifier un objet d'état en place (il ne serait pas redessiné) : copies immuables, valeurs simples en props.
- Grands chiffres (poids, âge, FC, compte à rebours, prix du paywall…) : toujours `<BigNumber value unit>`. Jamais de `Text` de grande taille imbriqué dans un `Text` plus petit ni de `lineHeight` inférieur à la taille de police : sur iOS, le haut des chiffres est rogné.

## Commandes

```bash
npm install
npx expo start            # puis scanner le QR code avec l'iPhone (Expo Go)
npx tsc --noEmit          # typecheck
npx expo lint             # lint
npx expo install <pkg>    # toujours utiliser ceci pour ajouter une dépendance
```

## Build iOS (TestFlight)

Bundle ID `com.neacoach.app`. `eas.json` : profils `preview` (canal preview, TestFlight) et `production`, numéro de build géré par EAS.
`scripts/build-ios.sh` lance le build sans ordinateur : les identifiants Apple viennent des variables d'environnement listées dans le script.
L'app TestFlight télécharge les mises à jour `eas update --branch preview` comme Expo Go (même `runtimeVersion`) : un nouveau build
n'est nécessaire que si on ajoute un module natif. Ne jamais créer `ios/` à la main (`npx expo prebuild` sert seulement à vérifier).
Premier build : EAS refuse de créer les identifiants Apple en non interactif ; certificat de distribution (8DJK33Q58J, jusqu'au 29/09/2027)
et profil App Store (742RA248D9) créés via l'API App Store Connect, utilisés en `credentialsSource: local` (fichiers hors git), puis
`eas submit` avec `ascApiKeyPath`/`ascApiKeyId`/`ascApiKeyIssuerId` temporaires dans le profil d'envoi (`ascAppId` 6816691008 dans `eas.json`).
Pour les builds suivants : téléverser ce certificat et ce profil sur EAS (`eas credentials`, interactif) ou les recréer.

## Publier pour tester dans Expo Go (EAS Update)

Projet EAS : `@leaderprinces-team/nea`. `runtimeVersion` = `exposdk:57.0.0` pour qu'Expo Go (SDK 57) puisse ouvrir les mises à jour.
Nécessite `EXPO_TOKEN` dans l'environnement (jamais dans le code ni dans git).

```bash
npx eas-cli@latest update --branch preview --environment preview --platform ios --non-interactive --message "…"
```

Ouvrir dans Expo Go : `exp://u.expo.dev/<projectId>/group/<updateGroupId>` (ou QR code « Preview » sur la page de la mise à jour dans le tableau de bord EAS).

`--environment` fait ignorer le `.env` local : les valeurs publiques Supabase ont donc un secours dans `src/lib/supabase.ts`.
Après chaque publication, vérifier : `strings dist/_expo/static/js/ios/*.hbc | grep -c aqmojycbnaotxrrcvxdr` (doit valoir 1).

Lancer typecheck et lint avant de considérer une tâche terminée.

@AGENTS.md
