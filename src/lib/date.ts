export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day; // ramène au lundi
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export const WEEKDAY_LABELS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
export const WEEKDAY_LABELS_FULL = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];
export const MONTH_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export function formatDayLong(d: Date): string {
  const weekday = WEEKDAY_LABELS_FULL[(d.getDay() + 6) % 7];
  return `${weekday} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function isSameDateKey(a: Date, key: string): boolean {
  return toDateKey(a) === key;
}
