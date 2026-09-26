import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailHead } from '@/components/app/Detail';
import { Warn } from '@/components/onboarding/Choices';
import { Text } from '@/components/ui';
import { CONDITIONS, CONFIDENTIALITE } from '@/data/legal';
import { colors, fonts } from '@/theme';

/** Conditions d'utilisation ou Politique de confidentialité (vLegal du prototype). */
export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc: 'conditions' | 'confidentialite' }>();
  const priv = doc === 'confidentialite';
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHead titre={priv ? 'Confidentialité' : 'Conditions'} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>{priv ? 'Politique de confidentialité' : "Conditions d'utilisation"}</Text>
        <Warn style={styles.warn}>Brouillon à faire valider par un juriste avant le lancement. Complète les champs entre crochets.</Warn>
        {(priv ? CONFIDENTIALITE : CONDITIONS).map(([h, p]) => (
          <Text key={h}>
            <Text weight="bold" style={styles.lgh}>
              {h + '\n'}
            </Text>
            <Text style={styles.lgp}>{p}</Text>
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 20, gap: 12 },
  h1: { fontFamily: fonts.black, fontSize: 24, lineHeight: 28, letterSpacing: -0.24, marginTop: 10 },
  warn: { marginVertical: 0 },
  lgh: { fontSize: 15, lineHeight: 26 },
  lgp: { fontSize: 13.5, lineHeight: 21, color: '#CFCFD6' },
});
