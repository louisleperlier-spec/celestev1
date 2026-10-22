# Routine quotidienne : contenu TikTok NÉA

Chaque soir à 18h58 (heure du Québec), une session Claude lance automatiquement les instructions ci-dessous et prépare le contenu **du lendemain**.
Le résultat est écrit dans `docs/contenu/AAAA-MM-JJ.md` (date du lendemain) et poussé sur la branche `claude/strategie-ugc-ia`.
Le soir même, Louis génère les images dans GPT Astra et programme les posts dans TikTok pour le lendemain à 12h30.

Pour changer le contenu de la routine : modifie ce fichier et demande à Claude de mettre la routine à jour.

---

## Contexte

- **NÉA** : app iOS de coaching sport. Programme sur mesure, coach IA qui adapte la séance à l'énergie du jour, séances guidées, Apple Watch, récupération (sommeil, VFC), course et vélo, randonnée, territoires à conquérir, ligue entre amis, cartes à collectionner. Slogan : « Ton coach. Ton rythme. » Couleurs : noir et orange (#FF6A1A).
- Audience : femmes de 18 à 30 ans, Québec et France, débutantes ou intermédiaires à la salle.
- Les images sont générées par Louis dans **GPT Astra** (ChatGPT). Les textes sont posés soit directement dans l'image, soit par `slideshow/render.py`.
- Publication à la main dans TikTok, 1 post par jour et par compte, à 12h30 heure du Québec.

### Compte 1 : @axel.coach.nea (le coach robot de NÉA)

Depuis le 21 oct., le compte 1 s'appelle **@axel.coach.nea** et met en scène **Axel**, le robot coach de NÉA (vidéos Google Flow, voir `docs/videos-google-flow.md`, et carrousels). Les 2 carrousels de Jasmine du 5 et 6 oct. sont passés en privé.

Stats du 22 oct. (TikTok Studio) :
- « Ta batterie n'est pas toujours à 100 %… » (21 oct., 17 h 40) : **668 vues**, 11 j'aime, 1 commentaire, visionnage moyen 5,7 s, vu en entier 9,4 %. **Meilleur angle : fatigue, énergie basse, culpabilité douce.**
- « Tu compares ton début au chapitre 20 de quelqu'un d'autre… » (21 oct., 20 h 44) : 131 vues, visionnage moyen 18,7 s, vu en entier 3,6 % (bonne rétention, accroche trop faible).
- 1 abonnée, 2 vues de profil sur 28 jours : les vidéos ne donnent pas encore envie d'aller sur le profil.

Règles du compte 1 :
- Axel parle **à la 2e personne** (« tu ») comme un coach bienveillant et un peu taquin. Angles prioritaires : énergie basse, fatigue, culpabilité, recommencer, comparaison aux autres.
- **Vidéos de 7 à 10 s** (un seul clip Flow), réplique de 15 mots max, accroche écrite à l'écran dès la 1re seconde.
- Chaque post finit par une raison de s'abonner : « Abonne-toi, demain je te dis quoi faire quand… » (série).
- Publication vers **17 h 30 – 18 h** (heure du Québec) : c'est le créneau du meilleur post.

Fiche d'Axel, à coller mot pour mot dans chaque prompt (image ou vidéo) :
> Le robot coach de l'app NÉA : petite tête-robot ronde et brillante, noir laqué, deux yeux en LED orange en forme d'arcs souriants, bandeau de sport orange en tissu éponge sur le front, gros casque audio noir avec reflets orange, halo de lumière orange autour de lui. Corps de robot noir mat aux formes arrondies. Style 3D d'animation, éclairage doux. Voix masculine chaleureuse et un peu taquine, en français, débit rapide de coach.

Archive : la persona Jasmine (fiche ci-dessous) n'est plus utilisée sur ce compte, à garder pour un autre compte éventuel.
> Jeune femme de 22 ans, longs cheveux châtain foncé ondulés avec un effet un peu décoiffé, yeux noisette, taches de rousseur légères, peau naturelle sans maquillage marqué, sourire doux en coin. Style décontracté : sweat oversize anthracite, t-shirt blanc, jogging gris, ou tenue de salle noire.

### Compte 2 : conseils salle pour débutantes (persona IA)

Format inspiré de @fitnessleana : carrousels « 5 habitudes / 3 erreurs / ce que j'aurais aimé savoir », selfie miroir à la salle, un chiffre et une promesse concrète dans l'accroche. Il finit par « je fais ça avec NÉA » ou par l'app à l'écran.

Fiche persona 2, à coller mot pour mot dans chaque prompt d'image :
> Jeune femme de 23 ans, cheveux blonds foncés mi-longs attachés en queue de cheval haute, quelques mèches qui tombent, yeux verts, taches de rousseur légères, peau naturelle sans maquillage marqué, silhouette sportive mais normale (pas une athlète). Tenue : brassière noire, t-shirt oversize gris clair, legging noir, baskets blanches.

### Compte 3 : PVT → mines du Québec (personnage 3D)

Compte TikTok : **@lenamoove**, nom affiché « mathis.minesqc » (identifiant à passer en @mathis.minesqc). Ce compte ne parle **pas** de NÉA.
Bio : « PVT → mines du Québec ⛏️ Les vraies infos 🇫🇷🇨🇦 Guide sur mon Insta 👇 ».
Premiers chiffres (16 oct.) : « Travailler dans les mines au Québec ? » 92 vues, « PVT → mine, les 4 étapes » 39 vues, 68 abonnés (achetés, sans valeur pour la portée).
Audience : Français et Belges de 18 à 35 ans qui préparent un PVT (Programme vacances-travail, EIC) au Canada et cherchent un emploi bien payé.
Ce qui marche : l'accroche en **question** (92 vues) bat la liste (39 vues). Viser l'argent, la peur ou le « est-ce possible pour moi ».

Fiche personnage 3, à coller mot pour mot dans chaque prompt d'image :
> Personnage 3D style film d'animation, jeune homme d'environ 25 ans, cheveux bruns bouclés, yeux marron, barbe de trois jours légère, sourire confiant. Casque de chantier blanc avec lampe frontale et petit autocollant du drapeau du Québec, combinaison de travail orange haute visibilité avec bandes réfléchissantes grises, gants et bottes de sécurité.

Décor de référence : chevalement de mine en acier la nuit, neige au sol, sapins, petits bâtiments éclairés, flocons qui tombent. Texte sur un panneau en bois accroché au chevalement, police grasse noire avec mots-clés en orange.

Règles propres au compte 3 :
- **Aucun chiffre inventé.** Salaires, horaires, primes : uniquement des chiffres sourcés (Guichet-Emplois du Canada, offres d'emploi réelles, sites officiels) et indiquer la source dans le fichier du jour. Si un chiffre n'est pas vérifiable, formuler sans chiffre.
- Démarches PVT : renvoyer aux sources officielles (IRCC, canada.ca) ; pas de conseil juridique ni de promesse d'obtenir un permis ou un emploi.
- Mots-clés à mettre dans la slide 1 **et** au début de la légende : « PVT Canada », « mines Québec », « travailler au Canada », « emploi Québec ».

### Recette « carrousel valeur » (compte 2 en priorité)

Inspirée des carrousels « DOs and DON'Ts » qui font plus de 250 000 j'aime et 80 000 enregistrements :
- **6 slides.** Slide 1 : photo large et spontanée, avec l'accroche « 5 façons de [résultat concret] ». Slides 2 à 6 : un conseil numéroté par slide, vraiment utile, **avec un chiffre précis** (séries, minutes, pas, heures).
- **NÉA apparaît sur UNE seule slide du milieu** (jamais la 1re ni la dernière), écrit « NÉA » entre guillemets à l'intérieur du conseil, avec la photo d'une main qui tient un téléphone montrant le vrai écran de l'app. Toutes les autres slides sont de la valeur pure.
- **Zone de texte sûre :** entre 300 px du haut et les 25 % du bas d'un cadre 1080×1920, pour que l'interface de TikTok ne recouvre rien.
- **Légende décontractée en minuscules**, avec 4 à 6 hashtags.
- **Pas de fausse promesse santé :** pas de « perdre du ventre » ciblé (la perte de gras localisée n'existe pas), pas de régime extrême.

### Style commun des prompts d'image

> Photo verticale 9:16 prise à l'iPhone, rendu brut et naturel, lumière réelle, léger grain, aucune retouche beauté, aucun effet studio. Texte en surimpression : police sans-serif blanche très grasse, fin contour noir, centré horizontalement, placé entre 35 % et 75 % de la hauteur, sans cacher le visage. Petit compteur blanc « X/N » en haut à gauche. Orthographe française exacte, accents compris, aucune autre écriture dans l'image.

---

## Instructions de la routine

1. Place-toi sur la branche `claude/strategie-ugc-ia` (`git fetch origin claude/strategie-ugc-ia && git checkout claude/strategie-ugc-ia`). Lis `docs/routine-quotidienne.md` (ce fichier), `docs/strategie-ugc-ia.md` et les 7 derniers fichiers de `docs/contenu/`, pour ne jamais répéter une accroche ou une histoire.
   Si `docs/contenu/` contient déjà le fichier du lendemain, ne le refais pas : arrête-toi et indique simplement où il se trouve.
2. **Veille des tendances** (recherche web, 10 minutes maximum) :
   - formats, sons et hashtags qui marchent en ce moment sur TikTok dans le fitness féminin, en France et au Québec (TikTok Creative Center, articles récents, comptes du même type que @fitnessleana et @irsaslaw) ;
   - retiens 3 à 5 tendances **exploitables aujourd'hui**, avec la source et la date. Si une info n'est pas vérifiable, dis-le plutôt que de l'inventer.
3. **Compte 1 (@axel.coach.nea)** : écris 1 vidéo Google Flow d'Axel (prompt complet avec la fiche d'Axel, réplique de 15 mots max, texte d'accroche à poser au montage) **ou** 1 carrousel de 5 ou 6 slides avec Axel, sur l'angle énergie / fatigue / culpabilité douce. Donne, dans l'ordre :
   - le titre (90 caractères maximum) ;
   - pour chaque slide : le texte exact, puis le prompt GPT Astra complet (fiche persona 1 + scène + texte + compteur + style commun) ;
   - la légende avec « Lien en bio · Image virtuelle » et 5 ou 6 hashtags.
4. **Compte 2** : même chose, avec un carrousel de conseils de 5 ou 6 slides et la fiche persona 2. Les conseils doivent être justes et prudents : pas de promesse de perte de poids, pas de conseil médical.
4 bis. **Compte 3** : 1 carrousel de 5 ou 6 slides dans le style 3D du compte (fiche personnage 3 + décor de référence), accroche en question, info utile et vérifiée. Même structure : titre, texte et prompt GPT Astra de chaque slide, légende avec 4 à 6 hashtags (#pvtcanada #pvt #quebec #mines #travailleraucanada…), et les sources des chiffres.
5. **Bonus** : 1 idée de mème avec la mascotte NÉA (texte du mème et scène), et 1 idée qui reprend une des tendances repérées à l'étape 2.
6. **Rappel de programmation** : programmer ce soir les posts de demain : compte 1 vers 17 h 30 – 18 h, comptes 2 et 3 à 12 h 30 (heure du Québec), activer le label « Contenu généré par IA », ajouter un son tendance.
7. Écris tout dans `docs/contenu/AAAA-MM-JJ.md`, avec la **date du lendemain** (heure du Québec), puis commit et push sur `claude/strategie-ugc-ia`.
8. Termine par un résumé de 5 lignes maximum : les 3 accroches de demain et la tendance la plus intéressante.

## Règles

- Tout en français, orthographe et accents irréprochables.
- Jamais de faux témoignage d'utilisatrice, de faux chiffres ou de faux avis présentés comme réels.
- Toujours « Image virtuelle » dans la légende et le label IA à activer sur TikTok.
- Ne publie rien toi-même, n'envoie rien à l'extérieur : tu prépares, Louis publie.
