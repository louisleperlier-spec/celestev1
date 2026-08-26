/**
 * Heures miroir — moments où l'heure "se répète" (11:11) ou "se reflète" (12:21).
 * Signification tirée de la tradition des heures miroir / nombres angéliques.
 */

export type MirrorHour = { label: string; hour: number; minute: number; meaning: string };

const MEANINGS: Record<string, string> = {
  '00:00': "Un nouveau départ s'ouvre à toi. Pose une intention claire.",
  '01:01': 'Tu es sur la bonne voie : garde confiance en ce que tu construis seul·e.',
  '02:02': "Une décision demande de l'harmonie. Écoute ton intuition autant que ta raison.",
  '03:03': 'Les énergies créatives sont fortes : exprime-toi, ose.',
  '04:04': 'Tes fondations sont solides. Continue, patiemment.',
  '05:05': 'Un changement arrive — accueille-le, il te sert.',
  '10:01': 'Ce que tu sèmes maintenant portera ses fruits. Reste aligné·e.',
  '11:11': "Portail puissant : tes pensées se manifestent vite, choisis-les avec soin.",
  '12:21': 'Équilibre entre toi et les autres. Un cycle se referme en douceur.',
  '13:31': 'Une opportunité inattendue se prépare — reste attentif·ve.',
  '14:41': "Ton travail est vu, même en silence. Persévère.",
  '15:51': 'Un lâcher-prise est nécessaire pour avancer.',
  '20:02': "Une relation ou un partenariat s'apaise.",
  '21:12': "Tu retrouves ton axe après une période d'incertitude.",
  '22:22': "Alignement total : corps, cœur et esprit avancent ensemble.",
  '23:32': 'Une page se tourne avec douceur — fais-lui confiance.',
};

const GENERIC_MEANING = 'Un rappel discret : reviens à ta respiration, tu es exactement où tu dois être.';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function isMirrorTime(hour: number, minute: number): boolean {
  const h = pad(hour);
  const m = pad(minute);
  // Répétée (11:11, 22:22) ou reflétée (12:21, 21:12, 13:31…)
  return h === m || h === m.split('').reverse().join('');
}

/** Toutes les heures miroir de la journée (0h → 23h59), triées. */
export function listMirrorHours(): MirrorHour[] {
  const hours: MirrorHour[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m++) {
      if (isMirrorTime(h, m)) {
        const label = `${pad(h)}:${pad(m)}`;
        hours.push({ label, hour: h, minute: m, meaning: MEANINGS[label] ?? GENERIC_MEANING });
      }
    }
  }
  return hours;
}

const ALL_MIRROR_HOURS = listMirrorHours();

/** La prochaine heure miroir à venir à partir de maintenant. */
export function getNextMirrorHour(now: Date = new Date()): { at: Date; hour: MirrorHour; inMinutes: number } {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const next =
    ALL_MIRROR_HOURS.find((h) => h.hour * 60 + h.minute > nowMinutes) ?? ALL_MIRROR_HOURS[0];

  const at = new Date(now);
  at.setHours(next.hour, next.minute, 0, 0);
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);

  const inMinutes = Math.round((at.getTime() - now.getTime()) / 60_000);

  return { at, hour: next, inMinutes };
}
