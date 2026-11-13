/** Choix de langue gardé dans le navigateur. */
export function lireChoix(): string | null {
  try {
    return globalThis.localStorage?.getItem('nea-langue') ?? null;
  } catch {
    return null;
  }
}

export function ecrireChoix(v: string | null) {
  try {
    if (v) globalThis.localStorage?.setItem('nea-langue', v);
    else globalThis.localStorage?.removeItem('nea-langue');
  } catch {
    // Sans stockage : la langue du navigateur reste utilisée.
  }
}
