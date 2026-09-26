/**
 * Sommeil et récupération : score de nuit, VFC de référence, état de récupération, saisie d'une nuit.
 * Portage fidèle du prototype (`sleepScore`, `lastNight`, `baseHrv`, `recovStatus`, `hm`, `sleepSheet`).
 */

/** Une nuit (clé = date du coucher, AAAA-MM-JJ). */
export type Nuit = { d: string; h: number; q: number; hrv: number | null; rhr: number | null };

/** Une mesure de récupération d'1 minute. `matin` avant 11 h, sinon `post` (après entraînement). */
export type MesureVFC = { d: string; hrv: number; bpm: number; kind: 'matin' | 'post' };

/** VFC de référence : moyenne des VFC nocturnes et des mesures du matin, 45 ms par défaut (baseHrv). */
export function baseHrv(nights: readonly Nuit[], checks: readonly MesureVFC[]): number {
  const v = [...nights.map((n) => n.hrv), ...checks.filter((c) => c.kind === 'matin').map((c) => c.hrv)].filter((x): x is number => !!x);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 45;
}

/** Score de nuit sur 100 : durée (50 pts, 8 h = max) + qualité (25) + VFC nocturne / référence (25, 12,5 sans VFC). */
export function sleepScore(n: Nuit | null, base: number): number | null {
  if (!n) return null;
  const dur = Math.min(1, n.h / 8) * 50;
  const q = (n.q / 5) * 25;
  const hv = n.hrv ? Math.min(1, n.hrv / base) * 25 : 12.5;
  return Math.round(dur + q + hv);
}

/** Dernière nuit si elle date d'hier ou d'aujourd'hui (lastNight). */
export function lastNight(nights: readonly Nuit[], now: Date = new Date()): Nuit | null {
  const n = nights[nights.length - 1];
  if (!n) return null;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return n.d >= y.toISOString().slice(0, 10) ? n : null;
}

export type EtatRecup = readonly [titre: string, couleur: string, conseil: string];

/** État de récupération selon la VFC mesurée par rapport à la référence (recovStatus). */
export function recovStatus(hrv: number, base: number): EtatRecup {
  const r = hrv / base;
  return r >= 0.9
    ? ['Bien récupéré', '#3ee07a', "Ta VFC est dans ta moyenne : tu peux t'entraîner normalement."]
    : r >= 0.75
      ? ['Récupération en cours', '#ffd21f', 'Ta VFC est un peu basse : garde une intensité modérée.']
      : ['Fatigue élevée', '#ff3b5c', 'Ta VFC est nettement sous ta moyenne : privilégie le repos ou une séance douce.'];
}

/** Conseil selon le score (sleephead, bilan de nuit). */
export const conseilNuit = (sc: number) => (sc >= 75 ? 'Prêt pour ta séance' : sc >= 55 ? 'Séance modérée conseillée' : 'Journée légère conseillée');

/** « 23:15 » → minutes depuis minuit (hm). */
export const hm = (s: string) => {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
};

/** « 7:5 », « 0730 », « 7h30 » → « 07:30 » ; vide si l'heure n'est pas valable. */
export function heure(s: string): string {
  const m = s.trim().match(/^(\d{1,2})[:h ]?(\d{2})$/);
  if (!m) return '';
  const h = Number(m[1]);
  const mn = Number(m[2]);
  return h < 24 && mn < 60 ? String(h).padStart(2, '0') + ':' + String(mn).padStart(2, '0') : '';
}

/**
 * Nuit saisie (bouton « Enregistrer » de sleepSheet) : durée entre coucher et réveil, clé = veille avant 15 h,
 * VFC gardée entre 5 et 250 ms, FC au repos entre 30 et 120.
 */
export function nouvelleNuit(coucher: string, reveil: string, q: number, hv: number, rh: number, now: Date = new Date()): Nuit {
  const b = hm(coucher || '23:00');
  const w = hm(reveil || '07:00');
  const h = ((w - b + 1440) % 1440) / 60;
  const d = new Date(now);
  if (d.getHours() < 15) d.setDate(d.getDate() - 1);
  return { d: d.toISOString().slice(0, 10), h: +h.toFixed(1), q, hrv: hv > 5 && hv < 250 ? hv : null, rhr: rh > 30 && rh < 120 ? rh : null };
}

/** Ajoute ou remplace la nuit, triée par date, 60 nuits au plus. */
export function ajouterNuit(nights: readonly Nuit[], n: Nuit): Nuit[] {
  const out = [...nights.filter((x) => x.d !== n.d), n].sort((a, b) => (a.d < b.d ? -1 : 1));
  return out.length > 60 ? out.slice(1) : out;
}
