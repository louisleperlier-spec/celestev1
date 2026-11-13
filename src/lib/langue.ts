/**
 * Traduction vue depuis `src/lib` : les fonctions pures n'importent pas `@/i18n` (stockage natif) pour rester exécutables
 * avec Node (`comparer-plan`). `@/i18n` branche ici sa fonction au démarrage de l'app ; ailleurs, le français est rendu tel quel.
 */
let traducteur: (s: string) => string = (s) => s;
let fmtDate = 'fr-CA';

export const tr = (s: string) => traducteur(s);
/** Vrai quand l'app s'affiche en anglais. */
export const enAnglaisLib = () => fmtDate === 'en-US';

/** Locale des dates (« fr-CA » ou « en-US »). */
export const localeDates = () => fmtDate;

export function brancherTraduction(f: (s: string) => string, locale: string) {
  traducteur = f;
  fmtDate = locale;
}
