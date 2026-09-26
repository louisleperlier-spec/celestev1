import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glow, Icon, Text, type IconName } from '@/components/ui';
import { colors } from '@/theme';

import { bientot } from './bientot';

type Onglet = { label: string; icon: IconName; href?: '/accueil' | '/programme' | '/ligue' | '/progres' | '/profil'; ecran?: Parameters<typeof bientot>[0] };

/** Les 6 onglets du prototype (vTabs). Ceux des étapes suivantes affichent un message. */
const ONGLETS: Onglet[] = [
  { label: 'Accueil', icon: 'home', href: '/accueil' },
  { label: 'Programme', icon: 'clip', href: '/programme' },
  { label: 'Vélo', icon: 'bike', ecran: 'velo' },
  { label: 'Ligue', icon: 'trophy', href: '/ligue' },
  { label: 'Progrès', icon: 'chart', href: '/progres' },
  { label: 'Profil', icon: 'user', href: '/profil' },
];

/** Barre d'onglets flottante arrondie (.tabs). */
export function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabs, { marginBottom: 10 + Math.max(0, insets.bottom - 14) }]} accessibilityRole="tablist">
      {ONGLETS.map((o) => {
        const on = !!o.href && path.startsWith(o.href);
        const color = on ? colors.pink : '#A9A9B0';
        return (
          <Pressable
            key={o.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={styles.tab}
            onPress={() => (o.href ? router.navigate(o.href) : bientot(o.ecran!))}
          >
            <View style={styles.icon}>
              {on && <Glow width={34} height={34} intensity={0.35} />}
              <Icon name={o.icon} size={19} color={color} />
            </View>
            <Text style={[styles.label, { color }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 6,
    marginHorizontal: 8,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: 22,
    backgroundColor: '#111114',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 2, borderRadius: 12 },
  icon: { width: 19, height: 19, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, lineHeight: 13 },
});
