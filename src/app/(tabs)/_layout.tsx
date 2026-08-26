import { Tabs } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';

import { Colors } from '@/constants/theme';
import { IconSymbol } from '@/ui/components/icon-symbol';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { position: 'absolute', borderTopColor: theme.border },
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 40 : 70}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <IconSymbol name="sparkles" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="heures-miroir"
        options={{
          title: 'Heures miroir',
          tabBarIcon: ({ color, size }) => <IconSymbol name="clock" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mediter"
        options={{
          title: 'Méditer',
          tabBarIcon: ({ color, size }) => <IconSymbol name="wind" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <IconSymbol name="pencil.and.outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lune"
        options={{
          title: 'Lune',
          tabBarIcon: ({ color, size }) => <IconSymbol name="moon.stars" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
