import { Redirect } from 'expo-router';

import { useProfil } from '@/store/profil';

/** Point d'entrée : accueil de l'onboarding, ou programme si l'onboarding est fait. */
export default function Index() {
  const onboarded = useProfil((s) => s.onboarded);
  return <Redirect href={onboarded ? '/programme' : '/bienvenue'} />;
}
