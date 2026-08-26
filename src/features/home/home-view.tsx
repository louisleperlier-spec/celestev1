import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { FrostCard } from '@/ui/components/card';
import { IconSymbol } from '@/ui/components/icon-symbol';
import { NightSkyBackdrop } from '@/ui/components/backdrop';
import { Screen } from '@/ui/components/screen';
import { SectionLabel } from '@/ui/components/section-label';
import { Spacing } from '@/constants/theme';
import { getDailyCard } from '@/lib/daily-card';
import { getMoonPhase } from '@/lib/moon';
import { getNextMirrorHour } from '@/lib/mirror-hours';
import { isCardRevealedToday, markCardRevealedToday } from '@/lib/storage';

function getGreeting(hour: number) {
  if (hour < 5) return 'Douce nuit';
  if (hour < 12) return 'Bonjour';
  if (hour < 18) return 'Bel après-midi';
  return 'Bonsoir';
}

function formatCountdown(minutes: number) {
  if (minutes < 1) return "c'est maintenant ✦";
  if (minutes < 60) return `dans ${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `dans ${h} h${m ? ` ${m}` : ''}`;
}

export function HomeView() {
  const router = useRouter();
  const [now] = useState(() => new Date());
  const [cardRevealed, setCardRevealed] = useState(false);
  const flip = useSharedValue(0);

  const mirror = getNextMirrorHour(now);
  const moon = getMoonPhase(now);
  const card = getDailyCard(now);

  useFocusEffect(
    useCallback(() => {
      isCardRevealedToday().then(setCardRevealed);
    }, [])
  );

  useEffect(() => {
    flip.value = withSpring(cardRevealed ? 1 : 0, { damping: 16 });
  }, [cardRevealed, flip]);

  const frontStyle = useAnimatedStyle(() => ({
    opacity: 1 - flip.value,
    transform: [{ scale: 1 - flip.value * 0.05 }],
  }));
  const backStyle = useAnimatedStyle(() => ({
    opacity: flip.value,
    transform: [{ scale: 0.95 + flip.value * 0.05 }],
  }));

  async function revealCard() {
    if (cardRevealed) return;
    await markCardRevealedToday();
    setCardRevealed(true);
  }

  return (
    <View style={styles.fill}>
      <NightSkyBackdrop />
      <Screen transparent>
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="hero" themeColor="text">
              {getGreeting(now.getHours())} ✦
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.half }}>
              Ton espace de bien-être, un instant à la fois.
            </ThemedText>
          </View>
          <Pressable
            accessibilityLabel="Profil"
            onPress={() => router.push('/profil')}
            style={styles.profileButton}>
            <IconSymbol name="person.crop.circle" size={30} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        <FrostCard style={styles.mirrorCard}>
          <View style={styles.row}>
            <View style={styles.mirrorIcon}>
              <IconSymbol name="sparkles" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <SectionLabel>Prochaine heure miroir</SectionLabel>
              <ThemedText type="heading" themeColor="text" style={{ marginTop: 2 }}>
                {mirror.hour.label}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={{ marginTop: 2 }}>
                {formatCountdown(mirror.inMinutes)} — prépare ton vœu
              </ThemedText>
            </View>
          </View>
        </FrostCard>

        <Pressable onPress={revealCard}>
          <FrostCard style={styles.dailyCard}>
            <SectionLabel>Ta carte du jour</SectionLabel>
            <Animated.View style={[styles.cardFace, frontStyle]}>
              <ThemedText type="hero" themeColor="text" style={{ marginTop: Spacing.two }}>
                Touche pour révéler ✦
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.half }}>
                Une intention t'attend
              </ThemedText>
            </Animated.View>
            <Animated.View style={[styles.cardFace, backStyle]}>
              <ThemedText themeColor="accent" style={styles.cardSymbol}>
                {card.symbol}
              </ThemedText>
              <ThemedText type="hero" themeColor="text" style={{ marginTop: Spacing.two }}>
                {card.title}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.half }}>
                {card.message}
              </ThemedText>
            </Animated.View>
          </FrostCard>
        </Pressable>

        <View style={styles.grid}>
          <Pressable style={styles.gridItem} onPress={() => router.push('/(tabs)/mediter')}>
            <FrostCard style={styles.gridCard}>
              <SectionLabel>Ce soir</SectionLabel>
              <ThemedText type="heading" themeColor="text" style={{ marginTop: 2 }}>
                Respiration 4-7-8
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={{ marginTop: 2 }}>
                5 min · guidée
              </ThemedText>
            </FrostCard>
          </Pressable>

          <Pressable style={styles.gridItem} onPress={() => router.push('/(tabs)/lune')}>
            <FrostCard style={styles.gridCard}>
              <SectionLabel>Lune ce soir</SectionLabel>
              <ThemedText type="heading" themeColor="text" style={{ marginTop: 2 }}>
                {moon.label}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={{ marginTop: 2 }}>
                {Math.round(moon.illumination * 100)}% éclairée
              </ThemedText>
            </FrostCard>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/(tabs)/journal')}>
          <FrostCard>
            <SectionLabel>Journal du soir</SectionLabel>
            <ThemedText type="heading" themeColor="text" style={{ marginTop: 2 }}>
              Quelle petite joie as-tu attrapée aujourd'hui ?
            </ThemedText>
          </FrostCard>
        </Pressable>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  mirrorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  mirrorCard: {},
  dailyCard: { minHeight: 128, justifyContent: 'center' },
  cardFace: { position: 'absolute', left: Spacing.three, right: Spacing.three, top: Spacing.three + 18 },
  cardSymbol: { fontSize: 28 },
  grid: { flexDirection: 'row', gap: Spacing.three },
  gridItem: { flex: 1 },
  gridCard: { minHeight: 96, justifyContent: 'center' },
});
