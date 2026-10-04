import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Conversation } from '@/components/app/Conversation';
import { colors } from '@/theme';

/** Discussion avec le coach IA (vChat du prototype), même écran que l'onglet Coach, avec un retour. */
export default function Chat() {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <Conversation retour />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
