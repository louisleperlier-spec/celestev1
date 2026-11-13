import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { CadranSommeil, versFraction, versMinutes } from '@/components/app/CadranSommeil';
import { Sheet } from '@/components/app/Sheet';
import { Appui, Button, Card, Icon, Text, toast, type IconName } from '@/components/ui';
import { coucherPour, heuresAuLit, hhmm, JOURS_COURTS, libelleJours, SONS, SONS_DESC, sonValide, type Reveil, type SonReveil } from '@/lib/reveil';
import { hm } from '@/lib/sommeil';
import { useProfil } from '@/store/profil';
import { programmerReveil, reveilEnAlarme } from '@/store/reveil';
import { arreterApercu, ecouterSonnerie } from '@/store/sons';
import { alpha, colors, fonts, ui } from '@/theme';

const HAUT = 62;
const OBJECTIFS = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

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

/** « Ton réveil » (maquette de l'utilisateur) : coucher et réveil sur le cadran de sommeil (design Process), jours, son, vibration, nuit prévue ; réveil de l'iPhone à l'enregistrement. */
export default function ReveilEcran() {
  const p = useProfil(useShallow((s) => ({ reveil: s.reveil, objectif: s.objectifSommeil })));
  // Cadran de sommeil : réveil et coucher en minutes de la journée (pas de 5 min) ; l'objectif en découle.
  const [reveilMin, setReveilMin] = useState(() => (Math.round(hm(p.reveil.h) / 5) * 5) % 1440);
  const [coucherMin, setCoucherMin] = useState(() => (Math.round(hm(coucherPour(p.reveil.h, p.objectif)) / 5) * 5) % 1440);
  const [jours, setJours] = useState(p.reveil.jours);
  const [son, setSon] = useState<SonReveil>(sonValide(p.reveil.son));
  const [ecoute, setEcoute] = useState<SonReveil | null>(null);
  const [vibration, setVibration] = useState(p.reveil.vibration);
  const [feuille, setFeuille] = useState<'jours' | 'son' | 'objectif' | null>(null);

  const heure = hhmm(reveilMin);
  const coucher = hhmm(coucherMin);
  const objectif = ((reveilMin - coucherMin + 1440) % 1440) / 60;
  const setObjectif = (o: number) => setCoucherMin((reveilMin - o * 60 + 1440) % 1440);
  const { width } = useWindowDimensions();

  const choisirSon = (s: SonReveil) => {
    setSon(s);
    if (ecoute === s) {
      arreterApercu();
      setEcoute(null);
    } else setEcoute(ecouterSonnerie(s) ? s : null);
  };
  const fermerSon = () => {
    arreterApercu();
    setEcoute(null);
    setFeuille(null);
  };

  const enregistrer = async (actif: boolean) => {
    arreterApercu();
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
        {/* Cadran de sommeil (design Process) : glisse la lune pour le coucher, la cloche pour le réveil. */}
        <View style={styles.colonnes}>
          <View style={styles.colonne}>
            <View style={styles.colonneTete}>
              <Icon name="moon" size={14} color={colors.textSecondary} />
              <Text variant="label">Coucher</Text>
            </View>
            <Text weight="bold" style={styles.colonneHeure}>
              {coucher}
            </Text>
          </View>
          <View style={styles.colonne}>
            <View style={styles.colonneTete}>
              <Icon name="bell" size={14} color={colors.pink} />
              <Text variant="label">Réveil</Text>
            </View>
            <Text weight="bold" style={styles.colonneHeure}>
              {heure}
            </Text>
          </View>
        </View>
        <View style={styles.cadran}>
          <CadranSommeil
            taille={Math.min(320, width - 48)}
            coucher={versFraction(coucherMin)}
            reveil={versFraction(reveilMin)}
            onChange={(c, r) => {
              setCoucherMin(versMinutes(c));
              setReveilMin(versMinutes(r));
            }}
          />
        </View>
        <Text style={[styles.petit, styles.centre]}>Glisse la lune et la cloche le long du cadran</Text>

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
      <Sheet visible={feuille === 'son'} onClose={fermerSon} title="Son">
        <Text style={styles.petit}>Touche un son pour l’écouter. Au réveil, il commence tout bas puis monte doucement.</Text>
        {(Object.keys(SONS) as SonReveil[]).map((s) => (
          <Appui key={s} accessibilityRole="button" accessibilityState={{ selected: s === son }} onPress={() => choisirSon(s)} style={[styles.choix, s === son && styles.choixOn]}>
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.ligneTitre}>
                {SONS[s]}
              </Text>
              <Text style={styles.petit}>{SONS_DESC[s]}</Text>
            </View>
            {s !== 'iphone' && <Icon name={ecoute === s ? 'pause' : 'play'} size={16} color={s === son ? colors.pink : colors.textSecondary} />}
          </Appui>
        ))}
        <Button label="OK" onPress={fermerSon} style={styles.mt} />
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
  colonnes: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  colonne: { alignItems: 'center', gap: 4 },
  colonneTete: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colonneHeure: { fontSize: 28, lineHeight: 34, letterSpacing: -0.8, fontVariant: ['tabular-nums'] },
  cadran: { alignItems: 'center', marginVertical: 12 },
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
  choix: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: 10 },
  choixOn: { borderColor: colors.pink, backgroundColor: alpha(colors.pink, 0.08) },
});
