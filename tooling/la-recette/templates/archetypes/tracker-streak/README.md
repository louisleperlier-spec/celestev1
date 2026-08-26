# Archétype `tracker-streak` — suivi / streak / habitude

> **Le moment magique** : l'utilisateur coche « fait aujourd'hui » et voit sa **série
> (streak) grandir**. Ce petit compteur de jours consécutifs est ce qui accroche et fait
> revenir. Cocher est instantané ; la série se met à jour sous ses yeux.
>
> **Pour quelles idées** : suivi d'habitude (sport, lecture, méditation, eau, prière,
> arrêt du tabac), routine quotidienne, check-in d'humeur, objectif « chaque jour »,
> tracker de symptôme… Tout ce qui se mesure **une fois par jour**.

## Ce que fournit ce squelette

- **2 écrans** : liste (coche du jour + streak par ligne), détail (streak en grand,
  7 derniers jours, coche/décoche).
- **Couche données** : `habits` + `habit_entries` (une coche/jour, contrainte UNIQUE),
  repository, hooks. La coche du jour est **optimiste** (le streak bouge immédiatement).
- **`streak.ts`** : calculs purs (clé de jour locale + streak), isolés et testables.

## Où va chaque fichier (clone → adapte)

| Fichier du template | Destination |
|---|---|
| `db/001_habits.sql` | `db/` (migration, phase Backend) |
| `feature/*` | `src/features/habits/` |
| `app/(tabs)/habits.tsx` | `src/app/(tabs)/habits.tsx` |
| `app/habit/[id].tsx` | `src/app/habit/[id].tsx` |

## Les points d'adaptation

1. **Renomme** `Habit` → ton entité si pertinent (`Goal`, `Ritual`, `CheckIn`…) et adapte
   les clés de cache / routes en conséquence.
2. **Périodicité** : ce squelette compte **une coche par jour**. Pour « plusieurs fois par
   jour » (ex. verres d'eau), remplace la contrainte UNIQUE(habit_id, day) par un compteur
   `count` sur `habit_entries` et adapte `computeStreak`. Pour « par semaine », change la
   granularité de `dayKey`.
3. **Enrichis l'habitude** : couleur, icône (SF Symbol), objectif/jour, rappel (notif) —
   ajoute les colonnes dans `db/001_habits.sql` et les champs dans `types.ts`.
4. **Rappels** : un tracker gagne beaucoup avec une **notification** quotidienne
   (`expo-notifications`) — à câbler dans la feature (hors de ce squelette de base).
5. **Clés i18n** à ajouter dans `fr.ts` **et** `en.ts` :
   ```ts
   habits: {
     title: 'Mes habitudes', new: 'Nouvelle habitude', namePlaceholder: 'Ex. Lire 10 min',
     empty: 'Aucune habitude. Touche + pour en créer une.',
     streakLabel: '{{days}} jours de suite', noStreak: 'Pas encore de série — commence aujourd’hui',
     checkToday: 'Marquer fait aujourd’hui', uncheckToday: 'Annuler pour aujourd’hui',
     deleteConfirm: 'Supprimer cette habitude ?', notFound: 'Introuvable',
   },
   ```
   (En anglais, `streakLabel: '{{days}}-day streak'`.)

## Critères d'acceptation (le smoke-test à cocher en `/preview`)

- [ ] L'app **boote** sur la liste vide (pas d'écran blanc).
- [ ] Je **crée** une habitude → elle apparaît, streak à 0.
- [ ] Je **coche aujourd'hui** → la grosse coche se remplit et le **streak passe à 1
      instantanément** (le moment magique).
- [ ] Je **rouvre l'app** (kill + relance) → la coche et le streak sont **conservés**.
- [ ] Je **décoche** → le streak redescend proprement (pas de valeur figée fausse).
- [ ] Le **détail** montre les 7 derniers jours cohérents avec mes coches.
