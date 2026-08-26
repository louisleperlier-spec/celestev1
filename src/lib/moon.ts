/**
 * Phase lunaire calculée localement (aucune API) — précision suffisante pour un usage
 * de bien-être (±quelques heures), à partir d'une nouvelle lune de référence connue et
 * de la durée du cycle synodique moyen. Zéro dépendance réseau = zéro latence, zéro coût.
 */

const SYNODIC_MONTH_DAYS = 29.530588853;
// Nouvelle lune de référence : 6 janvier 2000, 18:14 UTC.
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

export type MoonPhaseKey =
  | 'new'
  | 'waxing-crescent'
  | 'first-quarter'
  | 'waxing-gibbous'
  | 'full'
  | 'waning-gibbous'
  | 'last-quarter'
  | 'waning-crescent';

export type MoonPhase = {
  key: MoonPhaseKey;
  age: number; // jours depuis la dernière nouvelle lune (0 → ~29.53)
  illumination: number; // 0 → 1
  label: string;
  ritual: string;
};

const PHASES: { key: MoonPhaseKey; label: string; ritual: string; upTo: number }[] = [
  { key: 'new', label: 'Nouvelle lune', ritual: 'Pose une intention nouvelle pour ce cycle.', upTo: 1.84566 },
  {
    key: 'waxing-crescent',
    label: 'Premier croissant',
    ritual: "Prends une première petite action vers ton intention.",
    upTo: 5.53699,
  },
  {
    key: 'first-quarter',
    label: 'Premier quartier',
    ritual: 'Un obstacle se présente : ajuste sans abandonner.',
    upTo: 9.22831,
  },
  {
    key: 'waxing-gibbous',
    label: 'Gibbeuse croissante',
    ritual: 'Affine ton projet, la lune monte en puissance avec toi.',
    upTo: 12.91963,
  },
  { key: 'full', label: 'Pleine lune', ritual: 'Célèbre ce qui a mûri et libère ce qui pèse.', upTo: 16.61096 },
  {
    key: 'waning-gibbous',
    label: 'Gibbeuse décroissante',
    ritual: 'Partage ta gratitude pour ce que ce cycle a apporté.',
    upTo: 20.30228,
  },
  {
    key: 'last-quarter',
    label: 'Dernier quartier',
    ritual: 'Fais le tri : lâche ce qui ne te sert plus.',
    upTo: 23.99361,
  },
  {
    key: 'waning-crescent',
    label: 'Dernier croissant',
    ritual: 'Repose-toi avant le prochain cycle.',
    upTo: 27.68493,
  },
];

export function getMoonPhase(date: Date = new Date()): MoonPhase {
  const daysSince = (date.getTime() - KNOWN_NEW_MOON) / 86_400_000;
  const age = ((daysSince % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH_DAYS)) / 2;

  const phase = PHASES.find((p) => age <= p.upTo) ?? PHASES[0];

  return { key: phase.key, age, illumination, label: phase.label, ritual: phase.ritual };
}
