# Archétype `realtime-chat` — messagerie temps réel

> **Le moment magique** : deux utilisateurs se parlent et le message de l'autre **apparaît
> tout seul**, en direct, sans rafraîchir. Mon message part instantanément (envoi optimiste)
> et se confirme sans accroc. C'est le « ça marche vraiment » d'une app sociale.
>
> **Pour quelles idées** : messagerie 1:1, chat de support, discussion entre membres, DM
> d'une communauté, coach ↔ élève, acheteur ↔ vendeur… Tout ce qui est « des humains qui
> s'écrivent en direct ».

## Ce que fournit ce squelette

- **2 écrans** : liste des conversations (autre participant + aperçu du dernier message) et
  le **fil** (bulles + composer, envoi optimiste, **modération**).
- **Temps réel** : souscription **Supabase Realtime** (`postgres_changes`) sur `messages` —
  chaque nouveau message arrive tout seul. **100 % compatible Expo Go** (c'est un WebSocket,
  aucun module natif).
- **Couche données** : `conversations` + `conversation_participants` + `messages`, **RLS par
  participant** (via une fonction `is_participant` SECURITY DEFINER anti-récursion), RPC
  `start_conversation` (trouve-ou-crée un 1:1 par email) et `list_my_conversations`.
- **Modération intégrée** (Apple 1.2, voir la note) : signaler un message (`reports`) et
  bloquer un utilisateur (`blocks` → ses messages disparaissent via la RLS de lecture).

## Où va chaque fichier (clone → adapte)

| Fichier du template | Destination |
|---|---|
| `db/001_chat.sql` | `db/` (migration, phase Backend) |
| `feature/*` | `src/features/chat/` |
| `app/(tabs)/chats.tsx` | `src/app/(tabs)/chats.tsx` |
| `app/chat/[id].tsx` | `src/app/chat/[id].tsx` |

## ⚠️ NOTE conformité Apple 1.2 (contenu entre utilisateurs) — BLOQUANT

Dès qu'une app laisse des utilisateurs **s'échanger du contenu**, Apple (guideline **1.2 —
User-Generated Content**) exige, sinon **rejet** :

1. un moyen de **signaler** un contenu ou un utilisateur (fourni : appui long sur un message
   → *Signaler*) ;
2. un moyen de **bloquer** un utilisateur abusif (fourni : appui long → *Bloquer*, ses
   messages sont masqués par la RLS) ;
3. une **modération** : agir sur le contenu signalé (revoir la table `reports`, pouvoir
   supprimer/suspendre) **sous ~24 h** ;
4. des **CGU tolérance zéro** envers le contenu répréhensible + un email de contact.

Le squelette pose (1) et (2) et la table `reports`. **Toi, tu dois encore** : brancher le
traitement des signalements (dashboard/alerte + suppression), écrire les CGU, et le vérifier
à l'audit. **→ Reporte-le à la Definition-of-Done du build** (case « UGC : report + block +
modération + CGU » à cocher AVANT toute soumission). Ne soumets jamais un chat sans ça.

## Les points d'adaptation

1. **Identité affichée** : ici l'autre participant est montré par son **email**. Si tu as un
   profil (pseudo, avatar), remplace `other_email` dans la RPC `list_my_conversations` et le
   header du fil par ces champs (table `profiles`).
2. **Comment on démarre une conversation** : ici par **email** (RPC `start_conversation`).
   Adapte à ton app (annuaire, lien d'invitation, match…). Pour du **groupe** (>2), retire la
   condition « exactement 2 participants » et ajoute plusieurs lignes `participants`.
3. **Contenu riche** : pour envoyer une image, ajoute une colonne à `messages` (chemin dans un
   bucket privé) et adapte la bulle — mêmes précautions que l'archétype média (URL signée,
   permission, jamais l'image brute en base).
4. **Realtime — à activer** : la migration fait `alter publication supabase_realtime add table
   messages`. Vérifie que **Realtime est activé** sur le projet (Dashboard → Database →
   Replication) — sinon le fil ne reçoit rien en direct (il marchera quand même au refresh).
5. **i18n FR *et* EN** (mêmes clés des deux côtés) :
   ```ts
   common: { back: 'Retour', cancel: 'Annuler', loadError: 'Impossible de charger', retry: 'Réessayer' },
   chat: {
     title: 'Messages', empty: 'Aucune conversation. Touche ✏️ pour écrire à quelqu’un.',
     conversation: 'Conversation', unknownUser: 'Utilisateur', noMessages: 'Pas encore de message',
     emptyThread: 'Écris le premier message.', composerPlaceholder: 'Ton message…', send: 'Envoyer',
     sendFailed: 'Non envoyé — toucher pour réessayer',
     newTitle: 'Nouvelle conversation', newSubtitle: 'Email de la personne à contacter',
     moderateTitle: 'Ce message', report: 'Signaler', block: 'Bloquer cet utilisateur',
     reportedTitle: 'Merci', reportedBody: 'Le message a été signalé à la modération.',
     errorTitle: 'Impossible',
     error: { user_not_found: 'Aucun compte avec cet email.', cannot_message_self: 'C’est toi-même !',
       generic: 'Une erreur est survenue.' },
   },
   ```
6. **Branche l'onglet** dans `src/app/(tabs)/_layout.tsx` (nom + icône SF Symbol
   `bubble.left.and.bubble.right`) et déclare la route `chat/[id]` dans `src/app/_layout.tsx`.

## Critères d'acceptation (le smoke-test à cocher en `/preview`, à 2 comptes)

- [ ] L'app **boote** sur la liste vide (pas d'écran blanc).
- [ ] Depuis le compte A, « nouvelle conversation » vers l'email de B → le fil s'ouvre.
- [ ] J'envoie un message : il apparaît **instantanément** chez A (bulle à droite).
- [ ] Sur le compte B (2e appareil/simulateur), le message **arrive tout seul**, sans refresh
      (le temps réel fonctionne pour de vrai).
- [ ] Le fil **persiste** après kill + relance (l'historique se recharge).
- [ ] **Hors-ligne** : l'envoi montre « non envoyé », toucher **réessaie** sans planter.
- [ ] Depuis B, **appui long** sur un message de A → *Bloquer* → les messages de A
      **disparaissent** (RLS). *Signaler* enregistre un `report`.
- [ ] Un **tiers** (compte C) ne voit **aucune** conversation de A↔B (RLS par participant).
