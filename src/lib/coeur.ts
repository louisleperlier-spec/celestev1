/**
 * Fréquence cardiaque et VFC simulées, en attendant Apple Santé (étape 6).
 * Portage fidèle de l'objet `HR` du prototype (tick, rmssd, zone) et de `hrStats`.
 */
import { hrMax } from './plan';

export type SourceFC = 'sim';

/** Noms des 5 zones cardio (zonesList du prototype). */
export const NOMS_ZONES = ['Récup', 'Endurance', 'Aérobie', 'Seuil', 'Max'] as const;

export class Coeur {
  bpm = 64;
  /** Intervalles RR en ms (les 300 derniers). */
  rr: number[] = [];
  src: SourceFC = 'sim';
  /** Intensité de l'effort, 0 à 1 (repos 0,05). */
  intensity = 0.05;
  /** Fatigue après une séance : ralentit le retour au calme. */
  fatigue = 0;

  constructor(
    public age: number,
    private random: () => number = Math.random,
  ) {}

  /** VFC (RMSSD) sur les n derniers intervalles. */
  rmssd(n = 40): number {
    const r = this.rr.slice(-n);
    if (r.length < 5) return 0;
    let s = 0;
    for (let i = 1; i < r.length; i++) s += (r[i] - r[i - 1]) ** 2;
    return Math.round(Math.sqrt(s / (r.length - 1)));
  }

  /** Zone 1 à 5 : 60, 70, 80, 90 % de la FC max. */
  zone(b = this.bpm): 1 | 2 | 3 | 4 | 5 {
    const p = b / hrMax(this.age);
    return p < 0.6 ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.9 ? 4 : 5;
  }

  /** Une seconde de simulation. */
  tick() {
    if (this.src !== 'sim') return;
    const f = this.fatigue || 0;
    this.fatigue = f * 0.9997;
    const rest = 62 + 10 * f;
    const target = rest + (hrMax(this.age) - rest) * this.intensity;
    this.bpm += (target - this.bpm) * 0.12 + (this.random() - 0.5) * 2.2;
    const base = 60000 / this.bpm;
    const sd = (6 + 48 * (1 - Math.min(1, this.intensity / 0.9))) * (1 - 0.5 * f);
    const n = Math.max(1, Math.round(this.bpm / 60));
    for (let i = 0; i < n; i++) this.rr.push(base + (this.random() - 0.5) * 2 * sd);
    if (this.rr.length > 300) this.rr.splice(0, this.rr.length - 300);
  }
}

/** Le cœur simulé de l'app, partagé entre les écrans (comme `HR` dans le prototype). */
let partage: Coeur | null = null;
export function coeur(age: number): Coeur {
  if (!partage) {
    partage = new Coeur(age);
    for (let i = 0; i < 40; i++) partage.tick();
  }
  partage.age = age;
  return partage;
}

export type StatsFC = { avg: number; max: number; hrv: number; z: [number, number, number, number, number] };

/** Moyenne, max, VFC (RR aberrants écartés) et secondes par zone. */
export function hrStats(samples: readonly number[], rr: readonly number[], age: number): StatsFC {
  if (!samples.length) return { avg: 0, max: 0, hrv: 0, z: [0, 0, 0, 0, 0] };
  const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
  const max = Math.round(Math.max(...samples));
  let s = 0;
  let n = 0;
  for (let i = 1; i < rr.length; i++) {
    const d = rr[i] - rr[i - 1];
    if (Math.abs(d) < 250) {
      s += d * d;
      n++;
    }
  }
  const z: StatsFC['z'] = [0, 0, 0, 0, 0];
  const c = new Coeur(age);
  samples.forEach((b) => z[c.zone(b) - 1]++);
  return { avg, max, hrv: n ? Math.round(Math.sqrt(s / n)) : 0, z };
}

/** « 01:05 » ou « 1:02:05 » (mmss du prototype). */
export function mmss(s: number): string {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0');
}
