# Vidéos NÉA avec Google Flow (Veo)

Objectif : des vidéos courtes (8 s par clip, 1 à 3 clips par vidéo) où un personnage NÉA parle en français, à publier en plus des carrousels.
Tu génères les clips dans **Google Flow** ; Claude écrit les scripts et fait le montage (sous-titres, CTA, assemblage 9:16).

## 1. La méthode dans Flow

1. **Crée un projet « NÉA »** dans Flow et règle le format en **vertical 9:16**.
2. **Ajoute tes références une seule fois** (les « ingrédients ») : l'icône du robot NÉA en grand (fond noir, bandeau orange, casque audio, yeux LED orange), et la planche de Rox si tu l'utilises.
3. **Choisis le mode selon le besoin :**
   - **Ingrédients → vidéo** : le personnage dans une nouvelle scène, à partir de tes références. C'est le mode par défaut.
   - **Image → vidéo** (première image fixée) : quand tu veux un cadrage précis. Génère d'abord l'image 9:16 (Gemini ou GPT Astra), puis anime-la.
   - **Prolonger / Scenebuilder** : pour enchaîner un 2e clip qui reprend la fin du 1er.
4. **Génère 2 à 4 versions par prompt** et garde la meilleure. Vérifie : même personnage du début à la fin, voix en français, lèvres ou LED synchronisées, aucune écriture déformée.
5. **Télécharge les clips** (meilleure qualité disponible) et envoie-les à Claude pour le montage.

Les noms des modes et les quotas changent souvent dans Flow : fie-toi à ce que tu vois dans l'interface.

## 2. Les règles d'or

- **Une réplique de 15 mots maximum** par clip de 8 secondes.
- **Toujours la même description de voix**, mot pour mot, pour que le personnage sonne pareil d'une vidéo à l'autre (elle variera quand même un peu).
- **Aucun texte dans la vidéo** : les IA déforment les lettres. Les sous-titres et « NÉA, lien en bio » sont ajoutés au montage.
- **Plans simples** : caméra fixe ou mouvement lent, peu d'actions par clip. Si le personnage se déforme, simplifie l'action.
- **Pas de vraie marque** à l'écran (pas de Red Bull, Nike…) et pas de vraie personne reconnaissable.
- **Label « Contenu généré par IA »** activé sur TikTok à chaque publication.

## 3. Fiche du robot NÉA (à coller dans chaque prompt)

```
Le robot coach de l'app NÉA : petite tête-robot ronde et brillante, noir laqué, deux yeux en LED orange en forme d'arcs souriants, bandeau de sport orange en tissu éponge sur le front, gros casque audio noir avec reflets orange, halo de lumière orange autour de lui. Corps de robot noir mat aux formes arrondies. Style 3D d'animation, éclairage doux. Voix masculine chaleureuse et un peu taquine, en français, débit rapide de coach.
```

Prénom du coach : vérifier dans l'app (Axel sur le site vitrine) et l'utiliser partout.

## 4. Modèle de prompt

```
[FICHE ROBOT]
Scène : [LIEU], [ACTION en une phrase].
Il regarde la caméra et dit en français, [TON] : « [RÉPLIQUE, 15 mots max] ».
Caméra : [plan fixe / léger zoom avant / contre-plongée].
Son : [ambiance]. Vidéo verticale 9:16, aucun texte à l'écran, aucun logo de marque.
```

## 5. Six vidéos prêtes à générer

**1. « Pose ce téléphone »** (le test le plus simple)
```
[FICHE ROBOT]
Scène : le robot est posé sur la table de nuit d'une chambre sombre, à côté d'un téléphone allumé. Ses yeux LED se plissent, l'air suspicieux.
Il regarde la caméra et dit en français, ton faussement sévère : « Ça fait vingt minutes que tu scrolles. Ta séance dure quinze minutes. »
Caméra : plan fixe, léger zoom avant à la fin.
Son : silence de chambre, petit bip robotique. Vidéo verticale 9:16, aucun texte à l'écran, aucun logo de marque.
```

**2. « Énergie à zéro »** (présente la fonction phare)
```
[FICHE ROBOT]
Scène : le robot flotte devant une jeune femme affalée sur un canapé en jogging, plaid sur les épaules. Ses yeux LED passent de l'arc souriant à un petit niveau de batterie.
Il dit en français, ton compréhensif puis motivant : « Énergie à deux sur cinq ? OK. Je te fais une séance plus douce. »
Caméra : plan fixe, cadrage taille.
Son : télé lointaine, bip doux. Vidéo verticale 9:16, aucun texte à l'écran, aucun logo de marque.
```

**3. « Le coach géant »** (format personnage géant)
```
[FICHE ROBOT] Le robot fait la taille d'un immeuble.
Scène : dans une rue de Montréal en automne, le robot géant se penche au-dessus des toits vers une passante qui mange des frites. Elle lève la tête, bouche bée.
Il dit en français, ton taquin : « Hé ! Trois semaines sans séance. On en parle ? »
Caméra : contre-plongée filmée au téléphone, légèrement tremblée.
Son : rue animée, klaxon lointain. Vidéo verticale 9:16, aucun texte à l'écran, aucun logo de marque.
```

**4. « Encore une série »**
```
[FICHE ROBOT]
Scène : dans une salle de sport, le robot flotte à côté d'une jeune femme qui fait des squats avec un kettlebell. Ses yeux LED clignotent au rythme des répétitions.
Il dit en français, d'abord calme puis en criant de joie : « Encore une… encore une… ALLEZ, LA DERNIÈRE ! »
Caméra : plan fixe, petit zoom avant rapide au moment du cri.
Son : musique de salle étouffée, poids posés au sol. Vidéo verticale 9:16, aucun texte à l'écran, aucun logo de marque.
```

**5. « Fier de toi »**
```
[FICHE ROBOT]
Scène : le soir, le robot est posé sur un banc de vestiaire à côté d'un sac de sport. Ses yeux LED forment deux arcs très souriants.
Il dit en français, ton fier mais retenu : « Trois séances cette semaine. Je dis rien… mais je suis fier de toi. »
Caméra : plan fixe, lumière chaude.
Son : vestiaire calme, porte de casier. Vidéo verticale 9:16, aucun texte à l'écran, aucun logo de marque.
```

**6. Halloween (à publier le 30 ou le 31)**
```
[FICHE ROBOT] Il porte un costume de citrouille orange par-dessus son corps, bandeau de sport toujours sur le front.
Scène : il avance au ralenti dans un couloir de salle de sport décoré de toiles d'araignée et de citrouilles, comme un défilé de costume.
Il s'arrête face caméra et dit en français, ton fier : « Mon costume cette année ? Celui qui y est allé quand même. »
Caméra : travelling arrière lent, puis plan fixe.
Son : ambiance Halloween légère (le son tendance « Ramalama » sera ajouté dans TikTok). Vidéo verticale 9:16, aucun texte à l'écran, aucun logo de marque.
```

## 6. Après la génération

1. Envoie les clips à Claude (ou dépose-les dans `slideshow/videos/` si on automatise plus tard).
2. Montage : sous-titres mot à mot, texte d'accroche dans les 2 premières secondes, carton final « NÉA · Ton coach. Ton rythme. · Lien en bio », assemblage en 1080×1920.
3. Dans TikTok : son tendance, label « Contenu généré par IA », légende avec « Image virtuelle ».

## 7. Budget

Chaque clip de 8 s consomme des crédits Flow (selon ton abonnement Google AI). Compter 2 à 4 essais par clip réussi. Commencer par 3 vidéos test (1, 2 et 6) avant de produire en série, et comparer leurs vues à celles des carrousels.
