/**
 * SelfMax est dark-only pour l'instant : on renvoie toujours la palette sombre,
 * quel que soit le réglage système.
 */

import { Colors } from '@/constants/theme';

export function useTheme() {
  return Colors.dark;
}
