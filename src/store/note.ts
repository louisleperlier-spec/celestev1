/**
 * Demande de note App Store : écran « Aide NÉA à grandir » (`/noter`, design 10K « Demande d'avis ») proposé au retour sur
 * l'Accueil après la 3e activité terminée et après l'annonce d'une mise à jour ; « Noter NÉA » ouvre la fenêtre native
 * (`expo-store-review`, build 35 et plus) ou, sans le module natif, la page « Écrire un avis » de l'App Store.
 */
import { requireOptionalNativeModule } from 'expo';
import { router } from 'expo-router';
import { Linking, Platform } from 'react-native';

import { doitDemanderNote, doitInviterNote, LIEN_AVIS } from '@/lib/note';

import { useAnnonceMaj } from './majs';
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

/** Ouvre l'invitation et note la date de la demande. */
function inviter() {
  const st = useProfil.getState();
  useProfil.setState({ noteDemandes: [...(st.noteDemandes ?? []), Date.now()].slice(-6) });
  router.push('/noter');
}

let attente: ReturnType<typeof setTimeout> | undefined;

/** À appeler quand l'Accueil s'affiche : propose la note si le moment est bon (une seule fois par période). */
export function proposerNoteSiBon() {
  const st = useProfil.getState();
  if (st.avisFini || useAnnonceMaj.getState().attend || !doitDemanderNote(st.logs.length, st.noteDemandes)) return;
  clearTimeout(attente);
  // Petite pause : l'invitation arrive une fois l'Accueil affiché, pas en plein changement d'écran.
  attente = setTimeout(inviter, 1500);
  return () => clearTimeout(attente);
}

/** Après l'annonce d'une mise à jour : invitation à noter si la personne n'a pas encore noté NÉA. */
export function inviterApresMaj() {
  const st = useProfil.getState();
  if (doitInviterNote(st.logs.length, st.avisFini, st.noteDemandes)) inviter();
}

/** « Noter NÉA » de l'invitation : fenêtre native d'Apple si elle existe, sinon la page « Écrire un avis ». */
export async function noter() {
  useProfil.setState({ avisFini: true });
  const sr = storeReview();
  try {
    if (sr && (await sr.isAvailableAsync())) return await sr.requestReview();
  } catch {
    // Fenêtre native indisponible (TestFlight…) : la page de l'App Store prend le relais.
  }
  await Linking.openURL(LIEN_AVIS);
}

/** « Noter NÉA » du Profil : la page « Écrire un avis » de l'App Store. */
export const ouvrirAvis = () => Linking.openURL(LIEN_AVIS);
