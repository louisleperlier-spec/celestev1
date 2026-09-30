import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourbeFC, ListeZones } from '@/components/app/Coeur';
import { DetailHead } from '@/components/app/Detail';
import { Kpi } from '@/components/app/Recap';
import { Button, Card, Icon, Text } from '@/components/ui';
import { dec } from '@/lib/charges';
import { mmss } from '@/lib/coeur';
import { hrMax } from '@/lib/plan';
import { fcEntre, santeDisponible } from '@/lib/sante';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

const JOUR = new Intl.DateTimeFormat('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
const HEURE = new Intl.DateTimeFormat('fr-CA', { hour: '2-digit', minute: '2-digit' });

/** Temps (s) passé dans chaque zone (60, 70, 80, 90 % de la FC max), d'après les mesures horodatées d'Apple Santé. */
function tempsZones(mesures: readonly [number, number][], fcMax: number): number[] {
  const z = [0, 0, 0, 0, 0];
  mesures.forEach(([t, bpm], i) => {
    const suivant = mesures[i + 1]?.[0] ?? t + 5000;
    const dt = Math.min(60, Math.max(0, (suivant - t) / 1000));
    const p = bpm / fcMax;
    z[p < 0.6 ? 0 : p < 0.7 ? 1 : p < 0.8 ? 2 : p < 0.9 ? 3 : 4] += dt;
  });
  return z.map(Math.round);
}

/** Récap d'une activité terminée (séance ou sortie vélo, souvent faite sur l'Apple Watch) : chiffres, courbe de FC et zones. */
export default function Activite() {
  const { d } = useLocalSearchParams<{ d?: string }>();
  const logs = useProfil((s) => s.logs);
  const age = useProfil((s) => s.age);
  const l = logs.find((x) => x.d === d) ?? logs[0];
  const [mesures, setMesures] = useState<[number, number][] | null>(null);

  const fin = l ? new Date(l.d) : new Date();
  const debut = l?.debut ? new Date(l.debut) : new Date(+fin - (l?.min ?? 0) * 60000);
  const sec = Math.max(0, Math.round((+fin - +debut) / 1000));

  useEffect(() => {
    if (!l) return;
    let actif = true;
    fcEntre(debut, fin).then((m) => actif && setMesures(m));
    return () => {
      actif = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l?.d]);

  if (!l) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
        <DetailHead titre="Activité" />
        <Text style={styles.vide}>Aucune activité pour l&apos;instant.</Text>
      </SafeAreaView>
    );
  }

  const velo = l.type === 'velo';
  const bpm = mesures?.map((m) => m[1]) ?? [];
  const moy = l.hrAvg || (bpm.length ? Math.round(bpm.reduce((a, b) => a + b, 0) / bpm.length) : 0);
  const max = l.hrMax || (bpm.length ? Math.max(...bpm) : 0);
  const vitesse = velo && sec ? (l.dist ?? 0) / (sec / 3600) : 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHead titre="Récap" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tete}>
          <View style={styles.tuile}>
            <Icon name={velo ? 'bike' : 'dumb'} size={26} color={colors.pink} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.h1} numberOfLines={2}>
              {l.title}
            </Text>
            <Text style={styles.date}>
              {JOUR.format(fin)} · {HEURE.format(debut)} – {HEURE.format(fin)}
            </Text>
            {l.src === 'montre' && (
              <View style={styles.source}>
                <Icon name="clock" size={14} color={colors.textSecondary} />
                <Text style={styles.sourceTxt}>Apple Watch</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.grid}>
          <Kpi icon="clock" label="Durée" value={mmss(sec || l.min * 60)} />
          <Kpi icon="flame" label="Calories actives" value={`${l.cal} kcal`} />
          {velo ? (
            <>
              <Kpi icon="bike" label="Distance" value={`${dec((l.dist ?? 0).toFixed(1))} km`} />
              <Kpi icon="trend" label="Vitesse moyenne" value={`${dec(vitesse.toFixed(1))} km/h`} />
            </>
          ) : (
            <Kpi icon="dumb" label="Volume" value={l.vol ? `${l.vol} kg` : '—'} />
          )}
        </View>

        <Card style={styles.carte}>
          <Text weight="semibold" style={styles.h3}>
            FC d&apos;exercice
          </Text>
          {bpm.length > 1 ? (
            <CourbeFC samples={bpm} age={age} />
          ) : (
            <Text style={styles.note}>
              {mesures === null
                ? 'Chargement de la FC…'
                : santeDisponible()
                  ? "La courbe apparaît quand Apple Santé a reçu la FC de ta montre (parfois quelques minutes)."
                  : "La courbe de FC vient d'Apple Santé, dans l'app installée."}
            </Text>
          )}
          <View style={styles.fc}>
            <View style={styles.flex}>
              <Text style={styles.fcLbl}>FC moy.</Text>
              <Text weight="semibold" style={styles.fcVal}>
                {moy ? `${moy} bpm` : '—'}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.fcLbl}>Maximum</Text>
              <Text weight="semibold" style={styles.fcVal}>
                {max ? `${max} bpm` : '—'}
              </Text>
            </View>
          </View>
        </Card>

        {bpm.length > 1 && (
          <Card style={styles.carte}>
            <Text weight="semibold" style={styles.h3}>
              Zones de fréquence cardiaque
            </Text>
            <ListeZones z={tempsZones(mesures!, hrMax(age))} />
          </Card>
        )}

        <Button label="Voir mes progrès" variant="dark" onPress={() => router.navigate('/progres')} style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  vide: { padding: 20, color: colors.textSecondary },
  tete: { flexDirection: 'row', gap: 14, alignItems: 'center', marginTop: 4 },
  tuile: { width: 56, height: 56, borderRadius: 16, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  date: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 2 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sourceTxt: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 18 },
  carte: { marginTop: 12, padding: 16 },
  h3: { fontSize: 18, lineHeight: 23 },
  note: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 8 },
  fc: { flexDirection: 'row', marginTop: 12 },
  fcLbl: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  fcVal: { fontSize: 24, lineHeight: 30 },
  btn: { marginTop: 18 },
});
