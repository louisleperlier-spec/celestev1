import { Linking } from 'react-native';

import { toast } from '@/components/ui';
import { santeDisponible } from '@/lib/sante';

/**
 * « Connecter un capteur » / « Apple Santé » : ouvre l'app Santé (sources, autorisations de NÉA, Apple Watch).
 * Dans Expo Go et le navigateur, Apple Santé n'est pas branché : on l'explique.
 */
export function ouvrirSante() {
  if (!santeDisponible()) return toast("Apple Santé fonctionne dans l'app installée (TestFlight / App Store)");
  Linking.openURL('x-apple-health://').catch(() => toast("Ouvre l'app Santé pour gérer tes sources"));
}

/** « Apple Watch » du Profil : ouvre l'app Watch de l'iPhone (installer NÉA sur la montre). */
export function ouvrirWatch() {
  Linking.openURL('itms-watchs://').catch(() => toast("Ouvre l'app Watch de l'iPhone, onglet « Ma montre »"));
}
