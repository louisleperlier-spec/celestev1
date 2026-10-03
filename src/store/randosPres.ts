/**
 * Vrais sentiers près de soi : position (expo-location), sentiers balisés d'OpenStreetMap (Overpass), altitude du terrain
 * (Open-Meteo). Gardés sur l'appareil une journée (et tant qu'on ne s'est pas éloigné de plus de 10 km).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { sentier as sentierFixe } from '@/data/randos';
import { echantillon, requeteOverpass, sentierOSM, sentiersBruts, type ElementOSM } from '@/lib/osm';
import type { Sentier } from '@/lib/rando';
import { hav, type Pt } from '@/lib/velo';

export type EtatPres = 'vide' | 'recherche' | 'ok' | 'refus' | 'erreur';

type Pres = { etat: EtatPres; d: number; ici: Pt | null; liste: Sentier[] };

export const useRandosPres = create<Pres>()(
  persist(() => ({ etat: 'vide' as EtatPres, d: 0, ici: null as Pt | null, liste: [] as Sentier[] }), {
    name: 'nea-randos-pres',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (s) => ({ d: s.d, ici: s.ici, liste: s.liste, etat: s.etat === 'ok' ? s.etat : 'vide' }),
  }),
);

/** Sentier proposé (fixe) ou trouvé près de soi. */
export const trouverSentier = (id: string | undefined): Sentier | undefined =>
  sentierFixe(id) ?? (id ? useRandosPres.getState().liste.find((s) => s.id === id) : undefined);

const SERVEURS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

async function overpass(q: string): Promise<ElementOSM[]> {
  for (const url of SERVEURS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
      if (r.ok) return ((await r.json()) as { elements: ElementOSM[] }).elements;
    } catch {
      // Serveur suivant.
    }
  }
  throw new Error('overpass');
}

/** Altitudes du terrain (100 points au plus par requête). */
async function altitudes(pts: readonly Pt[]): Promise<number[]> {
  const out: number[] = [];
  for (let k = 0; k < pts.length; k += 100) {
    const p = pts.slice(k, k + 100);
    const r = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${p.map((x) => x[0].toFixed(5)).join(',')}&longitude=${p.map((x) => x[1].toFixed(5)).join(',')}`,
    );
    const j = (await r.json()) as { elevation?: number[] };
    if (!j.elevation || j.elevation.length !== p.length) throw new Error('altitude');
    out.push(...j.elevation);
  }
  return out;
}

let enCours = false;

/** Cherche les sentiers près de soi (sauf si la liste d'aujourd'hui est encore bonne ; `forcer` pour actualiser). */
export async function chercherRandosPres(forcer = false) {
  if (enCours) return;
  const s = useRandosPres.getState();
  enCours = true;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return useRandosPres.setState({ etat: 'refus' });
    const p = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const ici: Pt = [p.coords.latitude, p.coords.longitude];
    const frais = Date.now() - s.d < 864e5 && s.ici && hav(s.ici, ici) < 10 && s.liste.length;
    if (frais && !forcer) return useRandosPres.setState({ etat: 'ok' });
    useRandosPres.setState({ etat: 'recherche' });
    const bruts = sentiersBruts(await overpass(requeteOverpass(ici[0], ici[1])), ici);
    const liste: Sentier[] = [];
    for (const b of bruts) {
      const pts = echantillon(b);
      try {
        liste.push(sentierOSM(b, pts, await altitudes(pts)));
      } catch {
        // Altitude indisponible pour ce sentier : il est ignoré.
      }
    }
    useRandosPres.setState({ etat: 'ok', d: Date.now(), ici, liste });
  } catch {
    useRandosPres.setState({ etat: 'erreur' });
  } finally {
    enCours = false;
  }
}
