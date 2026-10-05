import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Sheet } from '@/components/app/Sheet';
import { Appui, Button, Card, Icon, Text, toast, type IconName } from '@/components/ui';
import { coucherPour, heuresAuLit, JOURS_COURTS, libelleJours, SONS, type Reveil, type SonReveil } from '@/lib/reveil';
import { hm } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { programmerReveil, reveilEnAlarme } from '@/store/reveil';
import { alpha, colors, fonts, ui } from '@/theme';

const HAUT = 62;
const HEURES = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const OBJECTIFS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

/** Colonne de la roue (3 valeurs visibles, celle du milieu choisie), aimantée à chaque valeur. */
function Roue({ valeurs, valeur, onChange, label }: { valeurs: number[]; valeur: number; onChange: (v: number) => void; label: string }) {
  const [depart] = useState(() => Math.max(0, valeurs.indexOf(valeur)));
  const ref = useRef<ScrollView>(null);
  const fin = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(valeurs.length - 1, Math.round(e.nativeEvent.contentOffset.y / HAUT)));
    if (valeurs[i] !== valeur) onChange(valeurs[i]);
  };
  return (
    <ScrollView
      accessibilityLabel={label}
      style={styles.roue}
      showsVerticalScrollIndicator={false}
      snapToInterval={HAUT}
      decelerationRate="fast"
      ref={ref}
      contentOffset={{ x: 0, y: depart * HAUT }}
      onLayout={() => ref.current?.scrollTo({ y: depart * HAUT, animated: false })}
      contentContainerStyle={{ paddingVertical: HAUT }}
      onMomentumScrollEnd={fin}
      onScrollEndDrag={fin}
    >
      {valeurs.map((v) => (
        <View key={v} style={styles.cran}>
          <Text weight={v === valeur ? 'bold' : 'medium'} style={[styles.chiffre, v !== valeur && styles.chiffreLoin]}>
            {label === 'Minutes' ? String(v).padStart(2, '0') : String(v)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

function Ligne({ icone, titre, sous, droite, onPress }: { icone: IconName; titre: string; sous?: string; droite?: React.ReactNode; onPress?: () => void }) {
  const corps = (
    <View style={styles.ligne}>
      <Icon name={icone} size={22} color={colors.text} />
      <View style={styles.flex}>
        <Text weight="medium" style={styles.ligneTitre}>
          {titre}
        </Text>
        {!!sous && <Text style={styles.petit}>{sous}</Text>}
      </View>
      {droite ?? <Icon name="right" size={16} color={colors.textSecondary} />}
    </View>
  );
  return onPress ? (
    <Appui accessibilityRole="button" accessibilityLabel={titre} onPress={onPress}>
      {corps}
    </Appui>
  ) : (
    corps
  );
}

/** « Ton réveil » (maquette de l'utilisateur) : heure sur une roue, jours, son, vibration, nuit prévue ; réveil de l'iPhone à l'enregistrement. */
export default function ReveilEcran() {
  const p = useProfil(useShallow((s) => ({ reveil: s.reveil, objectif: s.objectifSommeil })));
  const [h, setH] = useState(Math.floor(hm(p.reveil.h) / 60));
  const [m, setM] = useState(Math.round((hm(p.reveil.h) % 60) / 5) * 5 % 60);
  const [jours, setJours] = useState(p.reveil.jours);
  const [son, setSon] = useState<SonReveil>(p.reveil.son);
  const [vibration, setVibration] = useState(p.reveil.vibration);
  const [objectif, setObjectif] = useState(p.objectif);
  const [feuille, setFeuille] = useState<'jours' | 'son' | 'objectif' | null>(null);

  const heure = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const coucher = coucherPour(heure, objectif);

  const enregistrer = async (actif: boolean) => {
    const r: Reveil = { h: heure, jours, son, vibration, actif };
    useProfil.getState().reglerReveil(r, objectif);
    const mode = await programmerReveil(r);
    if (!actif) toast('Réveil désactivé');
    else if (mode === 'alarme') toast(`Réveil réglé à ${heure} · alarme de l'iPhone ⏰`);
    else if (mode === 'notification') toast(`Réveil réglé à ${heure} · notification sonore`);
    else toast('Autorise les notifications de NÉA pour que ton réveil sonne');
    if (router.canGoBack()) router.back();
    else router.navigate('/sommeil');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <Appui accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/sommeil'))} style={styles.rond}>
          <Icon name="left" />
        </Appui>
        <Text weight="bold" style={styles.titre} accessibilityRole="header">
          Ton réveil
        </Text>
        <View style={styles.rond} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.question}>À quelle heure demain ?</Text>
        <View style={styles.roues}>
          <View style={styles.selection} pointerEvents="none" />
          <Roue valeurs={HEURES} valeur={h} onChange={setH} label="Heures" />
          <Text weight="bold" style={styles.deuxPoints}>
            :
          </Text>
          <Roue valeurs={MINUTES} valeur={m} onChange={setM} label="Minutes" />
        </View>
        <Text style={[styles.petit, styles.centre]}>Heure de réveil</Text>

        <Card style={styles.groupe}>
          <Ligne icone="refresh" titre="Répéter" sous={libelleJours(jours)} onPress={() => setFeuille('jours')} />
          <View style={styles.sep} />
          <Ligne icone="bell" titre="Son" sous={SONS[son]} onPress={() => setFeuille('son')} />
          <View style={styles.sep} />
          <Ligne
            icone="montre"
            titre="Vibration"
            droite={<Switch value={vibration} onValueChange={setVibration} trackColor={{ true: colors.pink, false: ui.iconBg }} thumbColor={colors.text} accessibilityLabel="Vibration" />}
          />
        </Card>

        <Appui accessibilityRole="button" accessibilityLabel="Objectif de sommeil" onPress={() => setFeuille('objectif')}>
          <Card style={styles.resume}>
            <View style={styles.resumeIc}>
              <Icon name="moon" size={22} color={colors.text} />
            </View>
            <View>
              <Text weight="bold" style={styles.resumeH}>
                {coucher} → {heure}
              </Text>
              <Text style={styles.petit}>{String(heuresAuLit(coucher, heure)).replace('.', ',')} h au lit prévues</Text>
            </View>
          </Card>
        </Appui>
        <Text style={[styles.petit, styles.centre]}>
          {reveilEnAlarme() ? 'Sonne comme une vraie alarme de l’iPhone, même en mode silencieux.' : 'Sonne en notification : laisse le son de ton iPhone activé.'}
        </Text>

        <Button label="Enregistrer" onPress={() => void enregistrer(true)} style={styles.mt} />
        {p.reveil.actif && (
          <Appui accessibilityRole="button" onPress={() => void enregistrer(false)} style={styles.desactiver}>
            <Text style={styles.petit}>Désactiver le réveil</Text>
          </Appui>
        )}
      </ScrollView>

      <Sheet visible={feuille === 'jours'} onClose={() => setFeuille(null)} title="Répéter">
        <View style={styles.puces}>
          {JOURS_COURTS.map((j, i) => {
            const on = jours.includes(i);
            return (
              <Appui key={j} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setJours(on ? jours.filter((x) => x !== i) : [...jours, i].sort())} style={[styles.puce, on && styles.puceOn]}>
                <Text weight="semibold" style={[styles.puceTxt, on && styles.puceTxtOn]}>
                  {j}
                </Text>
              </Appui>
            );
          })}
        </View>
        <Text style={[styles.petit, styles.centre]}>{jours.length ? libelleJours(jours) : 'Aucun jour : sonne une seule fois'}</Text>
        <Button label="OK" onPress={() => setFeuille(null)} style={styles.mt} />
      </Sheet>
      <Sheet visible={feuille === 'son'} onClose={() => setFeuille(null)} title="Son">
        {(Object.keys(SONS) as SonReveil[]).map((s) => (
          <Appui key={s} accessibilityRole="button" accessibilityState={{ selected: s === son }} onPress={() => setSon(s)} style={[styles.choix, s === son && styles.choixOn]}>
            <Text weight="semibold" style={styles.ligneTitre}>
              {SONS[s]}
            </Text>
            <Text style={styles.petit}>{s === 'doux' ? 'Carillon qui monte doucement' : 'Sonnerie de l’iPhone'}</Text>
          </Appui>
        ))}
        <Button label="OK" onPress={() => setFeuille(null)} style={styles.mt} />
      </Sheet>
      <Sheet visible={feuille === 'objectif'} onClose={() => setFeuille(null)} title="Objectif de sommeil">
        <View style={styles.puces}>
          {OBJECTIFS.map((o) => (
            <Appui key={o} accessibilityRole="button" accessibilityState={{ selected: o === objectif }} onPress={() => setObjectif(o)} style={[styles.puce, styles.puceLarge, o === objectif && styles.puceOn]}>
              <Text weight="semibold" style={[styles.puceTxt, o === objectif && styles.puceTxtOn]}>
                {String(o).replace('.', ',')} h
              </Text>
            </Appui>
          ))}
        </View>
        <Text style={[styles.petit, styles.centre]}>Ton coucher conseillé : {coucherPour(heure, objectif)}</Text>
        <Button label="OK" onPress={() => setFeuille(null)} style={styles.mt} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6 },
  rond: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  titre: { fontSize: 20, lineHeight: 26 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  question: { fontSize: 17, lineHeight: 22, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
  roues: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: HAUT * 3, gap: 8 },
  selection: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    top: HAUT,
    height: HAUT,
    borderRadius: HAUT / 2,
    borderWidth: 1,
    borderColor: colors.border2,
    backgroundColor: alpha(colors.text, 0.04),
  },
  roue: { width: 76, height: HAUT * 3, flexGrow: 0 },
  cran: { height: HAUT, alignItems: 'center', justifyContent: 'center' },
  chiffre: { fontSize: 34, lineHeight: 42, color: colors.text },
  chiffreLoin: { color: colors.textSecondary, fontSize: 28, lineHeight: 36, opacity: 0.6 },
  deuxPoints: { fontSize: 32, lineHeight: 40 },
  centre: { textAlign: 'center' },
  petit: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  groupe: { padding: 0 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  ligneTitre: { fontSize: 16, lineHeight: 21 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 52 },
  resume: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 16 },
  resumeIc: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  resumeH: { ...fonts.bold, fontSize: 20, lineHeight: 26 },
  mt: { marginTop: 8 },
  desactiver: { alignSelf: 'center', padding: 8 },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginVertical: 12 },
  puce: { minWidth: 46, height: 44, paddingHorizontal: 10, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  puceLarge: { minWidth: 70 },
  puceOn: { backgroundColor: colors.pink },
  puceTxt: { fontSize: 14, lineHeight: 18, color: colors.text },
  puceTxtOn: { color: colors.onPrimary },
  choix: { padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: 10, gap: 2 },
  choixOn: { borderColor: colors.pink, backgroundColor: alpha(colors.pink, 0.08) },
});
