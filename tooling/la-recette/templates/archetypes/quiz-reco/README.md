# Archétype `quiz-reco` — questionnaire → reco personnalisée

> **Le moment magique** : l'utilisateur répond à quelques questions simples, une par écran,
> avec une barre de progression qui avance — et à la fin il reçoit **SA** reco, faite pour
> lui. Ce petit effet « c'est personnalisé pour moi » est ce qui engage dès la première
> minute. La reco est **persistée** : il la retrouve à chaque ouverture.
>
> **Pour quelles idées** : onboarding qui oriente (quel plan / quelle routine / quel profil),
> quiz de personnalité, « trouve le produit qu'il te faut », diagnostic de départ, matching
> (régime, entraînement, style d'apprentissage…). Complémentaire du skill **`app-onboarding`**
> (qui, lui, cadre la conversion) : ici on construit le **moteur de questions → résultat**.

## Ce que fournit ce squelette

- **2 écrans** : le questionnaire **pas-à-pas** (une question/écran + **barre de progression**
  + retour arrière) et l'écran **résultat** (la reco, avec « recommencer »).
- **Calcul de reco PUR et testable** (`reco.ts`) : additionne les poids des choix, renvoie la
  reco gagnante — déterministe, sans réseau, isolé pour être testé.
- **Contenu isolé** (`questions.ts`) : questions, choix, poids et recos = de la donnée pure,
  le seul fichier à réécrire pour changer d'idée.
- **Persistance** : table `quiz_results` + RLS, repository, hooks React Query. Le résultat
  survit au kill/relance et au changement de compte.

## Où va chaque fichier (clone → adapte)

| Fichier du template | Destination dans l'app scaffoldée |
|---|---|
| `db/001_quiz_results.sql` | `db/` (migration appliquée par la phase Backend) |
| `feature/*` | `src/features/quiz/` |
| `app/(tabs)/quiz.tsx` | `src/app/(tabs)/quiz.tsx` (un onglet) |
| `app/result.tsx` | `src/app/result.tsx` |

## Les points d'adaptation (à faire à chaque idée)

1. **Réécris `questions.ts`** — c'est 90 % du boulot :
   - 3 à 6 **questions** (au-delà, l'utilisateur décroche), chacune avec ses **choix** ;
   - les **poids** de chaque choix vers les recos (`weights: { calme: 2, energie: 1 }`) ;
   - la liste des **recos** (`OUTCOMES`). Le **premier** sert de défaut en cas d'égalité.
   - ⚠️ L'`id` d'une reco est **persisté en base** : ne le change pas après le lancement
     (sinon les résultats déjà gardés ne pointent plus sur rien).
2. **Le résultat qui « fait quelque chose »** : dans `result-view.tsx`, le bouton d'action
   peut mener au **contenu recommandé** (une routine, un pack, un plan) au lieu de juste
   l'afficher. C'est ce qui transforme la reco en valeur réelle.
3. **Pré-auth (onboarding avant compte)** : si le quiz tourne **avant** l'inscription, garde
   le résultat en **local** (`AsyncStorage`) puis pousse-le en base au premier login — le
   calcul (`reco.ts`) et le flux (`use-quiz.ts`) ne changent pas, seul le repository change.
4. **i18n FR *et* EN** : chaque texte passe par `t('...')` (les `promptKey` / `labelKey` /
   `titleKey` sont des clés i18n, pas des libellés). Ajoute-les dans
   `src/lib/i18n/locales/fr.ts` **et** `en.ts` — mêmes clés des deux côtés :
   ```ts
   common: { back: 'Retour' },
   quiz: {
     progress: 'Question {{current}}/{{total}}',
     doneTitle: 'Tu as déjà ton résultat', doneSubtitle: 'Revois ta reco ou refais le test.',
     seeResult: 'Voir mon résultat', retake: 'Recommencer', start: 'Commencer',
     resultKicker: 'Ta reco', continue: 'Continuer', noResult: 'Aucun résultat pour l’instant.',
     q: {
       level: { prompt: 'Où en es-tu ?', new: 'Je débute', some: 'J’ai des bases', expert: 'Je suis à l’aise' },
       time: { prompt: 'Combien de temps par jour ?', low: '5 min', medium: '15 min', high: '30 min et +' },
       goal: { prompt: 'Ton objectif ?', discover: 'Découvrir', progress: 'Progresser', master: 'Aller au bout' },
     },
     reco: {
       starter: { title: 'Parcours Découverte', desc: 'On y va en douceur, pas à pas.' },
       builder: { title: 'Parcours Progression', desc: 'Un rythme régulier pour avancer.' },
       pro: { title: 'Parcours Intensif', desc: 'Du costaud, pour aller loin.' },
     },
   },
   ```
5. **Branche l'onglet** dans `src/app/(tabs)/_layout.tsx` (nom + icône SF Symbol) et déclare
   la route `result` dans `src/app/_layout.tsx` (écran plein, pas besoin de modal).

## Critères d'acceptation (le smoke-test à cocher en `/preview`)

- [ ] L'app **boote** sur la première question, barre de progression à ~0 (pas d'écran blanc).
- [ ] Je réponds : chaque choix **avance** d'une question et la **barre progresse**.
- [ ] Le **retour arrière** revient à la question précédente sans perdre mes réponses.
- [ ] À la dernière réponse → l'écran **résultat** affiche **une** reco cohérente avec mes choix.
- [ ] Je **rouvre l'app** (kill + relance) → mon résultat est **toujours là** (il a persisté).
- [ ] « **Recommencer** » repart de la première question et peut donner une **autre** reco.
- [ ] Un **autre compte** ne voit pas mon résultat (RLS — testable en `/preview` avec 2 comptes).
