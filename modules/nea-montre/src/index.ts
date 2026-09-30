import { requireOptionalNativeModule } from 'expo';

type Module = {
  estDisponible(): boolean;
  envoyerEtat(json: string): void;
  recupererEnAttente(): string[];
  addListener(evt: 'seanceMontre', f: (e: { json: string }) => void): { remove(): void };
};

/** Module natif de liaison avec l'Apple Watch ; absent dans Expo Go, le navigateur et Android. */
export const NeaMontre = requireOptionalNativeModule<Module>('NeaMontre');
