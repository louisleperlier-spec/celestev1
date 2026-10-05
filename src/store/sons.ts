/**
 * Sons apaisants de la partie Sommeil : « Pluie douce » en boucle (expo-audio), volume, arrêt programmé (fondu sur 20 s).
 * Joue écran verrouillé et en mode silencieux (mode audio d'arrière-plan, `enableBackgroundPlayback` dans app.json).
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { create } from 'zustand';

type Sons = {
  joue: boolean;
  volume: number;
  /** Fin programmée (ms) ou null (sans arrêt). */
  arretA: number | null;
  jouer: (minutes?: number | null) => void;
  pause: () => void;
  regler: (v: number) => void;
  programmerArret: (minutes: number | null) => void;
};

let lecteur: AudioPlayer | null = null;
let minuteur: ReturnType<typeof setInterval> | null = null;

function obtenir(): AudioPlayer | null {
  if (lecteur) return lecteur;
  try {
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
    lecteur = createAudioPlayer(require('@/assets/sons/pluie.wav'));
    lecteur.loop = true;
  } catch {
    lecteur = null;
  }
  return lecteur;
}

export const PLUIE = 'Pluie douce';

export const useSons = create<Sons>()((set, get) => {
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
    joue: false,
    volume: 0.6,
    arretA: null,
    jouer: (minutes) => {
      const l = obtenir();
      if (!l) return;
      l.volume = get().volume;
      l.play();
      const arretA = minutes === undefined ? get().arretA : minutes == null ? null : Date.now() + minutes * 60_000;
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
});
