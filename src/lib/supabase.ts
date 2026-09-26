/**
 * Client Supabase (Auth + base Postgres), selon le guide Expo SDK 57.
 * La session est gardée sur l'appareil (localStorage d'expo-sqlite, voir stockage.ts) et rafraîchie quand l'app est active.
 */
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { stockageSession } from './stockage';

// Valeurs PUBLIQUES du projet « NÉA COACH » (la sécurité repose sur la Row Level Security).
// En secours du .env : `eas update --environment` ne lit pas le .env local, l'app plantait sans elles.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aqmojycbnaotxrrcvxdr.supabase.co';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_lTvmKhqA1rvPBdLt-D_7wQ_AoQjpNx1';

export const supabase = createClient(url, key, {
  auth: {
    storage: stockageSession,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
