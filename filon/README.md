# Filon

App Mac et PC pour vendre des sites web aux commerces locaux. Tu choisis une ville, et Filon déroule 5 étapes :

1. **Repérer** : liste les commerces de la ville (et des communes voisines si tu coches la case), via OpenStreetMap. Pas de clé d'API.
2. **Noter** : visite chaque site et lui donne un score d'opportunité de 0 à 100. Verdicts : **absent** (aucun site, ou seulement une page Facebook), **cassé** (erreur, ne répond pas) ou **dépassé** (pas mobile, pas de HTTPS, copyright figé, jQuery 1.x, Flash…).
3. **Maquetter** : lance **Claude Code** ou **Codex** sur ta machine, avec ton abonnement. L'agent écrit un `index.html` sur mesure. Filon le charge ensuite sur téléphone (390 px), tablette (820 px) et ordinateur (1440 px), prend les captures et mesure les débordements, le texte trop petit, les images cassées et l'absence de lien d'appel. S'il y a des problèmes, il les écrit dans `CONTROLE.md` et relance l'agent. Ça continue jusqu'à ce que la maquette passe (3 tours maximum par défaut).
4. **Écrire** : brouillon de courriel construit à partir du diagnostic, ouverture directe dans ta messagerie, puis relances.
5. **Appeler** : pitch d'appel avec les objections, statut, notes, boutons rapides (pas de réponse, intéressé…) et date de la prochaine relance.

## Lancer l'app (développement)

Il faut **Node.js 20+** (https://nodejs.org).

```bash
cd filon
npm install
npm start
```

## Installer l'agent de maquette (un seul suffit)

- **Claude Code** (Claude Pro ou Max) : `npm install -g @anthropic-ai/claude-code`, puis lance `claude` une fois dans un terminal pour te connecter.
- **Codex** (ChatGPT Plus ou Pro) : `npm install -g @openai/codex`, puis lance `codex` une fois pour te connecter avec ton compte ChatGPT.

Ensuite, dans **Réglages**, choisis l'agent. Filon vérifie qu'il est bien installé.

## Fabriquer l'installeur à donner aux testeurs

- Sur un Mac : `npm run dist:mac` → `dist/Filon-0.1.0-arm64.dmg`
- Sur un PC : `npm run dist:win` → `dist/Filon Setup 0.1.0.exe`

L'app n'est pas signée. Sur Mac, il faut faire clic droit > Ouvrir la première fois. Sur Windows, il faut cliquer sur « Informations complémentaires > Exécuter quand même ». Pour éviter ces messages, il faut signer l'app avec ton compte Apple Developer et un certificat Windows.

## Où sont les données

Tout reste en local, dans le dossier de données de l'app :
- Mac : `~/Library/Application Support/Filon/campaigns/`
- Windows : `%APPDATA%\Filon\campaigns\`

Chaque maquette a son propre dossier, qui contient `BRIEF.md`, `index.html`, `CONTROLE.md`, `capture-mobile/tablet/desktop.png` et `agent.log`.

## Structure

```
main.js              processus principal, IPC
preload.js           pont sécurisé vers l'interface
src/lib/geo.js       1. Repérer (Nominatim + Overpass)
src/lib/audit.js     2. Noter
src/lib/mockup.js    3. Maquetter (lance l'agent, contrôle sur 3 écrans, boucle de correction)
src/lib/outreach.js  4-5. Courriels, pitch, relances
src/lib/store.js     stockage JSON
renderer/            interface (HTML/CSS/JS, noir et orange)
```

## Limites connues (v0.1)

- OpenStreetMap n'est pas exhaustif : certaines villes sont mal couvertes, et peu de fiches ont un téléphone ou un courriel. Une étape d'enrichissement (Google Places, pages Facebook) serait la prochaine amélioration.
- Les courriels ne partent pas tout seuls : Filon ouvre ta messagerie avec le brouillon déjà rempli.
- Le chemin Codex suit la même logique que Claude Code (`codex exec --full-auto`), mais il n'a été testé qu'avec un agent simulé.
