/**
 * Confort de lecture (pour ceux qui voient un peu mal) : textes agrandis sur la fiche exercice et pendant la séance.
 * Réglage gardé sur le téléphone (`nea-lecture`).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Lecture = { grand: boolean; basculer: () => void };

export const useLecture = create<Lecture>()(
  persist((set, get) => ({ grand: false, basculer: () => set({ grand: !get().grand }) }), {
    name: 'nea-lecture',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (s) => ({ grand: s.grand }),
  }),
);

/** Taille de police (et interligne) agrandie de 30 % en mode « grand texte ». */
export function taille(grand: boolean, fontSize: number, lineHeight: number) {
  const k = grand ? 1.3 : 1;
  return { fontSize: Math.round(fontSize * k * 2) / 2, lineHeight: Math.round(lineHeight * k) };
}
