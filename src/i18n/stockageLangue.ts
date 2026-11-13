import Storage from 'expo-sqlite/kv-store';

/** Choix de langue gardé sur l'appareil, lu de façon synchrone au démarrage (avant le premier affichage). */
export function lireChoix(): string | null {
  try {
    return Storage.getItemSync('nea-langue');
  } catch {
    return null;
  }
}

export function ecrireChoix(v: string | null) {
  try {
    if (v) Storage.setItemSync('nea-langue', v);
    else Storage.removeItemSync('nea-langue');
  } catch {
    // Sans stockage : la langue de l'appareil reste utilisée.
  }
}
