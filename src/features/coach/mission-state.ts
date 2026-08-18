import AsyncStorage from '@react-native-async-storage/async-storage';

import { todayKey } from '@/lib/date';

import { DEFAULT_MANUAL_MISSION_STATE, ManualMissionState } from './rules-engine';

/** État des missions auto-déclarées, réinitialisé chaque jour (clé par date). */

function keyFor(date: string): string {
  return `lume.coach.missions.${date}`;
}

export async function loadManualMissionState(date: string = todayKey()): Promise<ManualMissionState> {
  const raw = await AsyncStorage.getItem(keyFor(date));
  if (!raw) return DEFAULT_MANUAL_MISSION_STATE;
  try {
    return { ...DEFAULT_MANUAL_MISSION_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MANUAL_MISSION_STATE;
  }
}

export async function saveManualMissionState(state: ManualMissionState, date: string = todayKey()): Promise<void> {
  await AsyncStorage.setItem(keyFor(date), JSON.stringify(state));
}
