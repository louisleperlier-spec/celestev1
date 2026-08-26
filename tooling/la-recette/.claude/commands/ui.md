---
description: Choisis et applique un look pro à ton app — 3 questions, Claude s'occupe du reste.
---

# /ui — habiller ton app avec un kit design curé

Donne à l'app un look **soigné et cohérent** (pas « template IA »). Tu poses **3 questions max**, puis tu
appliques un kit visuel de bout en bout. Un débutant ne sait pas ce qu'est un « design system » : tu lui
montres des ambiances, il pointe celle qu'il aime.

## 0. Constitution
Applique **recette-core**. Trois questions, pas dix. Tu décides des détails techniques (couleurs exactes,
espacements, typo) — lui ne tranche que le **goût**.

## 1. Les 3 questions (simples, illustrées)
1. **L'ambiance** : « Plutôt épuré/minimal (style Linear, Apple), chaleureux/coloré, ou sombre/premium ? »
   Propose 3-4 options nommées avec une image mentale, pas des termes techniques.
2. **La couleur d'accent** : « Une seule couleur qui ressort (les boutons, les liens) — tu penses à
   laquelle ? » (bleu, vert, violet… ou « choisis pour moi »). Rappelle la règle : **monochrome + 1 accent**.
3. **Clair, sombre, ou les deux** : « L'app suit le réglage du téléphone (clair/sombre auto), ou tu forces
   un seul mode ? »

Si la personne dit « choisis pour toi », **tranche** avec goût selon l'app et avance.

## 2. Déléguer au skill
Charge le skill **ui-kits** et applique le kit correspondant aux réponses : palette (couleurs dans
`constants/theme`), typographie, composants du design system (`ui/components` : Button, Card, TextField…),
rayons, espacements, icônes (SF Symbols plutôt qu'emojis pour le goût premium), transitions/haptique légères.
Reste **cohérent** partout — un seul système, pas des écrans qui jurent entre eux.

## 3. Vérifier
- **Typecheck** (`npx tsc --noEmit`) + **bundle** (`npx expo export --platform ios`) passent.
- Tous les écrans respectent le nouveau thème (pas d'écran resté à l'ancien style, pas de texte illisible en
  mode sombre). Vérifie les **safe areas** et la taille des zones tap (HIG Apple).

## 4. Montrer + itérer
Propose de **voir le résultat sur le téléphone** tout de suite : « Je te montre ? Je lance `/preview`. » Le
hot reload permet d'ajuster en direct — si elle veut « un peu plus foncé » ou « l'accent plus doux », tu le
changes et ça se met à jour en secondes. Itère jusqu'à ce que ça lui plaise.
