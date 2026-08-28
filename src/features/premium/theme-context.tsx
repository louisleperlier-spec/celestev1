import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Colors } from '@/constants/theme';

import { ACCENT_THEMES, AccentTheme, DEFAULT_ACCENT_THEME_ID, findAccentTheme } from './themes';

const ACCENT_THEME_KEY = 'lume.accentTheme.v1';

export type ThemeColors = { readonly [K in keyof typeof Colors]: string };

interface ThemeContextValue {
  theme: ThemeColors;
  accentThemeId: string;
  setAccentThemeId: (id: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentThemeId, setAccentThemeIdState] = useState(DEFAULT_ACCENT_THEME_ID);

  useEffect(() => {
    void AsyncStorage.getItem(ACCENT_THEME_KEY).then((stored) => {
      if (stored) setAccentThemeIdState(stored);
    });
  }, []);

  const setAccentThemeId = useCallback(async (id: string) => {
    setAccentThemeIdState(id);
    await AsyncStorage.setItem(ACCENT_THEME_KEY, id);
  }, []);

  const theme = useMemo<ThemeColors>(() => {
    const accentTheme: AccentTheme = findAccentTheme(accentThemeId);
    return {
      ...Colors,
      accent: accentTheme.accent,
      accentStrong: accentTheme.accentStrong,
      accentSoft: accentTheme.accentSoft,
      accentText: accentTheme.onAccent,
    };
  }, [accentThemeId]);

  const value: ThemeContextValue = { theme, accentThemeId, setAccentThemeId };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Palette réactive au thème choisi — préférer à `import { Colors }` partout où l'accent compte. */
export function useTheme(): ThemeColors {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx.theme;
}

export function useAccentTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAccentTheme must be used within a ThemeProvider');
  return { accentThemeId: ctx.accentThemeId, setAccentThemeId: ctx.setAccentThemeId, options: ACCENT_THEMES };
}
