/**
 * Sons de la partie Sommeil (expo-audio, chargé à la demande) :
 * - ambiance de nuit en boucle au choix (Vagues lentes, Nuit calme, Bruit doux ; la pluie a été retirée), volume, arrêt programmé
 *   (fondu sur 20 s) ; joue écran verrouillé et en mode silencieux (`enableBackgroundPlayback` dans app.json) ; jamais lancée seule ;
 * - aperçu des sonneries du réveil (`ecouterSonnerie`).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AudioPlayer, AudioSource } from 'expo-audio';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SonReveil } from '@/lib/reveil';

export type SonNuit = 'vagues' | 'calme' | 'brun';
export const SONS_NUIT: Record<SonNuit, { nom: string; desc: string }> = {
  vagues: { nom: 'Vagues lentes', desc: 'La mer qui va et vient' },
  calme: { nom: 'Nuit calme', desc: 'Nappe d’accords très douce' },
  brun: { nom: 'Bruit doux', desc: 'Souffle grave et régulier' },
};

/* eslint-disable @typescript-eslint/no-require-imports */
const FICHIERS_NUIT: Record<SonNuit, AudioSource> = {
  vagues: require('@/assets/sons/nuit_vagues.wav'),
  calme: require('@/assets/sons/nuit_calme.wav'),
  brun: require('@/assets/sons/nuit_brun.wav'),
};
const FICHIERS_REVEIL: Record<Exclude<SonReveil, 'iphone'>, AudioSource> = {
  doux: require('@/assets/sons/reveil_doux.wav'),
  classique: require('@/assets/sons/reveil_classique.wav'),
  soleil: require('@/assets/sons/reveil_soleil.wav'),
};

type Audio = typeof import('expo-audio');
let audio: Audio | null | undefined;
function chargerAudio(): Audio | null {
  if (audio !== undefined) return audio;
  try {
    // Chargé à la demande : les builds sans expo-audio (avant le 26) ne plantent pas en recevant une mise à jour.
    audio = require('expo-audio') as Audio;
    void audio.setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
  } catch {
    audio = null;
  }
  return audio;
}
/* eslint-enable @typescript-eslint/no-require-imports */

type Sons = {
  son: SonNuit;
  joue: boolean;
  volume: number;
  /** Fin programmée (ms) ou null (sans arrêt). */
  arretA: number | null;
  choisir: (s: SonNuit) => void;
  jouer: (minutes?: number | null) => void;
  pause: () => void;
  regler: (v: number) => void;
  programmerArret: (minutes: number | null) => void;
};

let lecteur: AudioPlayer | null = null;
let charge: SonNuit | null = null;
let minuteur: ReturnType<typeof setInterval> | null = null;

function lecteurPour(s: SonNuit): AudioPlayer | null {
  const a = chargerAudio();
  if (!a) return null;
  try {
    if (!lecteur) lecteur = a.createAudioPlayer(FICHIERS_NUIT[s]);
    else if (charge !== s) lecteur.replace(FICHIERS_NUIT[s]);
    charge = s;
    lecteur.loop = true;
  } catch {
    return null;
  }
  return lecteur;
}

export const useSons = create<Sons>()(
  persist(
    (set, get) => {
      const surveiller = () => {
        if (minuteur) clearInterval(minuteur);
        minuteur = setInterval(() => {
          const { arretA, volume, joue } = get();
          const l = lecteur;
          if (!joue || !l || arretA == null) return;
          const reste = arretA - Date.now();
          if (reste <= 0) get().pause();
          else if (reste < 20_000) l.volume = volume * (reste / 20_000);
        }, 1000);
      };
      return {
        son: 'vagues',
        joue: false,
        volume: 0.5,
        arretA: null,
        choisir: (s) => {
          set({ son: s });
          if (get().joue) get().jouer();
        },
        jouer: (minutes) => {
          arreterApercu();
          const l = lecteurPour(get().son);
          if (!l) return;
          l.volume = get().volume;
          l.play();
          // Sans durée : on garde l'arrêt prévu, ou 30 min s'il est déjà passé.
          const prevu = get().arretA;
          const garde = prevu == null || prevu > Date.now() ? prevu : Date.now() + 30 * 60_000;
          const arretA = minutes === undefined ? garde : minutes == null ? null : Date.now() + minutes * 60_000;
          set({ joue: true, arretA });
          surveiller();
        },
        pause: () => {
          lecteur?.pause();
          if (minuteur) clearInterval(minuteur);
          minuteur = null;
          set({ joue: false });
        },
        regler: (v) => {
          const volume = Math.max(0, Math.min(1, v));
          if (lecteur) lecteur.volume = volume;
          set({ volume });
        },
        programmerArret: (minutes) => set({ arretA: minutes == null ? null : Date.now() + minutes * 60_000 }),
      };
    },
    {
      name: 'nea-sons',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ son: s.son, volume: s.volume }),
      merge: (p, cur) => {
        const v = (p ?? {}) as Partial<Sons>;
        return { ...cur, son: v.son && v.son in SONS_NUIT ? v.son : cur.son, volume: typeof v.volume === 'number' ? v.volume : cur.volume };
      },
    },
  ),
);

/* ---------------------------------------------------------------- aperçu des sonneries */

let apercu: AudioPlayer | null = null;
let apercuFin: ReturnType<typeof setTimeout> | null = null;

export function arreterApercu() {
  if (apercuFin) clearTimeout(apercuFin);
  apercuFin = null;
  if (apercu) {
    apercu.pause();
    apercu.remove();
    apercu = null;
  }
}

/** Fait écouter une sonnerie du réveil pendant 8 s (à un volume déjà « monté »). Retourne false si rien à jouer. */
export function ecouterSonnerie(s: SonReveil): boolean {
  arreterApercu();
  if (s === 'iphone') return false;
  const a = chargerAudio();
  if (!a) return false;
  if (useSons.getState().joue) useSons.getState().pause();
  try {
    apercu = a.createAudioPlayer(FICHIERS_REVEIL[s]);
    apercu.volume = 0.9;
    // On part du milieu : la sonnerie commence très bas puis monte.
    void apercu.seekTo(12).catch(() => {});
    apercu.play();
    apercuFin = setTimeout(arreterApercu, 8000);
    return true;
  } catch {
    apercu = null;
    return false;
  }
}
