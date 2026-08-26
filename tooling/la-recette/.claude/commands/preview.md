---
description: Voir ton app sur ton iPhone tout de suite — Claude génère un QR code à scanner avec Expo Go.
---

# /preview — ton app sur ton téléphone (via Expo Go)

Le moment où la personne **voit son app vivre** sur son propre iPhone. Pas de build, pas d'attente : on
utilise **Expo Go** (l'app gratuite qui fait tourner ton app en direct pendant le développement). Le
livrable **fiable**, c'est l'**adresse `exp://…` en TEXTE** (elle la scanne ou la colle) — et, en bonus, un
**fichier QR (PNG) déposé dans le dossier de l'app** qu'elle ouvre elle-même. Ne promets jamais « je
t'envoie l'image du QR » : en ligne de commande, tu n'as pas de canal image→utilisateur garanti.

## 0. Constitution
Applique **recette-core**. Objectif : zéro friction. Tu fais tout ; elle n'a qu'à scanner.

## 1. Prérequis (dis-le une fois, simplement)
« Installe **Expo Go** depuis l'App Store sur ton iPhone (c'est gratuit, c'est le lecteur qui affiche ton
app pendant qu'on la construit). Ton téléphone n'a pas besoin d'être sur le même wifi que ton PC — j'utilise
un tunnel qui marche partout. » Si Expo Go n'est pas installé, donne le lien App Store et attends.

## 2. Lancer le serveur de preview (avec tunnel)
Depuis le dossier de l'app, démarre Expo en mode **tunnel** (fonctionne même si le téléphone et le PC ne
sont pas sur le même réseau) :

```bash
npx expo start --tunnel
```

- Lance-le en **arrière-plan** pour pouvoir continuer à lui parler pendant que ça tourne.
- Attends que le serveur soit prêt et **récupère l'URL `exp://…`** qu'Expo affiche (c'est l'adresse unique
  de la session). Si le tunnel met du temps à s'établir la 1re fois (ngrok se télécharge), rassure : « je
  prépare le lien, 10-20 secondes ».
- Si `--tunnel` échoue (dépendance `@expo/ngrok` manquante, réseau) → répare via le skill **doctor**, ou
  bascule en `--lan` en expliquant qu'il faudra alors le **même wifi** des deux côtés.

## 3. Donner l'accès : l'URL `exp://…` en TEXTE (fiable) + un QR déposé dans le dossier (bonus)
Le livrable garanti, c'est **l'URL en texte** — tu n'as **pas** de canal image→utilisateur fiable en CLI,
donc **ne promets pas** « je t'envoie le QR en image ». Fais dans cet ordre :

1. **Donne l'URL `exp://…` en clair**, avec la consigne : « Ouvre **Expo Go** sur ton iPhone → *Enter URL
   manually* → colle **cette adresse**. (Ou scanne le QR ci-dessous avec l'appareil photo.) »
2. **Dépose un QR dans le dossier de l'app** qu'elle peut ouvrir elle-même (pas d'envoi d'image, aucune lib
   à installer — utilise `npx` qui télécharge l'outil à la volée) :
   - **PNG** : `npx --yes qrcode "exp://…" -o ./preview-qr.png` (crée `preview-qr.png` à la racine de l'app).
     Dis-lui : « J'ai mis un QR ici : **ouvre le fichier `preview-qr.png` dans ton dossier d'app** et
     scanne-le. »
   - **Ou QR ASCII dans le terminal** : `npx --yes qrcode-terminal "exp://…"` (ou simplement le QR qu'Expo
     affiche déjà dans sa sortie) — dépannage rapide si elle regarde le terminal.
3. Si `npx` échoue (réseau/proxy) : **pas de cul-de-sac** — l'URL texte + le QR natif d'Expo dans le terminal
   suffisent. Répare via le skill **doctor** si besoin, sans bloquer.

## 4. Rappels honnêtes (évite la fausse déception)
- **Le paywall est « stubbé » en Expo Go.** Explique : « L'écran d'abonnement ne fonctionne pas vraiment ici
  — les vrais paiements sont une brique *native* d'Apple qu'Expo Go ne sait pas afficher. On les testera pour
  de vrai sur le build TestFlight, plus tard, sans que tu paies quoi que ce soit (mode sandbox). »
- Idem pour tout ce qui est **natif** (notifications push réelles, deep-link de reset mot de passe) : ça se
  valide sur le build EAS, pas en Expo Go — dis-le pour qu'elle ne croie pas à un bug.
- Le **rechargement est en direct** : si elle veut un changement (couleur, texte), tu l'appliques et l'app
  se met à jour sur son téléphone en quelques secondes (hot reload). Propose-le : « Tu veux changer quelque
  chose pendant que tu regardes ? »

## 5. Après le preview
- Si elle est contente → propose la suite : « Content du rendu ? Quand tu veux, je la prépare pour l'App
  Store — `/app-store`. »
- Si elle veut ajuster le look → `/ui`. Un bug → `/fix`. Un texte/couleur → tu le changes direct, c'est
  live.
- Pense à **arrêter proprement** le serveur de preview quand elle a fini (ne le laisse pas tourner
  indéfiniment en arrière-plan).
