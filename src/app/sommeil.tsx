import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

import { Sheet } from '@/components/app/Sheet';
import { Appui, Button, Card, Icon, Text, type IconName } from '@/components/ui';
import { DECO_IMAGES } from '@/data';
import { coucherPour } from '@/lib/reveil';
import { MIN_RALENTIR } from '@/store/moments';
import { useProfil } from '@/store/profil';
import { SONS_NUIT, useSons, type SonNuit } from '@/store/sons';
import { alpha, colors, fonts, ui } from '@/theme';

/** Une ligne de réglage : icône, titre (et sous-titre), valeur ou contrôle à droite. */
function Ligne({ icone, titre, sous, droite, onPress }: { icone: IconName; titre: string; sous?: string; droite?: React.ReactNode; onPress?: () => void }) {
  const contenu = (
    <Card style={styles.ligne}>
      <Icon name={icone} size={22} color={colors.text} />
      <View style={styles.flex}>
        <Text weight="medium" style={styles.ligneTitre}>
          {titre}
        </Text>
        {!!sous && <Text style={styles.petit}>{sous}</Text>}
      </View>
      {droite}
    </Card>
  );
  return onPress ? (
    <Appui accessibilityRole="button" accessibilityLabel={titre} onPress={onPress}>
      {contenu}
    </Appui>
  ) : (
    contenu
  );
}

/**
 * Partie Sommeil (maquette de l'utilisateur) : coucher de ce soir d'après le réveil et l'objectif, réveil de l'iPhone, rappel du coucher,
 * routine du soir (respiration, sons apaisants au choix), « Commencer ma nuit », journal du sommeil et mes nuits.
 */
export default function Sommeil() {
  const p = useProfil(useShallow((s) => ({ reveil: s.reveil, objectif: s.objectifSommeil, nset: s.nset, nuitDebut: s.nuitDebut })));
  const { son, joue, jouer, pause } = useSons(useShallow((s) => ({ son: s.son, joue: s.joue, jouer: s.jouer, pause: s.pause })));
  const [feuille, setFeuille] = useState(false);
  const coucher = coucherPour(p.reveil.h, p.objectif);

  // Aucun son lancé d'office : l'ambiance se met en route seulement si on la demande.
  const commencer = () => {
    if (!p.nuitDebut) useProfil.getState().commencerNuit();
    router.push('/nuit');
  };

  const essayer = (s: SonNuit) => {
    if (s === son && joue) return pause();
    useSons.getState().choisir(s);
    jouer(30);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Appui accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/accueil'))} style={styles.retour}>
          <Icon name="left" size={18} color={colors.textSecondary} />
          <Text style={styles.retourTxt}>Accueil</Text>
        </Appui>
        <Text weight="bold" style={styles.h1} accessibilityRole="header">
          Sommeil
        </Text>
        <Text style={styles.sous}>Prépare une nuit à ton rythme.</Text>

        <Card style={styles.soir}>
          <Image source={DECO_IMAGES.dodo} style={styles.soirImg} contentFit="cover" />
          <LinearGradient colors={[colors.surface, alpha(colors.surface, 0.85), alpha(colors.surface, 0)]} locations={[0.3, 0.5, 0.8]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.soirTxt}>
            <Text style={styles.petit}>Ce soir</Text>
            <Text weight="bold" style={styles.soirTitre}>
              Coucher à
            </Text>
            <Text weight="bold" style={styles.soirHeure}>
              {coucher.replace(':', ':')}
            </Text>
            <Text style={styles.petit}>Objectif · {String(p.objectif).replace('.', ',')} h</Text>
          </View>
        </Card>

        <Ligne
          icone="clock"
          titre="Réveil"
          onPress={() => router.push('/reveil')}
          droite={
            <View style={styles.droite}>
              <Text weight="medium" style={styles.valeur}>
                {p.reveil.actif ? p.reveil.h : 'Désactivé'}
              </Text>
              <Icon name="right" size={16} color={colors.textSecondary} />
            </View>
          }
        />
        <Ligne
          icone="moon"
          titre="Rappel du coucher"
          droite={
            <View style={styles.droite}>
              <Text style={styles.petit}>{MIN_RALENTIR} min avant</Text>
              <Switch
                value={p.nset.bed}
                onValueChange={(v) => useProfil.getState().reglerNotifs({ ...p.nset, bed: v })}
                trackColor={{ true: colors.pink, false: ui.iconBg }}
                thumbColor={colors.text}
                accessibilityLabel="Rappel du coucher"
              />
            </View>
          }
        />

        <Text weight="bold" style={styles.h2}>
          Ta routine du soir
        </Text>
        <Ligne icone="wave" titre="Respiration" sous="3 min" onPress={() => router.push({ pathname: '/respirer', params: { min: '3' } })} droite={<Icon name="right" size={16} color={colors.textSecondary} />} />
        <Ligne
          icone="cloud"
          titre="Sons apaisants"
          sous={SONS_NUIT[son].nom}
          onPress={() => setFeuille(true)}
          droite={
            <Appui accessibilityRole="button" accessibilityLabel={joue ? 'Pause' : `Écouter ${SONS_NUIT[son].nom}`} onPress={() => (joue ? pause() : jouer(30))} style={styles.lecture}>
              <Icon name={joue ? 'pause' : 'play'} size={16} color={colors.text} />
            </Appui>
          }
        />

        <Button label={p.nuitDebut ? 'Reprendre ma nuit' : 'Commencer ma nuit'} onPress={commencer} style={styles.mt} />
        <View style={styles.liens}>
          <Appui accessibilityRole="button" onPress={() => router.push('/journal-sommeil')} style={styles.lien}>
            <Icon name="book" size={18} color={colors.text} />
            <Text weight="medium" style={styles.lienTxt} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              Journal du sommeil
            </Text>
            <Icon name="right" size={14} color={colors.textSecondary} />
          </Appui>
          <Appui accessibilityRole="button" onPress={() => router.push('/nuits')} style={styles.lien}>
            <Icon name="chart" size={18} color={colors.text} />
            <Text weight="medium" style={styles.lienTxt} numberOfLines={1}>
              Voir mes nuits
            </Text>
            <Icon name="right" size={14} color={colors.textSecondary} />
          </Appui>
        </View>
      </ScrollView>

      <Sheet visible={feuille} onClose={() => setFeuille(false)} title="Sons apaisants">
        <Text style={styles.petit}>Touche pour écouter. Le son s’arrête seul après 30 min.</Text>
        {(Object.keys(SONS_NUIT) as SonNuit[]).map((s) => {
          const on = s === son;
          return (
            <Appui key={s} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => essayer(s)} style={[styles.choix, on && styles.choixOn]}>
              <View style={styles.flex}>
                <Text weight="semibold" style={styles.ligneTitre}>
                  {SONS_NUIT[s].nom}
                </Text>
                <Text style={styles.petit}>{SONS_NUIT[s].desc}</Text>
              </View>
              <Icon name={on && joue ? 'pause' : 'play'} size={16} color={on ? colors.pink : colors.textSecondary} />
            </Appui>
          );
        })}
        <Button label="OK" onPress={() => setFeuille(false)} style={styles.mt} />
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  flex: { flex: 1, minWidth: 0 },
  retour: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingVertical: 6 },
  retourTxt: { fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  h1: { ...fonts.bold, fontSize: 32, lineHeight: 38 },
  sous: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginBottom: 6 },
  h2: { ...fonts.bold, fontSize: 20, lineHeight: 25, marginTop: 10 },
  petit: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  soir: { padding: 0, overflow: 'hidden', minHeight: 158 },
  soirImg: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '62%' },
  soirTxt: { padding: 18, gap: 2 },
  soirTitre: { fontSize: 20, lineHeight: 25 },
  soirHeure: { ...fonts.bold, fontSize: 44, lineHeight: 52, color: colors.pink, letterSpacing: -0.5 },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  ligneTitre: { fontSize: 16, lineHeight: 21 },
  droite: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valeur: { fontSize: 15, lineHeight: 20 },
  lecture: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: ui.iconBg },
  mt: { marginTop: 8 },
  choix: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginTop: 10 },
  choixOn: { borderColor: colors.pink, backgroundColor: alpha(colors.pink, 0.08) },
  liens: { flexDirection: 'row', gap: 10 },
  lien: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  lienTxt: { flex: 1, fontSize: 13.5, lineHeight: 18 },
});
