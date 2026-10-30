/**
 * Mises à jour à distance (EAS Update) appliquées tout de suite : à l'ouverture et au retour dans l'app, NÉA vérifie s'il y a
 * une nouvelle version, la télécharge puis se relance (sinon elle ne s'afficherait qu'à l'ouverture suivante).
 * Après la relance, la nouvelle version est annoncée une fois (`/nouveautes`, design 10K « Mise à jour d'app »).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { AppState } from 'react-native';
import { create } from 'zustand';

import { doitAnnoncerMaj } from '@/lib/nouveautes';

import { useProfil } from './profil';

const CLE_VUE = 'nea-maj-annoncee';

/** Une annonce de mise à jour attend d'être montrée (lue par la barre d'onglets, qui ouvre `/nouveautes`). */
export const useAnnonceMaj = create<{ attend: boolean }>(() => ({ attend: false }));

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

/** Version en cours différente de la dernière annoncée : on l'annonce (une seule fois par version). */
async function annoncer() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const id = Updates.updateId;
    const vue = await AsyncStorage.getItem(CLE_VUE);
    if (!id || id === vue) return;
    await AsyncStorage.setItem(CLE_VUE, id);
    if (doitAnnoncerMaj(id, vue, useProfil.getState().onboarded, Updates.isEmbeddedLaunch)) useAnnonceMaj.setState({ attend: true });
  } catch {
    // Stockage indisponible : pas d'annonce.
  }
}

let demarre = false;
export function demarrerMajs() {
  if (demarre) return;
  demarre = true;
  void annoncer();
  void verifier();
  AppState.addEventListener('change', (a) => {
    if (a === 'active') void verifier();
  });
}
