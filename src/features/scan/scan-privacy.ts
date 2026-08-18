import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_ACK_KEY = 'lume.scan.privacyAcknowledged.v1';

/** A-t-on déjà validé l'écran "Tes photos restent sur ton téléphone" ? */
export async function hasAcknowledgedScanPrivacy(): Promise<boolean> {
  return (await AsyncStorage.getItem(PRIVACY_ACK_KEY)) === 'true';
}

export async function setScanPrivacyAcknowledged(): Promise<void> {
  await AsyncStorage.setItem(PRIVACY_ACK_KEY, 'true');
}
