import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnTetePage } from '@/components/app/Catalogue';
import { Icon, Text } from '@/components/ui';
import { useCercles } from '@/store/cercles';
import { useProfil, useSemaine } from '@/store/profil';
import { nextSession } from '@/lib/semaine';
import { part } from '@/lib/cercles';
import { colors, ui } from '@/theme';

const ETAPES = [
  "Sur l'écran d'accueil de l'iPhone, reste appuyé sur un espace vide jusqu'à ce que les apps bougent.",
  'Touche « Modifier » en haut à gauche, puis « Ajouter un widget ».',
  'Cherche NÉA, choisis le widget et sa taille, puis « Ajouter le widget ».',
  "Pour l'écran verrouillé : reste appuyé dessus, « Personnaliser », puis la zone des widgets.",
];

/** Widgets de l'iPhone : aperçu et marche à suivre pour les ajouter. */
export default function Widgets() {
  const name = useProfil((s) => s.name);
  const { semaine, auj } = useCercles();
  const s = nextSession(useSemaine()).s;
  const jour = semaine[auj];
  const pct = (id: string) => Math.round(Math.min(1, part(jour.find((c) => c.id === id)!)) * 100);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <EnTetePage titre="Widgets de l'iPhone" sous="Ta journée NÉA sans ouvrir l'app" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text weight="semibold" style={styles.h3}>
          Aperçu
        </Text>
        <View style={styles.apercus}>
          {/* Petit : bilan du jour */}
          <View style={[styles.widget, styles.petit]}>
            <Text weight="bold" style={styles.marque}>
              NÉA
            </Text>
            {(
              [
                ['Effort', Math.round((pct('bouger') + pct('exercice')) / 2)],
                ['Récup.', pct('recup')],
                ['Sommeil', pct('sommeil')],
              ] as const
            ).map(([l, v]) => (
              <View key={l} style={styles.barreLigne}>
                <Text style={styles.barreTxt}>{l}</Text>
                <View style={styles.barre}>
                  <View style={[styles.barreFill, { width: `${v}%` }]} />
                </View>
              </View>
            ))}
          </View>
          {/* Moyen : prochaine séance */}
          <View style={[styles.widget, styles.moyen]}>
            <Text weight="bold" style={styles.marque}>
              NÉA
            </Text>
            <Text style={styles.wSous}>Bonjour {name}</Text>
            <Text weight="bold" style={styles.wTitre} numberOfLines={2}>
              {s.titre}
            </Text>
            <Text style={styles.wSous}>
              {s.min} min • {s.items.length} exercices
            </Text>
          </View>
        </View>
        <Text style={styles.note}>
          Bilan du jour (petit), prochaine séance (moyen) et widgets d&apos;écran verrouillé : ouvre NÉA une fois pour les remplir.
        </Text>

        <Text weight="semibold" style={styles.h3}>
          Les ajouter
        </Text>
        <View style={styles.groupe}>
          {ETAPES.map((e, i) => (
            <View key={i} style={[styles.etape, i > 0 && styles.sep]}>
              <View style={styles.num}>
                <Text weight="bold" style={styles.numTxt}>
                  {i + 1}
                </Text>
              </View>
              <Text style={styles.etapeTxt}>{e}</Text>
            </View>
          ))}
        </View>
        <View style={styles.info}>
          <Icon name="info" size={20} color={colors.textSecondary} />
          <Text style={styles.infoTxt}>Les widgets se mettent à jour chaque fois que tu ouvres NÉA ou que tu termines une séance.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  h3: { fontSize: 19, lineHeight: 24, marginTop: 12, marginBottom: 12 },
  apercus: { flexDirection: 'row', gap: 12 },
  widget: { height: 150, borderRadius: 22, backgroundColor: ui.carte, padding: 14, gap: 6 },
  petit: { width: 150 },
  moyen: { flex: 1 },
  marque: { fontSize: 13, lineHeight: 17, color: colors.pink, letterSpacing: 0.5 },
  barreLigne: { gap: 3 },
  barreTxt: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  barre: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, overflow: 'hidden' },
  barreFill: { height: '100%', backgroundColor: colors.pink, borderRadius: 3 },
  wTitre: { fontSize: 17, lineHeight: 22 },
  wSous: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  note: { fontSize: 13, lineHeight: 18, color: colors.textTertiary, marginTop: 10 },
  groupe: { borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden' },
  sep: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  etape: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  numTxt: { fontSize: 14, lineHeight: 18, color: colors.onPrimary },
  etapeTxt: { flex: 1, fontSize: 15, lineHeight: 21 },
  info: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: colors.surface },
  infoTxt: { flex: 1, fontSize: 14, lineHeight: 19, color: colors.textSecondary },
});
