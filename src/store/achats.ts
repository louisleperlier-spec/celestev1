/**
 * Vrais achats NÉA Plus (App Store) avec RevenueCat (`react-native-purchases`).
 * Actifs seulement dans l'app installée (TestFlight / App Store) quand la clé publique `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
 * est fournie ; sinon (Expo Go, navigateur, pas de clé) l'app garde l'achat simulé du prototype.
 * Produits (App Store Connect, groupe « NÉA Plus ») : annuel avec 3 jours d'essai, annuel « offre de sortie » (39,99 $ la
 * 1re année) et mensuel ; droit RevenueCat `plus`. L'abonnement reçu remplace `premium` dans le profil.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { OffreId, Premium } from '@/lib/premium';

import { useCompte } from './compte';
import { useProfil } from './profil';

type RC = typeof import('react-native-purchases').default;
type InfoClient = import('react-native-purchases').CustomerInfo;

/** Identifiants des produits dans App Store Connect. */
export const PRODUITS: Record<OffreId, string> = {
  an: 'com.neacoach.app.plus.annuel',
  an39: 'com.neacoach.app.plus.annuel.offre',
  mois: 'com.neacoach.app.plus.mensuel',
};
/** Droit RevenueCat qui ouvre NÉA Plus. */
const DROIT = 'plus';
const CLE = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

let rc: RC | null | undefined;
function module(): RC | null {
  if (rc !== undefined) return rc;
  rc = null;
  if (Platform.OS !== 'ios' || !CLE || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return rc;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    rc = (require('react-native-purchases') as typeof import('react-native-purchases')).default;
  } catch {
    rc = null;
  }
  return rc;
}

/** Les achats passent par l'App Store (sinon : achat simulé). */
export const achatsReels = () => module() !== null;

/** Abonnement NÉA Plus d'après le droit `plus` de RevenueCat (null s'il n'est pas actif). */
function versPremium(info: InfoClient): Premium | null {
  const d = info.entitlements.active[DROIT];
  if (!d) return null;
  const fin = d.expirationDate ? Date.parse(d.expirationDate) : Date.now() + 365 * 864e5;
  return {
    plan: d.productIdentifier === PRODUITS.mois ? 'mois' : 'an',
    promo: d.productIdentifier === PRODUITS.an39,
    since: Date.parse(d.originalPurchaseDate),
    until: fin,
    renew: d.willRenew,
    trialEnd: d.periodType === 'TRIAL' ? fin : undefined,
  };
}

const appliquer = (info: InfoClient) => useProfil.setState({ premium: versPremium(info) });

let demarre = false;
/** Au lancement : RevenueCat configuré, lié au compte NÉA s'il existe, abonnement tenu à jour. */
export function demarrerAchats() {
  const m = module();
  if (!m || demarre) return;
  demarre = true;
  m.configure({ apiKey: CLE, appUserID: useCompte.getState().userId ?? undefined });
  m.addCustomerInfoUpdateListener(appliquer);
  m.getCustomerInfo().then(appliquer).catch(() => {});
  // Connexion / déconnexion du compte : les achats suivent le compte (restaurables sur un autre appareil).
  useCompte.subscribe((s, avant) => {
    if (s.userId === avant.userId) return;
    (s.userId ? m.logIn(s.userId).then((r) => r.customerInfo) : m.logOut())
      .then(appliquer)
      .catch(() => {});
  });
}

/** `introuvable` : l'App Store n'a pas renvoyé le produit (abonnement pas prêt chez Apple, contrat Paid Apps inactif). */
export type ResultatAchat = 'ok' | 'annule' | 'erreur' | 'introuvable';

/** Achat d'une offre par l'App Store (feuille de paiement d'Apple). */
export async function acheterReel(id: OffreId): Promise<ResultatAchat> {
  const m = module();
  if (!m) return 'erreur';
  try {
    const [produit] = await m.getProducts([PRODUITS[id]], m.PRODUCT_CATEGORY.SUBSCRIPTION);
    if (!produit) return 'introuvable';
    const r = await m.purchaseStoreProduct(produit);
    appliquer(r.customerInfo);
    return versPremium(r.customerInfo) ? 'ok' : 'erreur';
  } catch (e) {
    return (e as { userCancelled?: boolean }).userCancelled ? 'annule' : 'erreur';
  }
}

/** « Restaurer » : abonnements déjà achetés avec ce compte Apple. */
export async function restaurerReel(): Promise<boolean> {
  const m = module();
  if (!m) return false;
  try {
    const info = await m.restorePurchases();
    appliquer(info);
    return !!versPremium(info);
  } catch {
    return false;
  }
}

/** Gérer / annuler l'abonnement : écran des abonnements de l'App Store. */
export async function gererAbonnement(): Promise<void> {
  await module()?.showManageSubscriptions();
}
