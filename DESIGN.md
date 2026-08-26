# Céleste — direction artistique

## Pourquoi ce changement de DA

L'ancienne version mélangeait deux langages visuels incohérents : un accueil "kawaii" pastel avec la
mascotte Lumi, et un site en ligne en bleu marine sobre — deux apps qui ne se ressemblaient pas. Céleste
adopte maintenant **une seule identité, appliquée partout** : écrans, onboarding (à venir) et paywall.

## L'identité : "ciel nocturne contemplatif"

Inspirée du kit "iOS-native frost" (voir `tooling/la-recette/.claude/skills/ui-kits/SKILL.md`), adaptée
à une app de bien-être spirituel plutôt qu'à un outil productif :

- **Un seul accent** : indigo/lavande lunaire (`#6C63E0` clair · `#9C93F5` sombre) — jamais deux couleurs
  vives en concurrence. Un second ton, l'or discret (`gold`), sert uniquement d'accent secondaire rare
  (pas encore utilisé activement, réservé pour un badge premium futur).
- **Écrans signature** (Accueil, Lune, Méditation, Paywall) : fond `NightSkyBackdrop` (dégradé ciel +
  étoiles en mode sombre) avec des cartes **frost** (verre dépoli, `expo-blur`).
- **Écrans utilitaires** (Heures miroir, Journal) : surfaces solides, cartes à filet fin — la lisibilité
  prime sur l'effet.
- **Typo** : titres contemplatifs en `ui-serif` (système, pas de police custom à charger — perf et
  simplicité), corps de texte en `system-ui`. Chiffres/labels en majuscules type "SectionLabel".
- **Rayons généreux** (14 / 22 / 32px), espacement aéré — apaisant, jamais dense.
- **Zéro emoji dans l'UI** (hors le "✦" qui fait partie de l'identité de marque, pas une déco jetable) —
  des SF Symbols partout ailleurs (`expo-symbols`), cohérent avec le langage iOS natif.
- **Lumi** (la mascotte) n'est plus une illustration kawaii : elle est représentée par une simple touche
  lumineuse (icône sparkles) intégrée aux cartes — cohérente avec le reste, sans rupture de ton.

## Ce qui reste à faire sur ce chantier (assumé, pas caché)

- Icône d'app et écran de lancement définitifs (des visuels de marque réels, pas les défauts Expo).
- Une vraie illustration/mascotte Lumi si on veut la garder comme personnage (au lieu de l'icône
  sparkles) — mais alors dans le même langage graphique (pas de retour au style pastel précédent).
- Tester le rendu clair ET sombre sur un vrai iPhone avant de considérer la DA "verrouillée"
  (`/preview` une fois un compte Expo connecté).
