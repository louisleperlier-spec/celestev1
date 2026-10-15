/** Tuiles Sommeil et VFC de l'Accueil (carte « Sommeil et VFC », masquable dans « Mon écran d'accueil »). */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { Appui, Card, Icon, Text, type IconName } from '@/components/ui';
import { lastNight } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { alpha, colors, ui } from '@/theme';

/** Une tuile : pastille d'icône colorée, libellé, grande valeur, chevron. */
function Tuile({ icone, couleur, nom, valeur, onPress }: { icone: IconName; couleur: string; nom: string; valeur: string; onPress: () => void }) {
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${nom} ${valeur}`} onPress={onPress} style={styles.flex}>
      <Card style={styles.tuile}>
        <View style={[styles.tuileIc, { backgroundColor: alpha(couleur, 0.16) }]}>
          <Icon name={icone} size={20} color={couleur} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.petit}>{nom}</Text>
          <Text weight="bold" style={styles.tuileVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {valeur}
          </Text>
        </View>
        <Icon name="right" size={16} color={colors.textSecondary} />
      </Card>
    </Appui>
  );
}

/** Sommeil de la dernière nuit et dernière VFC (mesure du matin, sinon nuit). */
export function TuilesSante() {
  const { nights, hrvChecks } = useProfil(useShallow((s) => ({ nights: s.nights, hrvChecks: s.hrvChecks })));
  const n = lastNight(nights);
  const h = n ? Math.floor(n.h) : 0;
  const m = n ? Math.round((n.h - h) * 60) : 0;
  const vfc = hrvChecks[hrvChecks.length - 1]?.hrv ?? n?.hrv ?? null;
  return (
    <View style={styles.tuiles}>
      <Tuile icone="moon" couleur={ui.tuileSommeil} nom="Sommeil" valeur={n ? `${h} h ${String(m).padStart(2, '0')}` : '—'} onPress={() => router.push('/sommeil')} />
      <Tuile icone="pulse" couleur={ui.tuileVfc} nom="VFC" valeur={vfc ? `${vfc} ms` : '—'} onPress={() => router.push('/recuperation')} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  petit: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  tuiles: { flexDirection: 'row', gap: 12 },
  tuile: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 12 },
  tuileIc: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  tuileVal: { fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
});
