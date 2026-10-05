import { router, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Appui, Icon, Text, type IconName } from '@/components/ui';
import { sportParId } from '@/lib/sports';
import { useSportLive } from '@/store/sportLive';

import { IconeSport } from './IconeSport';
import { alpha, colors, ui } from '@/theme';

type Chemin = '/accueil' | '/ligue' | '/programme' | '/velo' | '/rando' | '/progres' | '/profil' | '/coach';
type Onglet = { label: string; icon: IconName; href: Chemin; ecrans: Chemin[] };

/**
 * 4 onglets (direction « nuit », maquettes de l'utilisateur) : Accueil (+ Profil), Programme (Programme, Calendrier,
 * Sorties, Randonnée), Progrès (+ Ligue) et Coach. Les écrans gardent leurs adresses.
 */
const ONGLETS: Onglet[] = [
  { label: 'Accueil', icon: 'home', href: '/accueil', ecrans: ['/accueil', '/profil'] },
  { label: 'Programme', icon: 'cal', href: '/programme', ecrans: ['/programme', '/velo', '/rando'] },
  { label: 'Progrès', icon: 'chart', href: '/progres', ecrans: ['/progres', '/ligue'] },
  { label: 'Coach', icon: 'bulle', href: '/coach', ecrans: ['/coach'] },
];

/** Sport en direct : bandeau au-dessus des onglets (sport, chrono, BPM), toucher → écran en direct. */
function SportEnCours() {
  const { run, sport, el, bpm, paused } = useSportLive();
  const sp = sportParId(sport ?? undefined);
  if (!run || !sp) return null;
  return (
    <Appui accessibilityRole="button" accessibilityLabel={`${sp.nom} en cours`} onPress={() => router.push('/sport-en-cours')} style={styles.direct}>
      <IconeSport glyphe={sp.icone} size={20} />
      <Text weight="semibold" style={styles.directTxt} numberOfLines={1}>
        {sp.nom} {paused ? 'en pause' : 'en cours'} · {Math.floor(el / 60)}:{String(el % 60).padStart(2, '0')}
      </Text>
      <Icon name="heart" size={16} color={colors.pink} strokeWidth={2.2} />
      <Text weight="semibold" style={styles.directTxt}>
        {Math.round(bpm)}
      </Text>
    </Appui>
  );
}

/** Barre d'onglets flottante en pilule : icône et libellé, orange (avec halo) pour l'onglet ouvert. */
export function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.zone, { paddingBottom: Math.max(10, insets.bottom - 8) }]}>
      <SportEnCours />
      <View style={styles.pilule} accessibilityRole="tablist">
        {ONGLETS.map((o) => {
          const on = o.ecrans.some((e) => path.startsWith(e));
          const color = on ? colors.pink : colors.textSecondary;
          return (
            <Appui
              key={o.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={o.label}
              style={styles.tab}
              echelle={0.9}
              onPress={() => router.navigate(o.href)}
            >
              <View style={[styles.ic, on && styles.icOn]}>
                <Icon name={o.icon} size={22} color={color} strokeWidth={on ? 2.3 : 1.9} />
              </View>
              <Text weight={on ? 'semibold' : 'medium'} style={[styles.label, { color }]}>
                {o.label}
              </Text>
            </Appui>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { paddingHorizontal: 14, paddingTop: 6, backgroundColor: colors.bg },
  pilule: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 30,
    backgroundColor: ui.barre,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border2,
    boxShadow: `0 -6px 30px ${alpha(colors.pink, 0.08)}`,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  ic: { width: 40, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  icOn: { boxShadow: `0 0 18px ${alpha(colors.pink, 0.35)}` },
  label: { fontSize: 11, lineHeight: 14 },
  direct: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: alpha(colors.pink, 0.14),
    borderWidth: 1,
    borderColor: alpha(colors.pink, 0.4),
  },
  directTxt: { fontSize: 14, lineHeight: 18, color: colors.text, flexShrink: 1 },
});
