import { Redirect } from 'expo-router';

import { useProfil } from '@/store/profil';

/** Point d'entrée : écran de bienvenue, ou onglet Accueil si l'onboarding est fait. */
export default function Index() {
  const onboarded = useProfil((s) => s.onboarded);
  return <Redirect href={onboarded ? '/accueil' : '/bienvenue'} />;
}
