/** Petits helpers date — pas de lib externe, l'app n'en a pas besoin. */

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Les `count` derniers jours, du plus ancien au plus récent, en clé `YYYY-MM-DD`. */
export function lastNDayKeys(count: number, from: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(dateKey(addDays(from, -i)));
  }
  return keys;
}

export function isSameDayKey(isoDate: string, key: string): boolean {
  return dateKey(new Date(isoDate)) === key;
}
