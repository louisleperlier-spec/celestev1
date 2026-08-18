import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import {
  addCustomerInfoListener,
  configurePurchases,
  fetchCurrentOffering,
  fetchCustomerInfo,
  isEntitlementActive,
  isPurchasesSupported,
  purchasePackage as purchasePackageRequest,
  PurchaseOutcome,
  restorePurchases as restorePurchasesRequest,
} from './purchases';

interface PremiumContextValue {
  ready: boolean;
  supported: boolean;
  isPremium: boolean;
  offering: PurchasesOffering | null;
  purchase: (pkg: PurchasesPackage) => Promise<PurchaseOutcome>;
  restore: () => Promise<boolean>;
  refreshOffering: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);

  const applyCustomerInfo = useCallback((info: CustomerInfo | null) => {
    setIsPremium(isEntitlementActive(info));
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const configuredOk = await configurePurchases();
      setSupported(configuredOk && isPurchasesSupported());

      if (configuredOk) {
        const [info, currentOffering] = await Promise.all([fetchCustomerInfo(), fetchCurrentOffering()]);
        applyCustomerInfo(info);
        setOffering(currentOffering);
        unsubscribe = addCustomerInfoListener(applyCustomerInfo);
      }

      setReady(true);
    })();

    return () => unsubscribe?.();
  }, [applyCustomerInfo]);

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseOutcome> => {
    const result = await purchasePackageRequest(pkg);
    if (result.customerInfo) applyCustomerInfo(result.customerInfo);
    return result.outcome;
  }, [applyCustomerInfo]);

  const restore = useCallback(async (): Promise<boolean> => {
    const info = await restorePurchasesRequest();
    applyCustomerInfo(info);
    return isEntitlementActive(info);
  }, [applyCustomerInfo]);

  const refreshOffering = useCallback(async () => {
    setOffering(await fetchCurrentOffering());
  }, []);

  const value: PremiumContextValue = { ready, supported, isPremium, offering, purchase, restore, refreshOffering };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within a PremiumProvider');
  return ctx;
}
