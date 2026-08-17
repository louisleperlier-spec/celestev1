import { Colors } from '@/constants/theme';

/**
 * Lume est mono-thème par design (fond noir, accent vert — la DA de vérité de l'app).
 * Ce hook existe pour que les écrans consomment toujours les tokens, jamais une couleur en dur.
 */
export function useTheme() {
  return Colors;
}
