/**
 * Mises à jour à distance (EAS Update) appliquées tout de suite : à l'ouverture et au retour dans l'app, NÉA vérifie s'il y a
 * une nouvelle version, la télécharge puis se relance (sinon elle ne s'afficherait qu'à l'ouverture suivante).
 */
import * as Updates from 'expo-updates';
import { AppState } from 'react-native';

let enCours = false;

async function verifier() {
  if (__DEV__ || !Updates.isEnabled || enCours) return;
  enCours = true;
  try {
    const r = await Updates.checkForUpdateAsync();
    if (r.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // Hors ligne ou serveur indisponible : la version actuelle reste.
  } finally {
    enCours = false;
  }
}

let demarre = false;
export function demarrerMajs() {
  if (demarre) return;
  demarre = true;
  void verifier();
  AppState.addEventListener('change', (a) => {
    if (a === 'active') void verifier();
  });
}
