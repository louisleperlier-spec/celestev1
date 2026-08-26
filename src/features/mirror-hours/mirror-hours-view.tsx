import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/ui/components/card';
import { Screen } from '@/ui/components/screen';
import { SectionLabel } from '@/ui/components/section-label';
import { Spacing } from '@/constants/theme';
import { getNextMirrorHour, listMirrorHours } from '@/lib/mirror-hours';

export function MirrorHoursView() {
  const [now] = useState(() => new Date());
  const hours = useMemo(() => listMirrorHours(), []);
  const next = useMemo(() => getNextMirrorHour(now), [now]);

  return (
    <Screen>
      <ThemedText type="heading" style={{ marginTop: Spacing.three }}>
        Heures miroir
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        Retrouve ici toutes les heures miroir et leur signification.
      </ThemedText>

      <Card style={styles.highlight}>
        <SectionLabel>À venir</SectionLabel>
        <ThemedText type="heading" style={{ marginTop: 2 }}>
          {next.hour.label}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={{ marginTop: 2 }}>
          {next.hour.meaning}
        </ThemedText>
      </Card>

      <SectionLabel>Toutes les heures</SectionLabel>
      <View style={{ gap: Spacing.two }}>
        {hours.map((hour) => (
          <Card key={hour.label} style={styles.row}>
            <ThemedText type="smallBold" themeColor="accent" style={styles.time}>
              {hour.label}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={{ flex: 1 }}>
              {hour.meaning}
            </ThemedText>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  highlight: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  time: { width: 56 },
});
