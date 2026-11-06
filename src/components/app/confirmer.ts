import { Alert, Platform } from 'react-native';

/** Demande de confirmation (confirm() du prototype). */
export function confirmer(titre: string, texte: string, action: string, ok: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${titre} ${texte}`)) ok();
    return;
  }
  Alert.alert(titre, texte, [
    { text: 'Annuler', style: 'cancel' },
    { text: action, style: 'destructive', onPress: ok },
  ]);
}
