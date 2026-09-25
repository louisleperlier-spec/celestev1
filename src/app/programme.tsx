import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { coachById, exercice, prog, type PlanItem } from '@/lib/plan';
import { usePlan, useProfil } from '@/store/profil';
import { colors, fonts, spacing } from '@/theme';

/**
 * Aperçu TEMPORAIRE du programme généré, pour vérifier buildPlan sur iPhone.
 * Sera remplacé par les onglets Accueil / Programme / Calendrier à l'étape 3.
 */
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/** Fourchette de reps « 8-12 » (rj() du prototype). */
const rj = (r: readonly [number, number]) => (r[0] === r[1] ? String(r[0]) : r.join('-'));

const volume = (it: PlanItem) =>
  it.reps ? `${rj(it.reps)} reps` : it.sec! >= 120 ? `${Math.round(it.sec! / 60)} min` : `${it.sec} s`;

export default function Programme() {
  const profil = useProfil();
  const plan = usePlan();
  const c = coachById(profil.coach);

  return (
    <Screen scroll contentStyle={styles.content}>
      <Text variant="caption">Aperçu temporaire : les onglets arrivent à l&apos;étape 3.</Text>
      <Text variant="title">{prog(profil).nom}</Text>
      <Text color={colors.textSecondary}>
        Coach {c.nom}
        {profil.name ? ` • ${profil.name}` : ''}
      </Text>

      <Card>
        {plan.notes.map((n) => (
          <Text key={n} style={styles.note}>
            • {n}
          </Text>
        ))}
      </Card>

      {plan.sessions.map((s, i) => (
        <Card key={i}>
          <Text weight="semibold" color={colors.pinkLight} style={styles.day}>
            {JOURS[s.day].toUpperCase()}
          </Text>
          <Text variant="heading">{s.titre}</Text>
          <Text variant="caption">
            {s.min} min • ≈ {s.kcal} kcal • {s.items.length} exercices
          </Text>
          <View style={styles.items}>
            {s.items.map((it, k) => (
              <View key={k} style={styles.item}>
                <Text style={styles.exName}>{exercice(it.id).nom}</Text>
                <Text style={styles.exDetail}>
                  {it.sets} × {volume(it)} • repos {it.rest} s
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ))}

      <Button
        label="Refaire l'onboarding"
        variant="dark"
        onPress={() => {
          profil.reset();
          router.replace('/bienvenue');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl * 2 },
  note: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  day: { fontSize: 11, letterSpacing: 0.66 },
  items: { marginTop: spacing.sm, gap: spacing.sm },
  item: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  exName: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 },
  exDetail: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
});
