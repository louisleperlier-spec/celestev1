/**
 * FC de l'Apple Watch pendant une séance ou une sortie vélo : lue toutes les 5 s dans Apple Santé.
 * Tant qu'une mesure de moins de 20 s existe, le cœur simulé la suit (source « montre ») ; sinon il reste simulé.
 * La montre n'écrit des mesures fréquentes que si un entraînement est lancé dessus (app Exercice).
 */
import { coeur } from '@/lib/coeur';
import { fcRecente, santeDisponible } from '@/lib/sante';

import { useProfil } from './profil';

let horloge: ReturnType<typeof setInterval> | null = null;

async function lire() {
  const bpm = await fcRecente();
  const hr = coeur(useProfil.getState().age);
  hr.cible = bpm;
  hr.src = bpm != null ? 'montre' : 'sim';
}

/** Début d'une séance ou d'une sortie. */
export function suivreMontre() {
  if (horloge || !santeDisponible()) return;
  lire();
  horloge = setInterval(lire, 5000);
}

/** Fin : retour à la FC simulée. */
export function arreterMontre() {
  if (horloge) clearInterval(horloge);
  horloge = null;
  const hr = coeur(useProfil.getState().age);
  hr.cible = null;
  hr.src = 'sim';
}
