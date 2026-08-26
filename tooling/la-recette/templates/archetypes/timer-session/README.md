# Archétype `timer-session` — minuteur / séance

> **Le moment magique** : l'utilisateur lance une séance (focus, méditation, respiration,
> repos entre séries…), le temps défile en grand, et à la fin **la séance s'ajoute à son
> historique**. Il voit ses séances s'accumuler — la preuve de son effort.
>
> **Pour quelles idées** : Pomodoro / focus, méditation, respiration guidée, minuteur de
> sport (HIIT, gainage, repos), temps de lecture, brossage/soin chronométré, cuisine.

## Ce que fournit ce squelette

- **2 écrans** : timer (presets, compte à rebours, start/pause/resume/reset), historique
  (liste des séances terminées, suppression).
- **`use-timer.ts`** : un minuteur **fiable** basé sur l'heure de fin (juste même après un
  passage en arrière-plan) — le piège classique d'un timer RN est traité ici.
- **Couche données** : `sessions` + RLS, repository, hooks. La séance est enregistrée
  automatiquement à la fin.

## Où va chaque fichier (clone → adapte)

| Fichier du template | Destination |
|---|---|
| `db/001_sessions.sql` | `db/` (migration, phase Backend) |
| `feature/*` | `src/features/sessions/` |
| `app/(tabs)/timer.tsx` | `src/app/(tabs)/timer.tsx` |
| `app/(tabs)/history.tsx` | `src/app/(tabs)/history.tsx` |

## Les points d'adaptation

1. **Les presets** (`PRESETS` dans `timer-view.tsx`) : mets les durées de ton app, ou
   remplace par une **saisie libre** / une molette. Pour un minuteur qui **compte à
   rebours par cycles** (HIIT), enchaîne plusieurs `start()`.
2. **Compte à rebours vs chronomètre** : ce squelette est un **compte à rebours**. Pour un
   chronomètre (compte vers le haut), inverse l'affichage et passe la durée écoulée à
   `onComplete` quand l'utilisateur arrête.
3. **Écran allumé** : pendant une séance, garde l'écran allumé avec `expo-keep-awake`
   (`useKeepAwake()` monté conditionnellement quand `status === 'running'`).
4. **Son / vibration de fin** : ici on vibre (`haptics.tap()`). Ajoute un son
   (`expo-audio`) si pertinent. Une **notification** si l'app est en arrière-plan est un
   plus (le JS peut être gelé — la notif locale programmée est plus fiable pour alerter).
5. **Clés i18n** à ajouter dans `fr.ts` **et** `en.ts` :
   ```ts
   timer: {
     title: 'Séance', minutes: '{{count}} min', start: 'Démarrer', pause: 'Pause',
     resume: 'Reprendre', reset: 'Réinitialiser', done: 'Séance terminée',
   },
   history: {
     title: 'Historique', session: 'Séance', empty: 'Aucune séance encore. Lance ton premier minuteur.',
     deleteConfirm: 'Supprimer cette séance ?',
   },
   ```

## Critères d'acceptation (le smoke-test à cocher en `/preview`)

- [ ] L'app **boote** sur le timer (pas d'écran blanc), un preset est sélectionné.
- [ ] Je **démarre** → le compte à rebours défile de façon fluide et régulière.
- [ ] **Pause** puis **Reprendre** repart au bon endroit (pas de saut de temps).
- [ ] À la fin (ou testé avec un preset court), l'app affiche « terminé » et la séance
      **apparaît dans l'historique** — le moment magique fonctionne.
- [ ] L'historique **persiste** après kill + relance de l'app.
- [ ] Passer l'app en arrière-plan pendant la séance puis revenir : le temps affiché est
      **cohérent** (pas figé/faux) grâce au calcul par heure de fin.
