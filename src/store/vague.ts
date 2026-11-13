import { requireOptionalNativeModule } from 'expo';
import { Platform, type GestureResponderEvent } from 'react-native';

/**
 * Vagues de transition (DistortionWavesKit de Libraries.dev, MIT, demandées par l'utilisateur, nov. 2026) : une vague colorée part
 * du bouton touché et emporte l'écran vers le suivant. Module natif `NeaVagues` (build 40+, iOS 17+) ; sans lui (Expo Go, build
 * plus ancien, Android, navigateur), la navigation se fait comme avant.
 */
type ModuleVagues = {
  disponible(): boolean;
  ouvrir(json: string): Promise<boolean>;
  reveler(): Promise<boolean>;
  annuler(): Promise<void>;
};

const natif = Platform.OS === 'ios' ? requireOptionalNativeModule<ModuleVagues>('NeaVagues') : null;
let dispo: boolean | null = null;

export function vaguesDisponibles(): boolean {
  if (dispo === null) {
    try {
      dispo = !!natif?.disponible();
    } catch {
      dispo = false;
    }
  }
  return dispo;
}

/** `vertical` : vers le haut depuis un bouton du bas ; `horizontal` : depuis la gauche ; `center` : en anneau depuis un rond. */
export type TypeVague = 'vertical' | 'horizontal' | 'center';

let enCours = false;
/** Lu par les options des écrans (`_layout`) : pendant une vague, l'écran arrive sans animation, la vague la remplace. */
export const sansAnimation = () => enCours;

type Rect = { x: number; y: number; w: number; h: number };
type Mesurable = { measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void };

const mesurer = (cible: unknown) =>
  new Promise<Rect | null>((ok) => {
    const v = cible as Mesurable | null;
    if (!v?.measureInWindow) return ok(null);
    const t = setTimeout(() => ok(null), 300);
    v.measureInWindow((x, y, w, h) => {
      clearTimeout(t);
      ok(w > 0 && h > 0 ? { x, y, w, h } : null);
    });
  });

const deuxImages = () => new Promise<void>((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok())));
const pause = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

/**
 * Navigue avec une vague partie de la vue touchée (`e.currentTarget`, à l'endroit du doigt). `naviguer` fait la vraie navigation ;
 * elle est toujours appelée, vague ou pas.
 */
export async function avecVague(e: GestureResponderEvent | undefined, type: TypeVague, naviguer: () => void): Promise<void> {
  if (!e || enCours || !natif || !vaguesDisponibles()) return naviguer();
  const fx = e.nativeEvent?.pageX ?? 0;
  const fy = e.nativeEvent?.pageY ?? 0;
  const source = await mesurer(e.currentTarget);
  if (!source) return naviguer();
  let ouverte = false;
  try {
    ouverte = await natif.ouvrir(JSON.stringify({ ...source, fx, fy, type }));
  } catch {
    ouverte = false;
  }
  if (!ouverte) return naviguer();
  enCours = true;
  try {
    naviguer();
    // Le nouvel écran se dessine sous la photo figée, puis la vague l'emporte.
    await deuxImages();
    await pause(90);
    await natif.reveler();
  } catch {
    await natif.annuler().catch(() => undefined);
  } finally {
    enCours = false;
  }
}
