import { Tabs } from 'expo-router';

import { TabBar } from '@/components/app/TabBar';
import { colors } from '@/theme';

/** Onglets principaux (barre en bas, dans le flux de l'écran). */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <TabBar />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'shift', transitionSpec: { animation: 'spring', config: { damping: 22, stiffness: 240, mass: 0.8 } } }}
    >
      <Tabs.Screen name="accueil" />
      <Tabs.Screen name="programme" />
      <Tabs.Screen name="velo" />
      <Tabs.Screen name="rando" />
      <Tabs.Screen name="yoga" />
      <Tabs.Screen name="ligue" />
      <Tabs.Screen name="progres" />
      <Tabs.Screen name="profil" />
      <Tabs.Screen name="coach" />
    </Tabs>
  );
}
