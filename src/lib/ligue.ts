/** Semaine de la Ligue : XP de la semaine, activité, date du lundi (myWeekXp, weekLogs, teamActiveN du prototype). */
import { weekDates } from './semaine';
import type { Log } from './xp';

/** Lundi de la semaine en cours, en date locale AAAA-MM-JJ (clé de la semaine sur le serveur). */
export function lundiISO(now: Date = new Date()): string {
  const m = weekDates(now)[0];
  return m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-' + String(m.getDate()).padStart(2, '0');
}

/** Au moins une séance ou sortie cette semaine (weekLogs().length). */
export const actifSemaine = (logs: readonly Log[], now: Date = new Date()) => {
  const m = weekDates(now)[0];
  return logs.some((l) => new Date(l.d) >= m);
};

/** XP gagnée depuis lundi (myWeekXp). */
export function xpSemaine(xpLog: readonly { d: string; xp: number }[], now: Date = new Date()): number {
  const m = +weekDates(now)[0];
  return xpLog.filter((x) => +new Date(x.d) >= m).reduce((a, x) => a + x.xp, 0);
}

/** Membres actifs de l'équipe cette semaine, moi compris (teamActiveN). */
export const actifsEquipe = (autresActifs: number, logs: readonly Log[], now?: Date) => autresActifs + (actifSemaine(logs, now) ? 1 : 0);
