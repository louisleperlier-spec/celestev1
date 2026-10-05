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

### Compte 1 : histoire de la fondatrice (persona IA)

Format inspiré de @irsaslaw : une jeune femme raconte qu'elle crée son app de sport, avec sa famille et ses doutes, beaucoup d'émotion, et la dernière slide renvoie vers NÉA.
Déjà publiés : « Maman, papa, j'arrête mes études… » (001) et « Mamie, je crée une application de sport » (002).

Fiche persona 1, à coller mot pour mot dans chaque prompt d'image :
> Jeune femme de 22 ans, longs cheveux châtain foncé ondulés avec un effet un peu décoiffé, yeux noisette, taches de rousseur légères, peau naturelle sans maquillage marqué, sourire doux en coin. Style décontracté : sweat oversize anthracite, t-shirt blanc, jogging gris, ou tenue de salle noire.

### Compte 2 : conseils salle pour débutantes (persona IA)

Format inspiré de @fitnessleana : carrousels « 5 habitudes / 3 erreurs / ce que j'aurais aimé savoir », selfie miroir à la salle, un chiffre et une promesse concrète dans l'accroche. Il finit par « je fais ça avec NÉA » ou par l'app à l'écran.

Fiche persona 2, à coller mot pour mot dans chaque prompt d'image :
> Jeune femme de 23 ans, cheveux blonds foncés mi-longs attachés en queue de cheval haute, quelques mèches qui tombent, yeux verts, taches de rousseur légères, peau naturelle sans maquillage marqué, silhouette sportive mais normale (pas une athlète). Tenue : brassière noire, t-shirt oversize gris clair, legging noir, baskets blanches.

### Style commun des prompts d'image

> Photo verticale 9:16 prise à l'iPhone, rendu brut et naturel, lumière réelle, léger grain, aucune retouche beauté, aucun effet studio. Texte en surimpression : police sans-serif blanche très grasse, fin contour noir, centré horizontalement, placé entre 35 % et 75 % de la hauteur, sans cacher le visage. Petit compteur blanc « X/N » en haut à gauche. Orthographe française exacte, accents compris, aucune autre écriture dans l'image.

---

## Instructions de la routine

1. Place-toi sur la branche `claude/strategie-ugc-ia` (`git fetch origin claude/strategie-ugc-ia && git checkout claude/strategie-ugc-ia`). Lis `docs/routine-quotidienne.md` (ce fichier), `docs/strategie-ugc-ia.md` et les 7 derniers fichiers de `docs/contenu/`, pour ne jamais répéter une accroche ou une histoire.
2. **Veille des tendances** (recherche web, 10 minutes maximum) :
   - formats, sons et hashtags qui marchent en ce moment sur TikTok dans le fitness féminin, en France et au Québec (TikTok Creative Center, articles récents, comptes du même type que @fitnessleana et @irsaslaw) ;
   - retiens 3 à 5 tendances **exploitables aujourd'hui**, avec la source et la date. Si une info n'est pas vérifiable, dis-le plutôt que de l'inventer.
3. **Compte 1** : écris 1 carrousel de 5 ou 6 slides qui continue l'histoire de la fondatrice. Donne, dans l'ordre :
   - le titre (90 caractères maximum) ;
   - pour chaque slide : le texte exact, puis le prompt GPT Astra complet (fiche persona 1 + scène + texte + compteur + style commun) ;
   - la légende avec « Lien en bio · Image virtuelle » et 5 ou 6 hashtags.
4. **Compte 2** : même chose, avec un carrousel de conseils de 5 ou 6 slides et la fiche persona 2. Les conseils doivent être justes et prudents : pas de promesse de perte de poids, pas de conseil médical.
5. **Bonus** : 1 idée de mème avec la mascotte NÉA (texte du mème et scène), et 1 idée qui reprend une des tendances repérées à l'étape 2.
6. **Rappel de programmation** : programmer ce soir les 2 posts pour demain 12h30 heure du Québec, activer le label « Contenu généré par IA », ajouter un son tendance.
7. Écris tout dans `docs/contenu/AAAA-MM-JJ.md`, avec la **date du lendemain** (heure du Québec), puis commit et push sur `claude/strategie-ugc-ia`.
8. Termine par un résumé de 5 lignes maximum : les 2 accroches de demain et la tendance la plus intéressante.

## Règles

- Tout en français, orthographe et accents irréprochables.
- Jamais de faux témoignage d'utilisatrice, de faux chiffres ou de faux avis présentés comme réels.
- Toujours « Image virtuelle » dans la légende et le label IA à activer sur TikTok.
- Ne publie rien toi-même, n'envoie rien à l'extérieur : tu prépares, Louis publie.
