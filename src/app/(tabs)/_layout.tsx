import { Tabs } from 'expo-router';

import { TabBar } from '@/components/app/TabBar';
import { colors } from '@/theme';

/** Onglets principaux. La barre est dans le flux de l'écran, en bas, comme dans le prototype. */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <TabBar />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'fade' }}
    >
      <Tabs.Screen name="accueil" />
      <Tabs.Screen name="programme" />
    </Tabs>
  );
}
