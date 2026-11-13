import { ecrireChoix, lireChoix } from './stockageLangue';
import EN from './en.json';
import { brancherTraduction } from '@/lib/langue';

/**
 * Langues de NÉA (anglais ajouté le 12 nov. 2026, demande de l'utilisateur). Le français reste la langue source : chaque texte
 * affiché passe par `traduire()` (dans `Text`, les notifications, les alertes, les partages), qui le cherche dans le dictionnaire
 * `en.json` (clé = texte français). Les textes construits (« Niveau {0} », « {0} séances ») sont reconnus par gabarit, et ce
 * qu'ils contiennent est traduit à son tour. Sans traduction connue, le texte reste en français.
 */
export type Langue = 'fr' | 'en';
export type ChoixLangue = Langue | 'auto';

const DICO = EN as Record<string, string>;

function langueAppareil(): Langue {
  try {
    const l = Intl.DateTimeFormat().resolvedOptions().locale ?? 'fr';
    return l.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  } catch {
    return 'fr';
  }
}

const choixInitial = (): ChoixLangue => {
  const c = lireChoix();
  return c === 'fr' || c === 'en' ? c : 'auto';
};

let choix: ChoixLangue = choixInitial();
let langue: Langue = choix === 'auto' ? langueAppareil() : choix;

export const langueActive = (): Langue => langue;
export const choixLangue = (): ChoixLangue => choix;
export const enAnglais = () => langue === 'en';

/** Change la langue (gardée sur l'appareil) ; l'appelant relance l'app pour tout réafficher. */
export function choisirLangue(c: ChoixLangue) {
  choix = c;
  ecrireChoix(c === 'auto' ? null : c);
  langue = c === 'auto' ? langueAppareil() : c;
  cache.clear();
  brancherTraduction(traduire, locale());
}

/** Initiales des jours, du lundi au dimanche. */
export const LETTRES_JOURS: readonly string[] = langue === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Locale des dates et des nombres (`toLocaleDateString`, `Intl`). */
export const locale = () => (langue === 'en' ? 'en-US' : 'fr-CA');

/* ───────────── Gabarits ───────────── */

type Gabarit = { re: RegExp; ancre: string; fixe: number; en: string };

const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const GABARITS: Gabarit[] = Object.keys(DICO)
  .filter((k) => /\{\d\}/.test(k))
  .map((k) => {
    const morceaux = k.split(/\{\d\}/);
    const ancre = morceaux.reduce((a, b) => (b.trim().length > a.length ? b.trim() : a), '');
    const re = new RegExp('^' + k.split(/(\{\d\})/).map((m) => (/^\{\d\}$/.test(m) ? '(.*?)' : echapper(m))).join('') + '$', 's');
    return { re, ancre, fixe: morceaux.join('').length, en: DICO[k] };
  })
  // Un gabarit sans texte fixe (« {0} · {1} ») reconnaîtrait tout.
  .filter((g) => /[a-zA-ZÀ-ÿ]/.test(g.ancre))
  // Les gabarits les plus précis d'abord (plus de texte fixe).
  .sort((a, b) => b.fixe - a.fixe);

const cache = new Map<string, string>();

function parGabarit(s: string, profondeur: number): string | null {
  for (const g of GABARITS) {
    // Le texte fixe doit peser dans la phrase : « {0} séance{1} » ne doit pas avaler une phrase entière.
    if (g.fixe < s.length * 0.3 || !s.includes(g.ancre)) continue;
    const m = g.re.exec(s);
    if (!m) continue;
    // {n} = n-ième valeur du texte français (les {n} de la clé suivent l'ordre d'apparition) ; l'anglais peut les déplacer.
    // Les valeurs courtes (prénoms : « Sam » n'est pas samedi) restent telles quelles.
    const valeurs = m.slice(1).map((v) => (profondeur < 2 && v.trim().length >= 5 ? traduireInterne(v, profondeur + 1) : v));
    return g.en.replace(/\{(\d)\}/g, (_, d: string) => valeurs[Number(d)] ?? '');
  }
  return null;
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Texte connu tel quel, ou à la casse près (« SEMAINE », « épaules »). */
function exact(norm: string): string | null {
  const d = DICO[norm];
  if (d != null) return d;
  const m = DICO[majuscule(norm.toLowerCase())];
  if (m == null) return null;
  if (norm === norm.toUpperCase() && norm !== norm.toLowerCase()) return m.toUpperCase();
  if (norm.charAt(0) === norm.charAt(0).toLowerCase()) return m.charAt(0).toLowerCase() + m.slice(1);
  return m;
}

const SEPARATEURS = [/(\s+[•·]\s+)/, /(\s*:\s+)/, /(,\s+)/];
/** Phrases d'un même texte (sans lookbehind, pour Hermes). */
const PHRASES = /[^.?!…]+[.?!…]+[\s]*|[^.?!…]+$/g;
const PUCE = /^([•·\-–—]\s+)(.+)$/;
const NOMBRE = /^([-+−]?\d[\d\s.,×x–\-/]*(?:\s?(?:kg|lb|km|m|min|s|h|ms|bpm|%|kcal|XP))?\s+)(.+)$/;

function traduireCoeur(norm: string, profondeur: number): string | null {
  const e = exact(norm);
  if (e != null) return e;
  const g = parGabarit(norm, profondeur);
  if (g != null) return g;
  if (profondeur > 3) return null;
  // « • texte », « 10 kg par haltère » : la puce ou le nombre en tête reste, la suite se traduit.
  const n = PUCE.exec(norm) ?? NOMBRE.exec(norm);
  if (n) {
    const t = traduireCoeur(n[2], profondeur + 1);
    if (t != null) return n[1] + t;
  }
  // Textes composés : « Pectoraux • Haltères », deux phrases dans un même Text, listes.
  for (const sep of SEPARATEURS) {
    const parts = norm.split(sep);
    if (parts.length < 3) continue;
    let change = false;
    const out = parts.map((x, i) => {
      if (i % 2 === 1 || !x.trim()) return x;
      const t = traduireCoeur(x.trim(), profondeur + 1);
      if (t == null) return x;
      change = true;
      return t;
    });
    if (change) return out.join('');
  }
  const phrases = norm.match(PHRASES);
  if (phrases && phrases.length > 1) {
    let change = false;
    const out = phrases.map((x) => {
      const t = traduireCoeur(x.trim(), profondeur + 1);
      if (t == null) return x;
      change = true;
      return t + (x.endsWith(' ') ? ' ' : '');
    });
    if (change) return out.join('').trim();
  }
  return null;
}

function traduireInterne(s: string, profondeur = 0): string {
  const coeur = s.trim();
  if (!coeur || !/[a-zA-ZÀ-ÿ]/.test(coeur)) return s;
  const norm = coeur.replace(/\s+/g, ' ');
  const t = traduireCoeur(norm, profondeur);
  if (t == null) return s;
  // Garde les espaces autour (« · », morceaux de phrase dans un même Text).
  return s.slice(0, s.indexOf(coeur[0])) + t + s.slice(s.lastIndexOf(coeur[coeur.length - 1]) + 1);
}

/** Traduit un texte affiché dans la langue active (le français est rendu tel quel). */
export function traduire(s: string): string;
export function traduire(s: string | null | undefined): string | null | undefined;
export function traduire(s: string | null | undefined) {
  if (langue === 'fr' || !s) return s;
  const c = cache.get(s);
  if (c !== undefined) return c;
  const t = traduireInterne(s);
  if (cache.size > 4000) cache.clear();
  cache.set(s, t);
  return t;
}

/** Raccourci pour le code : `t('Lancer la séance')`. */
export const t = traduire;

// Les fonctions pures de `src/lib` traduisent par `tr()` (voir lib/langue.ts).
brancherTraduction(traduire, locale());

/** Titre et texte d'une notification du téléphone dans la langue active. */
export function contenuTraduit<C extends { title?: string | null; subtitle?: string | null; body?: string | null }>(c: C): C {
  if (langue === 'fr') return c;
  return { ...c, title: traduire(c.title), subtitle: traduire(c.subtitle), body: traduire(c.body) };
}
