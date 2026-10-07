import { router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, toast } from '@/components/ui';
import type { SeanceId } from '@/data/types';
import { todayIdx } from '@/lib/plan';
import { JOURS, seanceById, sessionForDay, weekDates } from '@/lib/semaine';
import { useProfil, useSemaine } from '@/store/profil';
import { colors } from '@/theme';

import { DayNum, Row, RowText } from './Rows';
import { Sheet } from './Sheet';

/** Choisir le jour d'une séance du catalogue (daySheet du prototype). */
export function PlanifierSheet({ id, onClose }: { id: SeanceId | null; onClose: () => void }) {
  const sem = useSemaine();
  const planifier = useProfil((s) => s.planifier);
  const wd = weekDates();
  const ti = todayIdx();
  const w = id ? seanceById(id) : null;
  return (
    <Sheet visible={!!id} onClose={onClose} title={w ? `Planifier « ${w.t} »` : undefined}>
      <Text style={styles.sub}>Choisis ton jour. Si une séance est prévue, elle sera remplacée ce jour-là.</Text>
      {wd.map((d, i) => {
        const s = sessionForDay(sem, i);
        const past = i < ti;
        return (
          <Row
            key={i}
            disabled={past}
            onPress={() => {
              planifier(i, id!);
              onClose();
              toast('Planifiée ' + JOURS[i].toLowerCase() + '. ' + d.getDate() + ' : visible dans ton calendrier');
              router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } });
            }}
          >
            <DayNum jour={JOURS[i]} date={d.getDate()} />
            <RowText title={s ? s.titre : 'Libre'} sub={past ? 'Passé' : s ? 'Sera remplacée' : 'Jour de repos'} />
          </Row>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginBottom: 12 },
});
