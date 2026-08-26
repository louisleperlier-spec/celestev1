---
description: "Mon app plante / bug quand…" — Claude lit le code, reproduit, corrige et redéploie.
argument-hint: "[décris le bug: ce que tu fais, ce qui se passe]"
---

# /fix — réparer un bug

La personne décrit un problème en langage humain (« ça plante quand j'appuie sur le bouton bleu », « mes
recettes disparaissent »). Ton job : **comprendre, reproduire, corriger toi-même, redéployer** — sans jamais
lui montrer une stacktrace ni la faire coder.

Description du bug : **$ARGUMENTS** (si vide : demande, en une question simple, *ce qu'elle fait* et *ce qui
se passe à la place de ce qu'elle attend*).

## 0. Constitution
Applique **recette-core**. Si elle est frustrée (« ça marche toujours pas !!! »), **rassure d'abord**,
calme, PUIS répare. Jamais de ton robotique face à quelqu'un d'énervé. Une seule prochaine action à la fois.

## 1. Comprendre le symptôme
Reformule le bug pour confirmer. Fais préciser le strict nécessaire :
- **Où** (quel écran, quel bouton) ?
- **Quand** (à chaque fois, ou parfois ? depuis un changement récent ?) ?
- **Sur quoi** (Expo Go, TestFlight, le site ?) — un « bug » Expo Go peut être normal (paywall, natif).
- Si possible, une **capture d'écran** ou le message affiché (elle peut le coller).

## 2. Chercher la cause dans le code (tu lis, elle ne fait rien)
- Ouvre le code de **son** app et localise la zone concernée (écran, hook, service, edge function).
- **Consulte d'abord la base de pannes** (skill **doctor**) : beaucoup de symptômes ont déjà un diagnostic →
  fix connu. Exemples de fiches **réelles** : SDK Expo ≠ Expo Go (A1), paywall qui crashe en Expo Go (A2),
  « je peux ni scroller ni swiper » / scrollables imbriqués (A4), RLS récursif (C1), « network request
  failed » — **vérifier d'abord la pause du backend, pas juste "transitoire"** (C2), token mal scopé (B1).
  Ça évite de réfléchir dans le vide.
- **Le bug n'est pas une erreur rouge mais un mauvais comportement** (« mes recettes disparaissent », « le
  total est faux », « ça ne se sauvegarde pas », « le parcours ne se boucle pas ») ? → c'est du **cœur
  métier cassé**, pas de la plomberie : va à la fiche **G1** du doctor (diagnostic **fonctionnel** : relire
  l'APP-SPEC, tracer le parcours de bout en bout, isoler modèle de données / état / parcours).
- **Un outil de base manque** (« 'gh' / 'node' / 'git' n'est pas reconnu ») ? → fiche **F2** (installer
  selon l'OS) — fréquent au tout premier pas sur une machine neuve.
- Reproduis mentalement (ou réellement en `/preview`) le chemin qui casse. Consulte les logs pertinents
  (console Metro, logs de l'Edge Function côté Supabase) si besoin.

## 3. Corriger + self-verify
- Applique le **plus petit correctif** qui règle vraiment la cause (pas un pansement qui masque).
- **Vérifie** : `npx tsc --noEmit` + `npx expo export --platform ios` passent. Si le bug touche le backend,
  teste l'appel concerné.
- Si tu ne reproduis pas / ne trouves pas : **ne tourne pas en boucle**. Respecte les plafonds
  (recette-core §4) : **2 tentatives max par fix**, **~3 hypothèses distinctes max** sur le même bug, et
  **aucun build EAS de diagnostic sans un "oui" explicite** (ça coûte son argent). Au-delà, explique
  simplement où tu en es et propose LA prochaine action (ex. « je te montre en `/preview` pour qu'on voie le
  bug ensemble », ou la **passerelle support concrète** — Discord / email / fichier `SUPPORT-REQUEST.md`,
  doctor → « Quand vraiment bloqué »). Jamais de cul-de-sac ; au pire, une **version réduite assumée** plutôt
  qu'un blocage.

## 4. Redéployer ce qu'il faut
- Bug **dans l'app** testée en Expo Go → un `/preview` suffit pour qu'elle revoie (hot reload).
- Bug **backend/site** → redéploie (`/deploy` : git + Vercel + Supabase functions/migrations).
- Bug qui n'existe **que sur le build App Store** (natif) → il faudra un nouveau build : enchaîne sur
  `/update` en l'expliquant.

## 5. Confirmer que c'est réglé
Demande-lui de **revérifier** le scénario exact qui cassait. Ne clôture pas sur ta seule conviction :
« Refais l'action qui plantait — ça marche maintenant ? » Note tout **bug inédit** résolu dans le journal du
skill **doctor** (`journal.md`) pour enrichir la base — c'est ce qui rend La Recette meilleure à chaque fois.
