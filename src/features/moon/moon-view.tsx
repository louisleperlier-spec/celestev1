import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, FrostCard } from '@/ui/components/card';
import { NightSkyBackdrop } from '@/ui/components/backdrop';
import { Screen } from '@/ui/components/screen';
import { SectionLabel } from '@/ui/components/section-label';
import { Spacing } from '@/constants/theme';
import { getMoonPhase } from '@/lib/moon';

const MOON_DISC_SIZE = 140;

function MoonDisc({ illumination, waxing }: { illumination: number; waxing: boolean }) {
  // Approximation visuelle simple : un disque + un voile qui découvre/couvre selon la phase.
  const litWidth = illumination * MOON_DISC_SIZE;
  return (
    <View style={styles.discOuter}>
      <View style={styles.discBase} />
      <View
        style={[
          styles.discLit,
          waxing
            ? { right: 0, width: litWidth }
            : { left: 0, width: litWidth },
        ]}
      />
    </View>
  );
}

export function MoonView() {
  const [now] = useState(() => new Date());
  const moon = useMemo(() => getMoonPhase(now), [now]);
  const waxing = moon.age < 14.77;

  return (
    <View style={styles.fill}>
      <NightSkyBackdrop starCount={34} />
      <Screen transparent>
        <ThemedText type="hero" themeColor="text" style={{ marginTop: Spacing.three }}>
          Lune ce soir ✦
        </ThemedText>

        <View style={styles.discWrap}>
          <MoonDisc illumination={moon.illumination} waxing={waxing} />
        </View>

        <FrostCard style={{ alignItems: 'center' }}>
          <ThemedText type="heading" themeColor="text">
            {moon.label}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={{ marginTop: 2 }}>
            {Math.round(moon.illumination * 100)}% éclairée
          </ThemedText>
        </FrostCard>

        <SectionLabel>Rituel associé</SectionLabel>
        <Card>
          <ThemedText>{moon.ritual}</ThemedText>
        </Card>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  discWrap: { alignItems: 'center', marginVertical: Spacing.four },
  discOuter: {
    width: MOON_DISC_SIZE,
    height: MOON_DISC_SIZE,
    borderRadius: MOON_DISC_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  discBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,17,45,0.85)',
  },
  discLit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#F3EFE0',
  },
});
