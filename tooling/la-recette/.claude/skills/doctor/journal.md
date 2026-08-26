# Journal des pannes — La Recette (doctor)

> Le carnet de bord des bugs **inédits** (absents de `SKILL.md`) rencontrés chez de vrais clients.
> À chaque bug nouveau résolu — ou escaladé au support — Claude **ajoute une entrée ici**. C'est ce qui
> enrichit la base de pannes à chaque client : ce qui a coincé une fois ne doit plus jamais coincer.

## Comment noter une entrée (Claude, lis-moi)

- **N'écris ici que du NOUVEAU.** Si le symptôme est déjà couvert dans `SKILL.md`, n'ajoute rien — applique
  le fix existant. Ce journal, c'est pour ce que la base ne connaissait pas encore.
- **Ajoute en HAUT** (le plus récent en premier), juste sous cette section, en copiant le gabarit ci-dessous.
- **Zéro secret** dans une entrée : jamais de token, clé, mot de passe, ni de données perso du client
  (masque-les, ex. `sk-***`).
- **Sois concret et actionnable** : le prochain Claude doit pouvoir appliquer le fix sans deviner.
- Quand une entrée se répète chez plusieurs clients, elle est mûre pour **remonter dans `SKILL.md`** comme
  panne officielle (signale-le au moment de la noter : « candidate à promouvoir dans SKILL.md »).

### Gabarit à copier

```
## [AAAA-MM-JJ] Titre court du symptôme

- **Symptôme (ce qu'on voit) :** …
- **Contexte :** <OS Mac/Windows · SDK Expo · service concerné · à quelle étape>
- **Cause réelle :** … (en une phrase simple)
- **Fix qui a marché :** … (les étapes exactes, actionnables)
- **Self-check :** comment on a prouvé que c'était réparé
- **Statut :** résolu ✅ / escaladé au support ⛔ (rapport envoyé)
- **À promouvoir dans SKILL.md ?** oui/non (si déjà vu ≥2 fois → oui)
```

---

<!-- Les nouvelles entrées vont ICI, la plus récente en premier. -->

## [2026-08-07] « Exception in HostFunction: <unknown> » au lancement en Expo Go (Reanimated 4 / worklets)

- **Symptôme (ce qu'on voit) :** au démarrage sur l'iPhone via **Expo Go**, écran rouge / crash `ERROR [Error: Exception in HostFunction: <unknown>]`. La stacktrace part de `installTurboModule (<native>)` → `react-native-worklets/.../NativeWorklets.native.ts` → `react-native-reanimated/src/index.ts` → un composant de l'app qui importe Reanimated (ici `src/features/<feature>/<composant>.tsx`). Souvent accompagné d'un `WARN Route "./…" is missing the required default export` sur l'écran concerné (symptôme collatéral : le module a planté à l'import, donc son `export default` n'est jamais enregistré — PAS un vrai bug d'export).
- **Contexte :** Windows · Expo SDK **54** (React Native 0.81, Reanimated ~4.1, react-native-worklets 0.8.3) · étape `/preview` (Expo Go). `expo install --check` dit « up to date », `newArchEnabled: true`, babel `react-native-worklets/plugin` présent et en dernier — **tout est config-correct**, et `tsc`/`expo export` sont verts. Le crash est **purement runtime en Expo Go**.
- **Cause réelle :** Reanimated 4 initialise le **TurboModule natif worklets** dès l'import ; ce module natif **n'est pas chargé/compatible dans l'app Expo Go** (mismatch JS worklets ↔ natif embarqué dans le binaire Expo Go). Donc tout écran qui importe Reanimated crashe au chargement. (Ça marcherait sur un vrai build EAS où le natif est compilé — mais on veut que ça tourne aussi en Expo Go pour le smoke-test.)
- **Fix qui a marché :** remplacer l'usage de Reanimated par l'**API `Animated` intégrée de React Native** (pilote natif : `Animated.Value` + `Animated.loop`/`timing` + `interpolate`, `useNativeDriver: true`), qui n'a **aucune dépendance worklets**. Concrètement : `grep -rn reanimated src/` pour trouver les imports (ici un seul, `src/features/<feature>/<composant>.tsx`), réécrire l'animation en `Animated` RN, retirer l'import `react-native-reanimated`. Le plugin babel worklets peut rester (inoffensif s'il ne reste plus de worklet). Aucune dépendance à toucher.
- **Self-check :** `tsc --noEmit` vert + `grep -rn reanimated src/` = 0 hit ; puis reload dans Expo Go → l'app boote sans l'exception, l'animation tourne. Le warning « missing default export » disparaît (il était collatéral).
- **Statut :** résolu ✅
- **À promouvoir dans SKILL.md ?** oui si revu ≥2 fois (candidate à promouvoir : « A10 — Reanimated/worklets crash en Expo Go » ; fix par défaut = préférer l'API `Animated` RN pour les animations simples des apps destinées au smoke-test Expo Go).
