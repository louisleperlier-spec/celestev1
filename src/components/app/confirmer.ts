import { Alert, Platform } from 'react-native';
import { traduire } from '@/i18n';

/** Demande de confirmation (confirm() du prototype). */
export function confirmer(titre: string, texte: string, action: string, ok: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${traduire(titre)} ${traduire(texte)}`)) ok();
    return;
  }
  Alert.alert(traduire(titre), traduire(texte), [
    { text: traduire('Annuler'), style: 'cancel' },
    { text: traduire(action), style: 'destructive', onPress: ok },
  ]);
}
