import { requireOptionalNativeModule } from 'expo';

type Module = {
  estDisponible(): boolean;
  envoyerEtat(json: string): void;
  /** Messages de la montre reçus avant l'écoute : type (seance, velo, mesure, coach) + JSON. */
  recupererEnAttente(): { type: string; json: string }[];
  addListener(evt: 'messageMontre', f: (e: { type: string; json: string }) => void): { remove(): void };
  /** Données des widgets (JSON) dans le groupe d'apps partagé, puis rafraîchit les widgets. */
  ecrireWidget(json: string): void;
  /** Réglages des alertes santé (VFC toutes les heures, eau, vélo, pas) : notifications posées par l'iPhone, même app fermée. */
  configurerAlertes(json: string): void;
  /** Lance l'app NÉA de la montre (build 18+), qui ouvre la séance choisie sur l'iPhone. */
  ouvrirSurMontre?(): void;
  /** Activité en direct d'un sport (build 24+) : écran verrouillé et Dynamic Island. */
  demarrerActivite?(sport: string, symbole: string, debutMs: number): boolean;
  majActivite?(bpm: number, debutMs: number, pause: boolean, ecoule: number, kcal: number): void;
  finActivite?(bpm: number, ecoule: number, kcal: number, garder: boolean): void;
  /** Moments NÉA sur l'écran verrouillé (build 26+) : JSON { type, titre, sous, symbole, image, finMs?, valeur?, finTexte?, visibleMin? }. */
  demarrerMoment?(json: string): boolean;
  /** Termine les moments de ce type ('' = tous). */
  finMoment?(type: string): void;
};

/** Module natif de liaison avec l'Apple Watch ; absent dans Expo Go, le navigateur et Android. */
export const NeaMontre = requireOptionalNativeModule<Module>('NeaMontre');
