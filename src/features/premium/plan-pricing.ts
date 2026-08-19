import type { PurchasesPackage } from 'react-native-purchases';

/**
 * Dérive la durée d'essai et l'économie annuelle depuis les vrais packages RevenueCat — jamais
 * en dur. Retourne `null` quand la donnée n'est pas disponible (pas de build natif / offering
 * non configuré) ; l'appelant retombe alors sur un texte de repli statique, comme pour les prix.
 */

export function trialDaysFor(pkg: PurchasesPackage | null): number | null {
  const intro = pkg?.product.introPrice;
  if (!intro) return null;
  if (intro.periodUnit === 'DAY') return intro.periodNumberOfUnits;
  if (intro.periodUnit === 'WEEK') return intro.periodNumberOfUnits * 7;
  return null;
}

export function annualSavingsPercent(monthlyPkg: PurchasesPackage | null, annualPkg: PurchasesPackage | null): number | null {
  const monthlyPrice = monthlyPkg?.product.price;
  const annualPrice = annualPkg?.product.price;
  if (!monthlyPrice || !annualPrice) return null;
  const fullYearAtMonthly = monthlyPrice * 12;
  if (fullYearAtMonthly <= 0) return null;
  const savings = Math.round((1 - annualPrice / fullYearAtMonthly) * 100);
  return savings > 0 ? savings : null;
}
