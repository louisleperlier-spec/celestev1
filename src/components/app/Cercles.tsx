import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useShallow } from 'zustand/react/shallow';

import { Card, Text } from '@/components/ui';
import { dec } from '@/lib/charges';
import { part, type Cercle, type IdCercle } from '@/lib/cercles';
import { baseHrv, lastNight, recovStatus, sleepScore } from '@/lib/sommeil';
import { rafraichirActivite, useCercles } from '@/store/cercles';
import { useProfil } from '@/store/profil';
import { alpha, colors } from '@/theme';

/** Couleur de chaque cercle (de l'extérieur vers l'intérieur). */
export const COULEURS_CERCLES: Record<IdCercle, string> = {
  bouger: colors.pink,
  exercice: colors.pinkPale,
  sommeil: colors.mauve,
  recup: colors.pinkLight,
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


/** Recharge l'activité Apple Santé quand l'écran s'affiche. */
export function useRafraichir() {
  useFocusEffect(
    useCallback(() => {
      rafraichirActivite();
    }, []),
  );
}

/** Un anneau simple, valeur au centre. */
function Anneau({ p, couleur, size, trait, children }: { p: number; couleur: string; size: number; trait: number; children?: React.ReactNode }) {
  const r = size / 2 - trait / 2;
  const tour = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, p));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={alpha(couleur, 0.16)} strokeWidth={trait} fill="none" />
        {v > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={couleur}
            strokeWidth={trait}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${tour * v} ${tour}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      {children}
    </View>
  );
}

/**
 * « Ton bilan du jour » de l'Accueil : trois anneaux, Effort (Bouger et Exercice), Récupération et Sommeil.
 * Mêmes données que les cercles (score de nuit, état de la mesure de récupération) ; chaque anneau ouvre son écran.
 */
export function BilanDuJour() {
  useRafraichir();
  const { semaine, auj, sante } = useCercles();
  const { nights, hrvChecks } = useProfil(useShallow((s) => ({ nights: s.nights, hrvChecks: s.hrvChecks })));
  const jour = semaine[auj];
  const get = (id: IdCercle) => jour.find((c) => c.id === id)!;
  const bouger = get('bouger');
  const exo = get('exercice');
  const som = get('sommeil');
  const rec = get('recup');
  const base = baseHrv(nights, hrvChecks);
  const ln = lastNight(nights);
  const sc = sleepScore(ln, base);
  const lc = hrvChecks[hrvChecks.length - 1];
  const mesureAuj = lc && new Date(lc.d).toDateString() === new Date().toDateString() ? lc : null;
  const st = mesureAuj ? recovStatus(mesureAuj.hrv, base) : null;
  const effort = (Math.min(1, part(bouger)) + Math.min(1, part(exo))) / 2;

  const cols: { cle: string; nom: string; p: number; couleur: string; centre: string; sous: string; ouvrir: () => void }[] = [
    {
      cle: 'effort',
      nom: 'Effort',
      p: effort,
      couleur: COULEURS_CERCLES.bouger,
      centre: `${Math.round(effort * 100)} %`,
      sous: `${exo.val} min • ${bouger.val} kcal`,
      ouvrir: () => router.navigate('/progres'),
    },
    {
      cle: 'recup',
      nom: 'Récupération',
      p: part(rec),
      couleur: COULEURS_CERCLES.recup,
      centre: rec.val ? `${rec.val} %` : '—',
      sous: st ? st[0] : rec.val ? 'de ta moyenne' : 'Mesurer (1 min)',
      ouvrir: () => router.push('/recuperation'),
    },
    {
      cle: 'sommeil',
      nom: 'Sommeil',
      p: part(som),
      couleur: COULEURS_CERCLES.sommeil,
      centre: som.val ? `${dec(som.val.toFixed(1))} h` : '—',
      sous: ln ? `Score ${sc}/100` : 'Note ta nuit',
      ouvrir: () => router.push('/sommeil'),
    },
  ];

  return (
    <Card style={styles.bilan}>
      <View style={styles.bilanRang}>
        {cols.map((c) => (
          <Pressable
            key={c.cle}
            accessibilityRole="button"
            accessibilityLabel={`${c.nom} : ${c.centre}, ${c.sous}`}
            onPress={c.ouvrir}
            style={({ pressed }) => [styles.bilanCol, pressed && styles.appui]}
          >
            <Anneau p={c.p} couleur={c.couleur} size={86} trait={8}>
              <Text weight="semibold" style={styles.bilanCentre}>
                {c.centre}
              </Text>
            </Anneau>
            <Text weight="semibold" style={styles.bilanNom}>
              {c.nom}
            </Text>
            <Text style={styles.bilanSous} numberOfLines={1}>
              {c.sous}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.src}>{sante ? 'Apple Santé + NÉA' : 'Tes séances NÉA'}</Text>
    </Card>
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
  appui: { opacity: 0.6 },
  flex: { flex: 1 },
  src: { fontSize: 11.5, lineHeight: 15, color: colors.textTertiary, marginTop: 2, textAlign: 'center' },
  semaine: { gap: 12 },
  bilan: { gap: 10, paddingVertical: 18 },
  bilanRang: { flexDirection: 'row', justifyContent: 'space-between' },
  bilanCol: { flex: 1, alignItems: 'center', gap: 4 },
  bilanCentre: { fontSize: 17, lineHeight: 22 },
  bilanNom: { fontSize: 14, lineHeight: 18, marginTop: 6 },
  bilanSous: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
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
