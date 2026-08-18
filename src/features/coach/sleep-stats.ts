import { dateKey } from '@/lib/date';
import { HealthSleepSample } from '@/services/health/healthkit';

export interface NightSleep {
  /** Clé du jour de RÉVEIL — une session commencée à 23h et finie à 7h le lendemain compte pour le jour du réveil. */
  date: string;
  asleepMinutes: number;
  bedTime: string | null;
  wakeTime: string | null;
}

export function groupSamplesByNight(samples: HealthSleepSample[]): NightSleep[] {
  const byNight = new Map<string, HealthSleepSample[]>();
  for (const sample of samples) {
    if (!sample.isAsleep) continue;
    const key = dateKey(new Date(sample.endedAt));
    const list = byNight.get(key) ?? [];
    list.push(sample);
    byNight.set(key, list);
  }

  const nights: NightSleep[] = [];
  for (const [date, list] of byNight) {
    const sorted = [...list].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    const asleepMinutes = Math.round(
      sorted.reduce((total, s) => total + (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000, 0),
    );
    nights.push({
      date,
      asleepMinutes,
      bedTime: sorted[0]?.startedAt ?? null,
      wakeTime: sorted[sorted.length - 1]?.endedAt ?? null,
    });
  }
  return nights.sort((a, b) => a.date.localeCompare(b.date));
}

export interface SleepSummary {
  nights: NightSleep[];
  averageMinutes: number;
}

/** Zéro donnée fabriquée : `averageMinutes` vaut 0 et `nights` est vide tant qu'Apple Santé n'a rien à offrir. */
export function summarizeSleep(samples: HealthSleepSample[]): SleepSummary {
  const nights = groupSamplesByNight(samples);
  const averageMinutes =
    nights.length > 0 ? Math.round(nights.reduce((total, n) => total + n.asleepMinutes, 0) / nights.length) : 0;
  return { nights, averageMinutes };
}
