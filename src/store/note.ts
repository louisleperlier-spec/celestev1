/**
 * Demande de note App Store : fenêtre native (`expo-store-review`, build 35 et plus) proposée au retour sur l'Accueil
 * après la 3e activité terminée. Les builds sans le module natif ne demandent rien (le Profil garde le lien « Noter NÉA »).
 */
import { requireOptionalNativeModule } from 'expo';
import { Linking, Platform } from 'react-native';

import { doitDemanderNote, LIEN_AVIS } from '@/lib/note';

import { useProfil } from './profil';

type StoreReview = typeof import('expo-store-review');

let module: StoreReview | null | undefined;

function storeReview(): StoreReview | null {
  if (module !== undefined) return module;
  module = null;
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoStoreReview')) return module;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    module = require('expo-store-review') as StoreReview;
  } catch {
    module = null;
  }
  return module;
}

let enCours = false;

/** À appeler quand l'Accueil s'affiche : propose la note si le moment est bon (une seule fois par période). */
export async function proposerNoteSiBon() {
  const st = useProfil.getState();
  if (enCours || !doitDemanderNote(st.logs.length, st.noteDemandes)) return;
  const sr = storeReview();
  if (!sr) return;
  enCours = true;
  try {
    if (!(await sr.isAvailableAsync())) return;
    // Petite pause : la fenêtre arrive une fois l'Accueil affiché, pas en plein changement d'écran.
    await new Promise((r) => setTimeout(r, 1500));
    useProfil.setState({ noteDemandes: [...(st.noteDemandes ?? []), Date.now()].slice(-6) });
    await sr.requestReview();
  } catch {
    // Pas de note possible (TestFlight, simulateur…) : on réessaiera à la prochaine période.
  } finally {
    enCours = false;
  }
}

/** « Noter NÉA » du Profil : la page « Écrire un avis » de l'App Store. */
export const ouvrirAvis = () => Linking.openURL(LIEN_AVIS);
