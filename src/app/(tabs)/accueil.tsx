import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { CoachFace } from '@/components/app/CoachFace';
import { Lvl } from '@/components/app/Lvl';
import { SectionHead } from '@/components/app/Section';
import { Card, Icon, SelectableCard, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { dec, fmt } from '@/lib/charges';
import { coachById, todayIdx } from '@/lib/plan';
import { actifsEquipe } from '@/lib/ligue';
import { estPremium } from '@/lib/premium';
import { JOURS, nextSession, weekDates } from '@/lib/semaine';
import { baseHrv, lastNight, recovStatus, sleepScore } from '@/lib/sommeil';
import { boosts, lvlInfo, mult, rankOf, streak, type Log } from '@/lib/xp';
import { useAutresActifs } from '@/store/ligue';
import { useProfil, useSemaine } from '@/store/profil';
import { colors, glow, gradients, ui } from '@/theme';

/** Moyenne des valeurs positives (avgOf du prototype). */
const avgOf = (logs: readonly Log[], k: 'hrv') => {
  const v = logs.map((l) => l[k] ?? 0).filter((x) => x > 0);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
};

/** Onglet Accueil (vHome du prototype). */
export default function Accueil() {
  const p = useProfil();
  const sem = useSemaine();
  const c = coachById(p.coach);
  const wd = weekDates();
  const ti = todayIdx();
  const ns = nextSession(sem);
  const s = ns.s;
  const lundi = wd[0];
  const wl = p.logs.filter((l) => new Date(l.d) >= lundi);
  const doneDays = new Set(wl.map((l) => (new Date(l.d).getDay() + 6) % 7));
  const done = wl.length;
  const pct = Math.min(100, Math.round((done / p.days) * 100));
  const mins = [0, 0, 0, 0, 0, 0, 0];
  wl.forEach((l) => (mins[(new Date(l.d).getDay() + 6) % 7] += l.min));
  const mx = Math.max(60, ...mins);
  const when = ns.offset === 0 ? 'Séance du jour' : ns.offset === 1 ? 'Séance de demain' : 'Prochaine séance';
  const serie = streak(p.logs, p.days);
  const autres = useAutresActifs();
  const nonLues = p.notifs.some((n) => !n.read);
  const base = baseHrv(p.nights, p.hrvChecks);
  const ln = lastNight(p.nights);
  const sc = sleepScore(ln, base);
  const lc = p.hrvChecks[p.hrvChecks.length - 1];
  const st = lc ? recovStatus(lc.hrv, base) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* .top */}
        <View style={styles.top}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Parler à ${c.nom}`} onPress={() => router.push('/chat')}>
            <CoachFace id={c.id} />
          </Pressable>
          <View style={styles.flex}>
            <Text weight="bold" style={styles.salut}>
              Salut {p.name} 👋
            </Text>
            <Text style={styles.pret}>Prêt pour ta séance d&apos;aujourd&apos;hui ?</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={styles.bell} onPress={() => router.push('/notifications')}>
            <Icon name="bell" />
            {nonLues && <View style={styles.bellDot} />}
          </Pressable>
        </View>

        {/* .week */}
        <View style={styles.week}>
          {wd.map((d, i) => (
            <SelectableCard key={i} selected={i === ti} style={styles.day} accessibilityLabel={`${JOURS[i]} ${d.getDate()}`}>
              <Text style={styles.dayLbl}>{JOURS[i]}</Text>
              <Text weight="bold" style={styles.dayNum}>
                {d.getDate()}
              </Text>
              {doneDays.has(i) && <View style={styles.dayDot} />}
            </SelectableCard>
          ))}
        </View>

        {/* .today-card */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir la séance"
          onPress={() => s.day != null && router.push(`/seance/${s.day}`)}
          style={styles.todayWrap}
        >
          <LinearGradient
            colors={[colors.surface, colors.surface, '#2A1522']}
            locations={[0, 0.45, 1]}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 1, y: 0.65 }}
            style={styles.today}
          >
            <Text weight="medium" style={styles.todaySmall}>
              {when.toUpperCase()} • COACH {c.nom.toUpperCase()}
            </Text>
            <Text weight="extrabold" style={styles.todayH3}>
              {s.titre}
            </Text>
            <Text style={styles.todayP}>
              {s.min} min • {s.items.length} exercices
            </Text>
            <Image source={COACH_IMAGES[c.id].corps} style={styles.todayImg} contentFit="contain" contentPosition="right bottom" />
            <LinearGradient colors={['#FFFFFF', '#FFC6E0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.go, glow('rgba(255,79,163,0.5)', 16)]}>
              <Icon name="arrow" size={18} strokeWidth={2.4} color={colors.onPrimary} />
            </LinearGradient>
          </LinearGradient>
        </Pressable>

        {/* .stats3 */}
        <View style={styles.stats3}>
          <Stat icon="flame" label="Série actuelle" value={`${serie} jours`} />
          <Stat icon="cal" label="Séances" value={String(p.logs.length)} />
          <Stat icon="wave" label="VFC moy." value={`${avgOf(p.logs, 'hrv')} ms`} />
        </View>

        {/* readyCard : nuit et récupération */}
        <View style={styles.rdy}>
          <Pressable accessibilityRole="button" style={styles.flex} onPress={() => router.push('/sommeil')}>
            <Card style={styles.rdyCard}>
              <Icon name="moon" size={22} color={ui.sommeil} />
              <View>
                <Text style={styles.rdySmall}>Nuit</Text>
                <Text weight="bold" style={styles.rdyB}>
                  {sc != null ? sc + '/100' : 'À noter'}
                </Text>
                <Text style={styles.rdyEm}>{ln ? dec(ln.h) + ' h' + (ln.hrv ? ' • ' + ln.hrv + ' ms' : '') : 'Ajouter'}</Text>
              </View>
            </Card>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.flex} onPress={() => router.push('/recuperation')}>
            <Card style={styles.rdyCard}>
              <Icon name="wave" size={22} color={colors.pink} />
              <View>
                <Text style={styles.rdySmall}>Récupération</Text>
                <Text weight="bold" style={[styles.rdyB, st && { color: st[1] }]}>
                  {lc ? lc.hrv + ' ms' : 'Mesurer'}
                </Text>
                <Text style={styles.rdyEm}>{st ? st[0] : '1 min au calme'}</Text>
              </View>
            </Card>
          </Pressable>
        </View>

        <XpStrip xp={p.xp} serie={serie} boostUntil={p.boostUntil} equipe={actifsEquipe(autres, p.logs)} />

        {/* .upsell : NÉA Plus, seulement en version gratuite */}
        {!estPremium(p.premium) && (
        <Pressable accessibilityRole="button" onPress={() => ouvrirPlus()}>
          <LinearGradient colors={['#17140C', colors.surface]} locations={[0, 0.6]} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.6 }} style={styles.upsell}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.upsellIcon}>
              <Icon name="star" color={ui.onGold} />
            </LinearGradient>
            <View style={styles.flex}>
              <Text weight="bold" style={styles.upsellB}>
                Essaie NÉA Plus gratuitement
              </Text>
              <Text style={styles.upsellSmall}>3 jours offerts • tous les programmes, coach illimité</Text>
            </View>
            <Icon name="right" />
          </LinearGradient>
        </Pressable>
        )}

        <SectionHead title="Ta progression" action="Voir plus" onAction={() => router.navigate('/progres')} />
        {/* .prog */}
        <Card style={styles.prog}>
          <Anneau pct={pct} />
          <View>
            <Text style={styles.progSmall}>Objectif hebdo</Text>
            <Text weight="bold" style={styles.progBig}>
              {done}/{p.days} <Text style={styles.progI}>séances</Text>
            </Text>
          </View>
          <View style={styles.bars}>
            {mins.map((m, i) => (
              <View key={i} style={styles.barCol}>
                {m > 0 ? (
                  <LinearGradient colors={['#FF8CC6', colors.pink]} style={[styles.bar, { height: Math.max(12, (m / mx) * 42) }, glow('rgba(255,79,163,0.5)', 8)]} />
                ) : (
                  <View style={[styles.bar, styles.barOff]} />
                )}
                <Text style={styles.barLbl}>{'LMMJVSD'[i]}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* .qcard : citation du coach */}
        <Pressable accessibilityRole="button" onPress={() => router.push('/chat')} style={styles.qWrap}>
          <LinearGradient colors={[colors.surface, colors.surface, '#2A1220']} locations={[0, 0.4, 1]} start={{ x: 0, y: 0.4 }} end={{ x: 1, y: 0.6 }} style={styles.qcard}>
            <Text style={styles.qText}>« {c.daily} »</Text>
            <Text style={styles.qEm}>— {c.nom} • Parler à ton coach</Text>
            <Image source={COACH_IMAGES[c.id].tete} style={styles.qImg} contentFit="contain" />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <Card style={styles.st}>
      <Icon name={icon} size={18} color={colors.pink} />
      <View style={styles.flex}>
        <Text style={styles.stSmall}>{label}</Text>
        <Text weight="bold" style={styles.stB} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </Card>
  );
}

/** Niveau, rang et barre d'XP (xpStrip du prototype) : ouvre la Ligue. */
function XpStrip({ xp, serie, boostUntil, equipe }: { xp: number; serie: number; boostUntil: number; equipe: number }) {
  const li = lvlInfo(xp);
  const rk = rankOf(li.n);
  const b = boosts(serie, boostUntil, equipe);
  return (
    <Pressable accessibilityRole="button" onPress={() => router.navigate('/ligue')}>
      <Card style={styles.xps}>
        <Lvl n={li.n} color={rk[1]} />
        <View style={styles.flex}>
          <Text weight="bold" style={styles.xpB}>
            {rk[0]} • {fmt(xp)} XP
          </Text>
          <View style={styles.xbar}>
            <LinearGradient
              colors={['#FF8CC6', colors.pink]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.xfill, { width: `${(li.cur / li.need) * 100}%` }]}
            />
          </View>
          <Text style={styles.xpSmall}>
            {b.length ? `Boost x${dec(mult(b).toFixed(2))} : ${b.map((x) => x[0]).join(', ')}` : 'Aucun boost actif'}
          </Text>
        </View>
        <Icon name="right" />
      </Card>
    </Pressable>
  );
}

/** Anneau de l'objectif hebdo (.ring). */
function Anneau({ pct }: { pct: number }) {
  const R = 30;
  const C = 2 * Math.PI * R;
  return (
    <View style={styles.ring}>
      <Svg width={74} height={74} viewBox="0 0 74 74">
        <Defs>
          <SvgGradient id="rg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={colors.pink} />
            <Stop offset="1" stopColor="#FFB3D6" />
          </SvgGradient>
        </Defs>
        <Circle cx={37} cy={37} r={R} stroke="#2A2A30" strokeWidth={8} fill="none" />
        <Circle
          cx={37}
          cy={37}
          r={R}
          stroke="url(#rg)"
          strokeWidth={8}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct / 100)}
          transform="rotate(-90 37 37)"
        />
      </Svg>
      <Text weight="bold" style={styles.ringTxt}>
        {pct}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 6 },
  salut: { fontSize: 18, lineHeight: 23 },
  pret: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  bell: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  // .bell::after : pastille rose tant qu'une notification n'est pas lue
  bellDot: { position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pink, boxShadow: `0 0 8px ${colors.pink}` },
  week: { flexDirection: 'row', gap: 7, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 4 },
  day: { flex: 1, height: 58, alignItems: 'center', justifyContent: 'center', gap: 5 },
  dayLbl: { fontSize: 10.5, lineHeight: 13, color: colors.textSecondary },
  dayNum: { fontSize: 15, lineHeight: 18 },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.pink, marginTop: -2 },
  todayWrap: { marginTop: 12, marginHorizontal: 20 },
  today: { padding: 18, minHeight: 118, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  todaySmall: { fontSize: 11, lineHeight: 14, letterSpacing: 0.44, color: '#C9C9CF', maxWidth: '75%' },
  todayH3: { fontSize: 21, lineHeight: 26, marginTop: 6, marginBottom: 8, maxWidth: '68%' },
  todayP: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  todayImg: { position: 'absolute', right: -4, bottom: -12, height: 124, width: 124 },
  go: { position: 'absolute', right: 24, bottom: 18, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  stats3: { flexDirection: 'row', gap: 8, marginTop: 10, marginHorizontal: 20 },
  st: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, padding: 10 },
  stSmall: { fontSize: 10, lineHeight: 13, color: colors.textSecondary },
  stB: { fontSize: 14, lineHeight: 18 },
  rdy: { flexDirection: 'row', gap: 10, marginTop: 10, marginHorizontal: 20 },
  rdyCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  rdySmall: { fontSize: 10.5, lineHeight: 13, color: colors.textSecondary },
  rdyB: { fontSize: 15, lineHeight: 19 },
  rdyEm: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  xps: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, marginHorizontal: 20, paddingVertical: 12, paddingHorizontal: 14 },
  xpB: { fontSize: 13.5, lineHeight: 17 },
  xbar: { height: 7, borderRadius: 6, backgroundColor: colors.border, overflow: 'hidden', marginTop: 6, marginBottom: 4 },
  xfill: { height: '100%' },
  xpSmall: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  upsell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
    marginHorizontal: 20,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,194,61,0.45)',
  },
  upsellIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  upsellB: { fontSize: 14, lineHeight: 18 },
  upsellSmall: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 20, padding: 16 },
  ring: { width: 74, height: 74, alignItems: 'center', justifyContent: 'center' },
  ringTxt: { position: 'absolute', fontSize: 14, lineHeight: 18 },
  progSmall: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  progBig: { fontSize: 20, lineHeight: 25 },
  progI: { fontSize: 12, color: colors.textSecondary },
  bars: { marginLeft: 'auto', flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 54 },
  barCol: { alignItems: 'center', gap: 4 },
  bar: { width: 7, borderRadius: 3 },
  barOff: { height: 14, backgroundColor: '#3A3A42' },
  barLbl: { fontSize: 9, lineHeight: 11, color: colors.textSecondary },
  qWrap: { marginTop: 12, marginHorizontal: 20, marginBottom: 18 },
  qcard: {
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,79,163,0.4)',
    overflow: 'hidden',
  },
  qText: { fontSize: 13.5, lineHeight: 19.6 },
  qEm: { fontSize: 13.5, lineHeight: 19.6, color: colors.textSecondary, marginTop: 4 },
  qImg: { position: 'absolute', right: -10, bottom: -26, width: 124, height: 124 },
});
