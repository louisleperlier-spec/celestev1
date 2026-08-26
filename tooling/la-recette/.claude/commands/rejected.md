---
description: Apple a rejeté ton app ? Colle le message — Claude le décode, corrige la vraie cause et prépare la resoumission.
argument-hint: "[colle le texte complet du rejet Apple]"
---

# /rejected — décoder un rejet Apple et le corriger

Un rejet Apple, c'est **normal et réparable** — la plupart des apps en connaissent au moins un. Ton job :
traduire le charabia Apple en clair, corriger la **vraie** cause (pas juste la surface), et repréparer la
soumission. Surtout : **dédramatiser**. Ce n'est pas un échec, c'est une étape.

Texte du rejet : **$ARGUMENTS** (si vide : « Colle-moi tout le message d'Apple, même en anglais — je le
décode pour toi. »).

## 0. Constitution
Applique **recette-core**. La personne peut être déçue/stressée → **rassure d'abord** (« c'est courant, ça se
règle, je m'en occupe »), puis explique, puis corrige. Jamais de panique, jamais de jargon nu.

## 1. Parser le rejet + mapper la guideline
- Repère le/les **numéro(s) de guideline** cités (ex. *Guideline 2.1*, *4.8*, *5.1.1(v)*, *3.1.1*…) et le
  **texte du reviewer** (souvent le vrai indice concret, ex. « we were unable to sign in with the demo
  account »).
- Traduis en une phrase humaine **ce qu'Apple reproche vraiment**. Croise avec le skill
  **definition-of-done** (qui liste les rejets fréquents et leur parade) et, au besoin, les guidelines live.

Rejets classiques et leur cause réelle (repère lequel c'est) :
| Guideline | Ce qu'Apple veut vraiment |
|---|---|
| **2.1** app incomplète / **compte démo** qui ne marche pas | un login review fonctionnel + zéro bug/placeholder |
| **2.3.x** métadonnées | screenshots = vraie app, description exacte, pas de feature cachée, bon âge |
| **3.1.1 / 3.1.2** paiements | tout passe par l'IAP Apple + bouton *Restaurer* + prix/durée/renouvellement au paywall |
| **4.2** trop simple / wrapper web | ajouter de la vraie valeur native |
| **4.8** login social sans Apple | ajouter **Sign in with Apple** |
| **5.1.1(v)** | **suppression de compte in-app** manquante |
| **5.1.1 / 5.1.2** confidentialité / IA | politique HTTPS nommant les tiers + **consentement IA nommant OpenAI** |

## 2. Corriger la vraie cause (toi, dans le code/la config)
- Applique le correctif de fond, pas un pansement. Ex. rejet 5.1.1(v) → ajoute réellement l'écran de
  suppression de compte (RPC `delete_current_user`) ; rejet 2.1 compte démo → répare l'auth + crée/teste un
  compte review qui atteint le paywall.
- **Self-verify** (`tsc --noEmit` + `expo export`), et re-teste le point précis reproché.
- Relance l'**audit Definition-of-Done** pour être sûr que le rejet est fermé **et** qu'un autre `⛔` ne
  traîne pas (Apple peut re-rejeter sur un point voisin).

## 3. Repréparer la soumission
- S'il fallait changer du code → nouveau build + upload (logique de `/update` : bump build number, EAS build,
  submit).
- Mets à jour ce qui se corrige **sans** rebuild quand c'est possible (métadonnées, screenshots, App Privacy,
  compte démo, notes de review directement dans App Store Connect).
- Rédige une **réponse au reviewer** (Resolution Center) claire et polie, en anglais : ce que tu as corrigé,
  et — si Apple s'était trompé — une explication factuelle et courtoise. Prépare-la ; elle la validera/collera.

## 4. Resoumettre (avec sa confirmation)
Quand tout est corrigé et vérifié : guide-la pour renvoyer en review (répondre dans le Resolution Center et/ou
*Submit for Review* avec le nouveau build). Confirme avant l'envoi (« C'est corrigé et testé. On répond à
Apple et on resoumet — on y va ? »).

## 5. Après + mémoire
Explique la suite (nouvelle review, souvent plus rapide sur un resubmit). **Note le rejet + le fix** dans le
journal du skill **doctor** (`journal.md`) : chaque rejet appris protège les prochains clients.
