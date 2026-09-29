import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { Card, Text } from '@/components/ui';
import { dec } from '@/lib/charges';
import { part, type Cercle, type IdCercle } from '@/lib/cercles';
import { rafraichirActivite, useCercles } from '@/store/cercles';
import { alpha, colors, heartZones } from '@/theme';

/** Couleur de chaque cercle (de l'extérieur vers l'intérieur). */
export const COULEURS_CERCLES: Record<IdCercle, string> = {
  bouger: colors.pink,
  exercice: colors.green,
  sommeil: heartZones.z1,
  recup: heartZones.z3,
};

/** Cercles concentriques, comme les anneaux d'activité d'Apple. */
export function Anneaux({ cercles, size, trait }: { cercles: readonly Cercle[]; size: number; trait: number }) {
  const ecart = trait * 0.25;
  return (
    <Svg width={size} height={size}>
      {cercles.map((c, i) => {
        const r = size / 2 - trait / 2 - i * (trait + ecart);
        if (r <= trait / 2) return null;
        const tour = 2 * Math.PI * r;
        const p = Math.min(1, Math.max(0, part(c)));
        const col = COULEURS_CERCLES[c.id];
        return (
          <G key={c.id}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={alpha(col, 0.18)} strokeWidth={trait} fill="none" />
            {p > 0 && (
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={col}
                strokeWidth={trait}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${tour * p} ${tour}`}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            )}
          </G>
        );
      })}
    </Svg>
  );
}

const valeur = (c: Cercle) => (c.unite === 'h' ? dec(c.val.toFixed(1)) : String(c.val));
const objectif = (c: Cercle) => (c.unite === '%' ? 'de ta moyenne' : `/ ${c.obj} ${c.unite}`);

/** Recharge l'activité Apple Santé quand l'écran s'affiche. */
function useRafraichir() {
  useFocusEffect(
    useCallback(() => {
      rafraichirActivite();
    }, []),
  );
}

/** Carte de l'Accueil : les cercles du jour et leurs valeurs ; ouvre Progrès. */
export function CarteCercles() {
  useRafraichir();
  const { semaine, auj, sante } = useCercles();
  const jour = semaine[auj];
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Tes cercles du jour, voir Progrès" onPress={() => router.navigate('/progres')}>
      <Card style={styles.carte}>
        <Anneaux cercles={jour} size={112} trait={11} />
        <View style={styles.legende}>
          {jour.map((c) => (
            <View key={c.id} style={styles.ligne}>
              <Text weight="semibold" style={[styles.nom, { color: COULEURS_CERCLES[c.id] }]}>
                {c.nom}
              </Text>
              <View style={styles.valLigne}>
                <Text weight="bold" style={styles.valFort}>
                  {c.unite === '%' ? (c.val ? c.val + ' %' : '--') : valeur(c)}
                </Text>
                <Text style={styles.val}>{c.unite === '%' ? (c.val ? objectif(c) : 'à mesurer') : objectif(c)}</Text>
              </View>
            </View>
          ))}
          <Text style={styles.src}>{sante ? 'Apple Santé + NÉA' : 'Tes séances NÉA'}</Text>
        </View>
      </Card>
    </Pressable>
  );
}

const LETTRES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Progrès : les cercles des 7 jours de la semaine. */
export function SemaineCercles() {
  useRafraichir();
  const { semaine, auj } = useCercles();
  return (
    <Card style={styles.semaine}>
      <Text weight="semibold" style={styles.titre}>
        Tes cercles de la semaine
      </Text>
      <View style={styles.jours}>
        {semaine.map((c, i) => (
          <View key={i} style={[styles.jour, i > auj && styles.futur]} accessibilityLabel={`${LETTRES[i]} : ${c.map((x) => `${x.nom} ${Math.round(part(x) * 100)} %`).join(', ')}`}>
            <Anneaux cercles={c} size={38} trait={4} />
            <Text weight={i === auj ? 'bold' : 'regular'} style={[styles.lettre, i === auj && styles.lettreAuj]}>
              {LETTRES[i]}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.cles}>
        {semaine[auj].map((c) => (
          <View key={c.id} style={styles.cle}>
            <View style={[styles.point, { backgroundColor: COULEURS_CERCLES[c.id] }]} />
            <Text style={styles.cleTxt}>{c.nom}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  carte: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legende: { flex: 1, gap: 5 },
  ligne: { gap: 0 },
  valLigne: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  nom: { fontSize: 12, lineHeight: 15 },
  val: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  valFort: { fontSize: 14, lineHeight: 17, color: colors.text },
  src: { fontSize: 10.5, lineHeight: 14, color: colors.textTertiary, marginTop: 2 },
  semaine: { gap: 12 },
  titre: { fontSize: 14, lineHeight: 18 },
  jours: { flexDirection: 'row', justifyContent: 'space-between' },
  jour: { alignItems: 'center', gap: 4 },
  futur: { opacity: 0.4 },
  lettre: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  lettreAuj: { color: colors.text },
  cles: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  point: { width: 8, height: 8, borderRadius: 4 },
  cleTxt: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary },
});
