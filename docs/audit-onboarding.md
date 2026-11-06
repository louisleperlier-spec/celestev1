# Audit de l'onboarding NÉA (6 nov. 2026)

Grille des 4 leviers : **procédé viral**, **onboarding qui crée le besoin**, **offre irrésistible**, **contenu en masse**.

## Constat avant la refonte

| Levier | Avant | Note |
|---|---|---|
| Créer le besoin | Questions purement logistiques (objectifs, niveau, lieu, jours, durée) : on remplit un formulaire, on ne ressent rien | 2/5 |
| Différenciation | « Construit autour de toi » dit par tous les concurrents ; rien ne dit pourquoi les autres programmes ont échoué | 2/5 |
| Procédé viral | Aucun : pas de partage, pas d'invitation, Amis / Équipes masqués | 0/5 |
| Offre | Annuel 59,99 $ avec 3 j gratuits, mensuel 12,99 $, offre de sortie 39,99 $ : solide | 4/5 |
| Contenu | Mascottes, scènes, 50 illustrations Axel : bonne matière pour TikTok, pas encore exploitée | 3/5 |

## Concurrents

- **Cal AI** : questionnaire long (~20 étapes) qui reformule le problème de la personne, animations pendant la « préparation »,
  paywall testé en continu, croissance par des créateurs payés au mois sur TikTok / Instagram.
- **Fitbod** : questionnaire détaillé, puis adaptation à chaque séance selon la récupération musculaire ; c'est leur argument central.
- **Ladder** : personnalisation surtout au choix du coach ; la force est la communauté sur le même programme.
- Pourquoi les gens arrêtent (études d'abandon) : d'abord le manque de temps, puis la motivation, l'absence de résultats, la blessure.

## Le besoin auquel NÉA répond

« Les programmes ne s'adaptent pas à ta vie : tu rates une semaine, tu es fatigué, tu n'as pas la salle, et tu abandonnes. »
NÉA a déjà les réponses (séance à la maison, ressenti du jour, gels de série, coach, charges qui progressent) : il faut les relier
au vécu de la personne **pendant** l'onboarding.

## Fait dans l'app

1. **Le déclic** (discussion) : « Qu'est-ce qui t'a fait arrêter, les fois d'avant ? » (6 réponses). NÉA répond « Ce n'est pas un
   manque de volonté » + ce qui change pour chaque frein (uniquement des fonctions réelles, `lib/declic.ts`). Rappel dans le résumé.
2. **« Cette fois, c'est différent »** sur l'écran prêt : chaque frein barré et sa solution, juste avant le paywall.
3. **Ton défi NÉA** : profil (Force, Affûtage, Énergie…), semaines / séances / heures tirées du vrai plan, bouton **Défier un ami**
   (partage du défi + lien App Store) : la boucle virale.

## À faire ensuite (propositions)

- **Carte image à partager** (style Spotify Wrapped) : nécessite `react-native-view-shot` → prochain build.
- **Parrainage** : 1 mois de NÉA Plus offert aux deux (codes d'offre Apple + RevenueCat) ; à valider côté prix.
- **Récap hebdo partageable** (séances, série, carte gagnée) chaque dimanche.
- **Contenu en masse** : une vidéo par exercice avec Axel (50 illustrations prêtes), défis 8 semaines filmés, créateurs payés au mois.
- Réactiver Amis / Équipes quand la Ligue est validée : « à deux, on lâche moins ».
