import type PurchasesModule from 'react-native-purchases';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

/**
 * Pont RevenueCat — un seul entitlement suivi : "premium". Comme HealthKit, le SDK natif
 * n'existe pas dans Expo Go : on charge le module en lazy, sous try/catch, jamais au chargement
 * du bundle. Sans clé API configurée (EXPO_PUBLIC_REVENUECAT_API_KEY), tout se dégrade en no-op
 * — l'app reste utilisable, simplement personne n'est premium.
 */

export const PREMIUM_ENTITLEMENT_ID = 'premium';

let cachedModule: typeof PurchasesModule | null | undefined;

function loadPurchases(): typeof PurchasesModule | null {
  if (cachedModule !== undefined) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('react-native-purchases').default as typeof PurchasesModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
}

let configured = false;

export function isPurchasesSupported(): boolean {
  return loadPurchases() !== null && Boolean(process.env.EXPO_PUBLIC_REVENUECAT_API_KEY);
}

/** Configure le SDK une seule fois. No-op si la clé API publique n'est pas définie. */
export async function configurePurchases(): Promise<boolean> {
  if (configured) return isPurchasesSupported();
  const Purchases = loadPurchases();
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
  if (!Purchases || !apiKey) return false;
  try {
    Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch {
    return false;
  }
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  const Purchases = loadPurchases();
  if (!Purchases || !configured) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

export function isEntitlementActive(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo) return false;
  return Boolean(customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]?.isActive);
}

export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  const Purchases = loadPurchases();
  if (!Purchases || !configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export type PurchaseOutcome = 'purchased' | 'cancelled' | 'error';

export async function purchasePackage(pkg: PurchasesPackage): Promise<{ outcome: PurchaseOutcome; customerInfo: CustomerInfo | null }> {
  const Purchases = loadPurchases();
  if (!Purchases || !configured) return { outcome: 'error', customerInfo: null };
  try {
    const result = await Purchases.purchasePackage(pkg);
    return { outcome: 'purchased', customerInfo: result.customerInfo };
  } catch (error) {
    const isCancelled = (error as { userCancelled?: boolean } | null)?.userCancelled === true;
    return { outcome: isCancelled ? 'cancelled' : 'error', customerInfo: null };
  }
}

export async function restorePurchases(): Promise<CustomerInfo | null> {
  const Purchases = loadPurchases();
  if (!Purchases || !configured) return null;
  try {
    return await Purchases.restorePurchases();
  } catch {
    return null;
  }
}

export function addCustomerInfoListener(listener: (info: CustomerInfo) => void): () => void {
  const Purchases = loadPurchases();
  if (!Purchases || !configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
