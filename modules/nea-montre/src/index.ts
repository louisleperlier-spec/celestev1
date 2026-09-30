import { requireOptionalNativeModule } from 'expo';

type Module = {
  estDisponible(): boolean;
  envoyerEtat(json: string): void;
  /** Messages de la montre reçus avant l'écoute : type (seance, velo, mesure, coach) + JSON. */
  recupererEnAttente(): { type: string; json: string }[];
  addListener(evt: 'messageMontre', f: (e: { type: string; json: string }) => void): { remove(): void };
  /** Données des widgets (JSON) dans le groupe d'apps partagé, puis rafraîchit les widgets. */
  ecrireWidget(json: string): void;
};

/** Module natif de liaison avec l'Apple Watch ; absent dans Expo Go, le navigateur et Android. */
export const NeaMontre = requireOptionalNativeModule<Module>('NeaMontre');
