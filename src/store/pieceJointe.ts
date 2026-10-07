/**
 * Mascotte NÉA jointe aux notifications du téléphone (vignette à droite, grande image quand on appuie longuement).
 * iOS déplace le fichier joint dans son propre stockage : on en copie un neuf dans le cache à chaque notification.
 * Une erreur (web, vieux build) donne simplement une notification sans image.
 */
import type { NotificationContentAttachmentIos } from 'expo-notifications';
import { Platform } from 'react-native';

import type { ExpressionMascotte } from '@/lib/enrage';

const PNG: Record<ExpressionMascotte, number> = {
  face: require('@/assets/mascotte/notif_face.png'),
  motive: require('@/assets/mascotte/notif_motive.png'),
  fatigue: require('@/assets/mascotte/notif_fatigue.png'),
  fier: require('@/assets/mascotte/notif_fier.png'),
  boude: require('@/assets/mascotte/notif_boude.png'),
};

const sources: Partial<Record<ExpressionMascotte, string>> = {};
let n = 0;

export async function pieceJointe(e: ExpressionMascotte): Promise<NotificationContentAttachmentIos[]> {
  if (Platform.OS !== 'ios') return [];
  try {
    const { Asset } = await import('expo-asset');
    const { File, Paths } = await import('expo-file-system');
    if (!sources[e]) {
      const a = await Asset.fromModule(PNG[e]).downloadAsync();
      if (!a.localUri) return [];
      sources[e] = a.localUri;
    }
    const copie = new File(Paths.cache, `nea-mascotte-${e}-${Date.now()}-${n++}.png`);
    new File(sources[e]!).copy(copie);
    return [{ identifier: 'mascotte', url: copie.uri, type: 'public.png', typeHint: 'public.png' }];
  } catch {
    return [];
  }
}
