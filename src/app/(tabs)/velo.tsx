import { useEffect } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Carte } from '@/components/app/Carte';
import { CourbeFC, ListeZones } from '@/components/app/Coeur';
import { LivePills } from '@/components/app/LivePills';
import { SectionHead } from '@/components/app/Section';
import { Button, Card, Icon, SelectableCard, Text, type IconName } from '@/components/ui';
import { dec } from '@/lib/charges';
import { mmss } from '@/lib/coeur';
import { lienPlans } from '@/lib/velo';
import { useProfil } from '@/store/profil';
import { useVelo, type ModeVelo } from '@/store/velo';
import { colors, fonts, heartZones, ui } from '@/theme';

const ZC = [heartZones.z1, heartZones.z2, heartZones.z3, heartZones.z4, heartZones.z5];
const RESISTANCES = [2, 4, 5, 6, 8, 10];

/** Onglet Vélo (vBike du prototype) : extérieur (GPS, carte, tracé) ou stationnaire (résistance), FC, historique. */
export default function Velo() {
  const v = useVelo();
  const p = useProfil();
  const age = p.age;
  const rides = p.logs.filter((l) => l.type === 'velo').slice(0, 6);

  // FC au repos affichée même sans sortie (horloge unique du prototype).
  useEffect(() => {
    const iv = setInterval(() => useVelo.getState().tickRepos(), 1000);
    return () => clearInterval(iv);
  }, []);

  const r = v.res;
  const note =
    v.mode === 'ext'
      ? v.gps === 'gps'
        ? 'Position GPS réelle.'
        : v.gps === 'sim'
          ? 'GPS indisponible ici : parcours simulé.'
          : "Le tracé utilise le GPS de ton téléphone si tu l'autorises."
      : 'Vitesse et distance estimées selon la résistance.';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text weight="bold" style={styles.ptitle}>
          Vélo
        </Text>

        {/* .modes */}
        <View style={styles.modes}>
          <Mode id="ext" icon="pin" label="Extérieur" on={v.mode === 'ext'} bloque={v.run} onPress={v.setMode} />
          <Mode id="int" icon="bike" label="Stationnaire" on={v.mode === 'int'} bloque={v.run} onPress={v.setMode} />
        </View>

        {v.mode === 'ext' ? (
          <Carte pts={v.pts} gps={v.gps === 'gps'} />
        ) : (
          <>
            <SectionHead title="Résistance" note={`${v.lvl}/10`} style={styles.resHead} />
            <View style={styles.res}>
              {RESISTANCES.map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityState={{ selected: v.lvl === n }}
                  onPress={() => v.setLvl(n)}
                  style={[styles.resBtn, v.lvl === n && styles.resOn]}
                >
                  <Text weight="semibold" style={styles.resTxt}>
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <LivePills bpm={v.bpm} zone={v.zone} hrv={v.hrv} />

        {/* .bstats */}
        <View style={styles.bstats}>
          <Stat label="Durée" value={mmss(v.el)} />
          <Stat label="Distance" value={dec(v.dist.toFixed(2))} unit="km" />
          <Stat label="Vitesse" value={dec(v.spd.toFixed(1))} unit="km/h" />
        </View>

        {/* .zones : zone cardio actuelle */}
        <View style={styles.zones}>
          {ZC.map((z, i) => (
            <View key={z} style={[styles.zone, { backgroundColor: z }, v.zone === i + 1 && { opacity: 1, boxShadow: `0 0 10px ${z}` }]} />
          ))}
        </View>

        {/* .bctrl */}
        <View style={styles.bctrl}>
          {!v.run ? (
            <Button label="Démarrer" iconAfter="play" onPress={v.demarrer} style={styles.flex} />
          ) : (
            <>
              <Button label={v.paused ? 'Reprendre' : 'Pause'} variant="dark" onPress={v.pause} style={styles.flex} />
              <Button label="Terminer" onPress={v.terminer} style={styles.flex} />
            </>
          )}
        </View>
        <Text style={styles.note}>
          {note} Calories estimées pour {dec(p.weight)} kg.
        </Text>

        {/* Dernière sortie */}
        {r && (
          <Card style={styles.hrchart}>
            <View style={styles.h4}>
              <Text weight="semibold" style={styles.h4Txt}>
                Dernière sortie
              </Text>
              <Text style={styles.h4Small}>
                {dec(r.dist.toFixed(1))} km • {mmss(r.sec)}
              </Text>
            </View>
            <CourbeFC samples={r.hr} age={age} />
            <View style={styles.cplan}>
              <Case label="FC moy." value={String(r.st.avg)} />
              <Case label="VFC moy." value={`${r.st.hrv} ms`} />
              <Case label="Calories" value={String(r.cal)} />
            </View>
            <ListeZones z={r.st.z} />
            {r.end && r.start && (
              <>
                <Button label="Ouvrir dans Plans" icon="pin" variant="dark" onPress={() => Linking.openURL(lienPlans(r.start!, r.end!))} style={styles.plans} />
                {r.gps !== 'gps' && <Text style={styles.noteSim}>Parcours simulé : les points ne sont pas ta vraie position.</Text>}
              </>
            )}
          </Card>
        )}

        <SectionHead title="Historique" />
        <View style={styles.list}>
          {rides.length ? (
            rides.map((l) => (
              <Card key={l.d} style={styles.ride}>
                <View style={styles.rideIco}>
                  <Icon name="bike" />
                </View>
                <View style={styles.flex}>
                  <Text weight="semibold" style={styles.h5}>
                    {dec(l.dist ?? 0)} km • {l.min} min
                  </Text>
                  <Text style={styles.p}>
                    {new Date(l.d).toLocaleDateString('fr-CA', { weekday: 'short', day: 'numeric', month: 'short' })} • FC {l.hrAvg} bpm • VFC {l.hrv} ms
                  </Text>
                </View>
              </Card>
            ))
          ) : (
            <Text style={styles.vide}>Aucune sortie pour l&apos;instant.</Text>
          )}
        </View>
        <View style={styles.bas} />
      </ScrollView>
    </SafeAreaView>
  );
}

/** Choix Extérieur / Stationnaire (.card.sel.opt), bloqué pendant une sortie. */
function Mode({ id, icon, label, on, bloque, onPress }: { id: ModeVelo; icon: IconName; label: string; on: boolean; bloque: boolean; onPress: (m: ModeVelo) => void }) {
  return (
    <View style={[styles.flex, bloque && styles.bloque]} pointerEvents={bloque ? 'none' : 'auto'}>
      <SelectableCard selected={on} onPress={() => onPress(id)} style={styles.mode} accessibilityLabel={label}>
        <Icon name={icon} color={on ? colors.pink : colors.text} />
        <Text weight="medium" style={styles.modeTxt}>
          {label}
        </Text>
      </SelectableCard>
    </View>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statSmall}>{label}</Text>
      <View style={styles.statRow}>
        <Text weight="extrabold" style={styles.statB}>
          {value}
        </Text>
        {unit && <Text style={styles.statI}>{unit}</Text>}
      </View>
    </Card>
  );
}

function Case({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.case}>
      <Text style={styles.caseSmall}>{label}</Text>
      <Text weight="bold" style={styles.caseB}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  ptitle: { fontSize: 24, lineHeight: 30, paddingTop: 14, paddingHorizontal: 20 },
  modes: { flexDirection: 'row', gap: 8, paddingTop: 12, paddingHorizontal: 20 },
  mode: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  modeTxt: { fontSize: 13, lineHeight: 17 },
  bloque: { opacity: 0.5 },
  resHead: { marginTop: 14 },
  res: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginTop: -2 },
  resBtn: { flex: 1, height: 34, borderRadius: 9, backgroundColor: ui.segBg, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  resOn: { borderColor: colors.pink, backgroundColor: 'rgba(255,79,163,0.16)' },
  resTxt: { fontSize: 12.5, lineHeight: 16 },
  bstats: { flexDirection: 'row', gap: 8, paddingTop: 10, paddingHorizontal: 20 },
  stat: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', gap: 0 },
  statSmall: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  statB: { fontSize: 18, lineHeight: 23, fontVariant: ['tabular-nums'] },
  statI: { fontSize: 11, lineHeight: 14, color: colors.textSecondary, fontFamily: fonts.medium },
  zones: { flexDirection: 'row', height: 8, borderRadius: 6, overflow: 'hidden', marginTop: 10, marginHorizontal: 20, gap: 2 },
  zone: { flex: 1, opacity: 0.28 },
  bctrl: { flexDirection: 'row', gap: 10, paddingTop: 14, paddingHorizontal: 20 },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 8, paddingHorizontal: 20 },
  hrchart: { marginTop: 12, marginHorizontal: 20, padding: 12 },
  h4: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h4Txt: { fontSize: 13.5, lineHeight: 18 },
  h4Small: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  cplan: { flexDirection: 'row', gap: 8, marginTop: 10 },
  case: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center' },
  caseSmall: { fontSize: 10.5, lineHeight: 14, color: colors.textSecondary },
  caseB: { fontSize: 14, lineHeight: 18 },
  plans: { marginTop: 12 },
  noteSim: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 6 },
  list: { paddingHorizontal: 20 },
  ride: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 8 },
  rideIco: { width: 64, height: 48, borderRadius: 10, backgroundColor: ui.carte, alignItems: 'center', justifyContent: 'center' },
  h5: { fontSize: 14, lineHeight: 18 },
  p: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  vide: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary },
  bas: { height: 12 },
});
