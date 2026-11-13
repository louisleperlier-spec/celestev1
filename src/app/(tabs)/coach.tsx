import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

import { Conversation } from '@/components/app/Conversation';
import { colors } from '@/theme';

/** Onglet Coach (direction « nuit ») : la conversation avec ton coach, ses séances adaptées et la saisie. */
export default function Coach() {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <Conversation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
