import { router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/components/ui';
import { colors } from '@/theme';

type Chemin = '/accueil' | '/ligue' | '/programme' | '/velo' | '/progres' | '/profil' | '/coach';
type Onglet = { label: string; icon: IconName; href: Chemin; ecrans: Chemin[] };

/**
 * 4 onglets (refonte) : Accueil (+ Profil, ouvert par l'avatar), Entraînement (Programme, Calendrier, Vélo),
 * Progrès (+ Ligue) et Coach. Les écrans gardent leurs adresses.
 */
const ONGLETS: Onglet[] = [
  { label: 'Accueil', icon: 'home', href: '/accueil', ecrans: ['/accueil', '/profil'] },
  { label: 'Entraînement', icon: 'dumb', href: '/programme', ecrans: ['/programme', '/velo'] },
  { label: 'Progrès', icon: 'chart', href: '/progres', ecrans: ['/progres', '/ligue'] },
  { label: 'Coach', icon: 'coach', href: '/coach', ecrans: ['/coach'] },
];

/** Barre d'onglets en bas de l'écran : icône et libellé, rose pour l'onglet ouvert. */
export function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabs, { paddingBottom: Math.max(8, insets.bottom - 6) }]} accessibilityRole="tablist">
      {ONGLETS.map((o) => {
        const on = o.ecrans.some((e) => path.startsWith(e));
        const color = on ? colors.pink : colors.textSecondary;
        return (
          <Pressable
            key={o.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={o.label}
            style={styles.tab}
            onPress={() => router.navigate(o.href)}
          >
            <Icon name={o.icon} size={22} color={color} />
            <Text weight={on ? 'semibold' : 'medium'} style={[styles.label, { color }]}>
              {o.label}
            </Text>
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
    paddingTop: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.bgAlt,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  label: { fontSize: 11, lineHeight: 14 },
});
