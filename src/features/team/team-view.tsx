import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInRight, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useHydration } from '@/features/hydration/hydration-context';
import { useTheme } from '@/features/premium/theme-context';
import { addDays, dateKey } from '@/lib/date';
import { Button } from '@/ui/components/Button';
import { Card } from '@/ui/components/Card';
import { Screen } from '@/ui/components/Screen';

import { useTeam } from './team-context';

const XP_PER_LEVEL = 150;

export function TeamView() {
  const { t } = useTranslation();
  const team = useTeam();
  const hydration = useHydration();

  useEffect(() => {
    if (!team.supported || !team.displayName || !hydration.ready) return;
    const yesterday = dateKey(addDays(new Date(), -1));
    const stats = hydration.statsForDate(yesterday);
    if (stats.entries.length === 0) return;
    void team.recordDailyResult(yesterday, stats.hydratingMl >= stats.goalMl);
    // Une seule tentative par montage — la mutation elle-même est idempotente par jour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.supported, team.displayName, hydration.ready]);

  if (!team.supported) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.unsupportedTitle}>{t('team.unsupportedTitle')}</Text>
          <Text style={styles.unsupportedBody}>{t('team.unsupportedBody')}</Text>
        </View>
      </Screen>
    );
  }

  if (!team.ready) return <Screen />;
  if (!team.displayName) return <NameStep onSubmit={team.setDisplayName} />;
  if (!team.me?.teamId) return <NoTeamStep onCreate={team.createTeam} onJoin={team.joinTeam} />;

  return <LeaderboardScreen />;
}

function NameStep({ onSubmit }: { onSubmit: (name: string) => Promise<void> }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    await onSubmit(trimmed);
    setBusy(false);
  };

  return (
    <Screen>
      <View style={styles.centered}>
        <SymbolView name="person.crop.circle.fill" size={48} tintColor={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>{t('team.name.title')}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t('team.name.subtitle')}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('team.name.placeholder')}
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
          maxLength={24}
          autoFocus
        />
        <Button label={t('onboarding.continue')} onPress={() => void submit()} loading={busy} disabled={!name.trim()} />
      </View>
    </Screen>
  );
}

function NoTeamStep({
  onCreate,
  onJoin,
}: {
  onCreate: (name: string) => Promise<{ teamId: string; inviteCode: string }>;
  onJoin: (code: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCreate = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const { inviteCode } = await onCreate(trimmed);
      Alert.alert(t('team.create.doneTitle'), t('team.create.doneBody', { code: inviteCode }));
    } catch {
      setError(t('team.error'));
    }
    setBusy(false);
  };

  const submitJoin = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      await onJoin(trimmed);
    } catch {
      setError(t('team.join.notFound'));
    }
    setBusy(false);
  };

  return (
    <Screen>
      <View style={styles.centered}>
        <SymbolView name="person.3.fill" size={48} tintColor={theme.accent} />
        <Text style={[styles.title, { color: theme.text }]}>{t('team.empty.title')}</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{t('team.empty.subtitle')}</Text>

        {mode === 'choose' && (
          <View style={styles.choiceRow}>
            <Button label={t('team.empty.create')} onPress={() => setMode('create')} />
            <Button label={t('team.empty.join')} variant="ghost" onPress={() => setMode('join')} />
          </View>
        )}

        {mode === 'create' && (
          <>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={t('team.create.placeholder')}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}
              maxLength={30}
              autoFocus
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button label={t('team.create.cta')} onPress={() => void submitCreate()} loading={busy} disabled={!value.trim()} />
          </>
        )}

        {mode === 'join' && (
          <>
            <TextInput
              value={value}
              onChangeText={(v) => setValue(v.toUpperCase())}
              placeholder={t('team.join.placeholder')}
              placeholderTextColor={theme.textMuted}
              autoCapitalize="characters"
              maxLength={6}
              style={[
                styles.input,
                styles.inputCode,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surfaceElevated },
              ]}
              autoFocus
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button label={t('team.join.cta')} onPress={() => void submitJoin()} loading={busy} disabled={value.length !== 6} />
          </>
        )}
      </View>
    </Screen>
  );
}

function LeaderboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const team = useTeam();
  const [view, setView] = useState<'members' | 'leaderboard'>('leaderboard');

  const entries = team.leaderboard ?? [];
  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const members = [...entries].sort((a, b) => a.displayName.localeCompare(b.displayName));

  const onInvite = () => {
    const code = team.me?.team?.inviteCode;
    if (!code) return;
    void Share.share({ message: t('team.inviteMessage', { code }) });
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.teamName, { color: theme.text }]} numberOfLines={1}>
          {team.me?.team?.name}
        </Text>
        <Pressable onPress={onInvite} hitSlop={12} style={[styles.inviteButton, { backgroundColor: theme.accentSoft }]}>
          <SymbolView name="person.badge.plus" size={16} tintColor={theme.accent} />
        </Pressable>
      </View>

      <View style={[styles.segmented, { backgroundColor: theme.surfaceElevated }]}>
        <SegmentButton label={t('team.tabMembers')} active={view === 'members'} onPress={() => setView('members')} />
        <SegmentButton label={t('team.tabLeaderboard')} active={view === 'leaderboard'} onPress={() => setView('leaderboard')} />
      </View>

      {entries.length === 0 ? (
        <View style={styles.centered}>
          <Text style={[styles.body, { color: theme.textMuted }]}>{t('team.solo')}</Text>
        </View>
      ) : view === 'members' ? (
        <View style={styles.list}>
          {members.map((m, i) => (
            <Animated.View key={m.displayName + i} entering={FadeInRight.delay(i * 50)}>
              <MemberRow entry={m} />
            </Animated.View>
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          {podium.length > 0 && <Podium entries={podium} />}
          {rest.map((m, i) => (
            <Animated.View key={m.displayName + i} entering={FadeInRight.delay(i * 60)}>
              <MemberRow entry={m} rank={i + 4} />
            </Animated.View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.segmentButton, active && { backgroundColor: theme.surface }]}>
      <Text style={[styles.segmentLabel, { color: active ? theme.text : theme.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const PODIUM_ORDER = [1, 0, 2]; // 2e à gauche, 1er au centre, 3e à droite

function Podium({ entries }: { entries: { displayName: string; currentStreak: number }[] }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.podiumRow}>
      {PODIUM_ORDER.filter((i) => entries[i]).map((i) => {
        const entry = entries[i];
        const place = i + 1;
        return (
          <Animated.View
            key={entry.displayName}
            entering={FadeInUp.delay(i * 150).duration(400)}
            style={[styles.podiumSlot, place === 1 && styles.podiumSlotFirst]}>
            {place === 1 && <SymbolView name="trophy.fill" size={20} tintColor="#E0A63E" style={styles.trophy} />}
            <Avatar name={entry.displayName} size={place === 1 ? 64 : 52} />
            <Text style={[styles.podiumName, { color: theme.text }]} numberOfLines={1}>
              {entry.displayName}
            </Text>
            <StreakBadge days={entry.currentStreak} />
            <View style={[styles.podiumBlock, { height: place === 1 ? 64 : place === 2 ? 44 : 32, backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.podiumPlace, { color: theme.textMuted }]}>{place}</Text>
            </View>
          </Animated.View>
        );
      })}
      {entries.length === 0 && <Text style={{ color: theme.textMuted }}>{t('team.solo')}</Text>}
    </View>
  );
}

function MemberRow({ entry, rank }: { entry: { displayName: string; currentStreak: number; xp: number; level: number }; rank?: number }) {
  const theme = useTheme();
  const progress = ((entry.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;

  return (
    <Card style={styles.memberRow}>
      {rank && (
        <Text style={[styles.rank, { color: theme.textMuted }]}>{rank}.</Text>
      )}
      <Avatar name={entry.displayName} size={40} />
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, { color: theme.text }]} numberOfLines={1}>
          {entry.displayName}
        </Text>
        <StreakBadge days={entry.currentStreak} />
      </View>
      <LevelRing level={entry.level} progress={progress} />
    </Card>
  );
}

function Avatar({ name, size }: { name: string; size: number }) {
  const theme = useTheme();
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme.accentSoft }]}>
      <Text style={[styles.avatarText, { color: theme.accent, fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

function StreakBadge({ days }: { days: number }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.streakBadge, { backgroundColor: theme.surfaceElevated }]}>
      <SymbolView name="flame.fill" size={11} tintColor="#FF8A3D" />
      <Text style={[styles.streakText, { color: theme.textSecondary }]}>{t('team.streakDays', { count: days })}</Text>
    </View>
  );
}

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const theme = useTheme();
  const size = 40;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.max(0, Math.min(100, progress)) / 100);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={theme.border} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.levelRingCenter}>
          <Text style={[styles.levelRingText, { color: theme.text }]}>{level}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  unsupportedTitle: {
    fontSize: FontSize.title3,
    fontWeight: '700',
  },
  unsupportedBody: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  title: {
    fontSize: FontSize.title2,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  body: {
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: FontSize.body,
    marginTop: Spacing.two,
  },
  inputCode: {
    textAlign: 'center',
    fontSize: FontSize.title2,
    fontWeight: '800',
    letterSpacing: 6,
  },
  errorText: {
    color: '#E85A4A',
    fontSize: FontSize.footnote,
  },
  choiceRow: {
    width: '100%',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  teamName: {
    fontSize: FontSize.title2,
    fontWeight: '800',
    flex: 1,
  },
  inviteButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.four,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
  },
  list: {
    gap: Spacing.two,
    paddingBottom: Spacing.six,
  },
  podiumRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  podiumSlotFirst: {
    marginBottom: Spacing.two,
  },
  trophy: {
    marginBottom: 2,
  },
  podiumName: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
    maxWidth: 90,
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: Radius.sm,
    borderTopRightRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    marginTop: 4,
  },
  podiumPlace: {
    fontSize: FontSize.title3,
    fontWeight: '800',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rank: {
    fontSize: FontSize.footnote,
    fontWeight: '700',
    width: 18,
  },
  memberInfo: {
    flex: 1,
    gap: 4,
  },
  memberName: {
    fontSize: FontSize.body,
    fontWeight: '700',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
  },
  levelRingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelRingText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
