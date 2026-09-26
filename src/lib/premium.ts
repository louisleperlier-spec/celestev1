/**
 * Accès NÉA Plus (isPremium, inTrial, wkLocked, progLocked, money et achat du prototype).
 * L'état de l'abonnement vit dans le profil ; il est branché ici au démarrage (`brancherPremium`)
 * pour que les écrans puissent appeler `isPremium()` sans argument, comme le prototype.
 */
import { PROGRAMMES } from '@/data/programmes';
import { SEANCES_GRATUITES } from '@/data/seances';
import type { CoachId, ProgrammeId, SeanceId } from '@/data/types';

/** Abonnement (S.premium). `until` : fin de la période payée ou de l'essai ; `renew` : renouvellement automatique. */
export type Premium = { plan: 'an' | 'mois'; since: number; until: number; renew: boolean; trialEnd?: number; promo?: boolean };

/** Offre choisie : les 2 du paywall et l'offre de sortie à 39,99 $ la 1re année. */
export type OffreId = 'an' | 'mois' | 'an39';

let lire: () => Premium | null = () => null;
/** Appelé une fois par le profil : d'où lire l'abonnement. */
export const brancherPremium = (f: () => Premium | null) => {
  lire = f;
};

export function estPremium(p: Premium | null, now: number = Date.now()): boolean {
  return !!p && p.until > now;
}

export const isPremium = (): boolean => estPremium(lire());

/** Essai gratuit en cours (inTrial). */
export const enEssai = (p: Premium | null, now: number = Date.now()) => !!p && !!p.trialEnd && now < p.trialEnd;

/** Séance du catalogue réservée à NÉA Plus (3 sont gratuites). */
export const wkLocked = (id: SeanceId) => !isPremium() && !SEANCES_GRATUITES.includes(id);

/** Programme réservé à NÉA Plus (le premier de chaque coach est gratuit). */
export const progLocked = (coach: CoachId, id: ProgrammeId) => !isPremium() && PROGRAMMES[coach][0].id !== id;

/** 59,99 $ (money). */
export const money = (v: number) => v.toFixed(2).replace('.', ',') + ' $';

/** Abonnement après l'achat (buySheet) : annuel avec 3 jours d'essai (39,99 $ pour l'offre de sortie), ou mensuel. */
export function nouvelAbonnement(id: OffreId, now: number = Date.now()): Premium {
  if (id === 'an' || id === 'an39') return { plan: 'an', promo: id === 'an39', since: now, trialEnd: now + 3 * 864e5, until: now + (3 + 365) * 864e5, renew: true };
  return { plan: 'mois', since: now, until: now + 30 * 864e5, renew: true };
}

/** Annuler ou réactiver le renouvellement (subSheet). */
export function basculerRenouvellement(p: Premium, now: number = Date.now()): Premium {
  const essai = enEssai(p, now);
  const renew = !p.renew;
  const until = !renew ? (essai ? p.trialEnd! : p.until) : essai ? p.trialEnd! + (p.plan === 'an' ? 365 : 30) * 864e5 : p.until;
  return { ...p, renew, until };
}

/** Ligne NÉA Plus du Profil (subRow). */
export function ligneAbonnement(p: Premium | null, now: number = Date.now()): string {
  if (!estPremium(p, now) || !p) return "Version gratuite • Découvre l'essai 3 jours";
  if (enEssai(p, now)) return "Essai gratuit jusqu'au " + new Date(p.trialEnd!).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' }) + (p.renew ? '' : ' • annulé');
  return (
    'Abonnement ' +
    (p.plan === 'an' ? 'annuel' + (p.promo ? ' (39,99 $ la 1re année)' : '') : 'mensuel') +
    (p.renew ? '' : ' • se termine le ' + new Date(p.until).toLocaleDateString('fr-CA'))
  );
}
