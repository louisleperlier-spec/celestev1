import { router } from 'expo-router';

import { toast } from '@/components/ui';
import { useVelo } from '@/store/velo';

/** Sortie vélo du programme : ouvre l'onglet Vélo en extérieur (launchS du prototype). */
export function lancerSortie(min: number, cat?: string) {
  useVelo.getState().setMode('ext');
  router.navigate('/velo');
  toast('Lance ta sortie : ' + min + ' min, zone ' + (cat === 'e_frac' ? '2 à 4' : '2'));
}
