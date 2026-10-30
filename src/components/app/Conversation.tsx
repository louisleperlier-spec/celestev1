/**
 * Conversation avec le coach, direction « nuit » (maquette de l'utilisateur, oct. 2026) : en-tête centré (tête du coach à
 * lueur, « À ton écoute »), bulles (coach à gauche avec sa tête, toi à droite en orange), deux séances adaptées à choisir,
 * « Ta séance s'adapte à toi », ressentis rapides et saisie « Écris à … ». Onglet Coach et écran /chat.
 */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { Appui, Card, Icon, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { chatLeft, QUESTIONS_RAPIDES } from '@/lib/coach';
import { coachById } from '@/lib/plan';
import { isPremium } from '@/lib/premium';
import { envoyer, ouvrirChat, useCoachEcrit } from '@/store/coach';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, mix, ui } from '@/theme';

/** Séances adaptées proposées par le coach (un toucher lui envoie ton choix). */
const CHOIX: readonly { min: string; nom: string; sous: string; icone: IconName; phrase: string }[] = [
  { min: '20 min', nom: 'Mobilité', sous: 'Étirements et mouvements doux', icone: 'run', phrase: 'Je préfère 20 min de mobilité douce aujourd’hui' },
  { min: '30 min', nom: 'Force douce', sous: 'Renforcement à intensité modérée', icone: 'dumb', phrase: 'Je préfère 30 min de force douce aujourd’hui' },
];

/** Ressentis et questions rapides. */
const RAPIDES = ['Je suis en forme', 'Un peu fatigué, mais motivé', 'J’ai des courbatures', ...QUESTIONS_RAPIDES];

const BULLE_MOI = mix(colors.pink, 50, colors.bg);

export function Conversation({ retour = false }: { retour?: boolean }) {
  const coachId = useProfil((s) => s.coach);
  const chat = useProfil((s) => s.chat);
  const chatQ = useProfil((s) => s.chatQ);
  useProfil((s) => s.premium);
  const ecrit = useCoachEcrit((s) => s.ecrit);
  const c = coachById(coachId);
  const [saisie, setSaisie] = useState('');
  const defil = useRef<ScrollView>(null);
  const reste = chatLeft(chatQ, isPremium());

  useEffect(() => {
    ouvrirChat();
  }, [coachId]);

  /** Envoie un message ; sans message gratuit restant, NÉA Plus. */
  const dire = (t: string) => {
    const m = t.trim();
    if (!m) return;
    if (chatLeft(useProfil.getState().chatQ, isPremium()) <= 0) return ouvrirPlus();
    envoyer(m);
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* En-tête centré */}
      <View style={styles.head}>
        {retour && (
          <Appui accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/coach'))} style={styles.retour}>
            <Icon name="left" />
          </Appui>
        )}
        <View style={styles.avatar}>
          <Image source={COACH_IMAGES[c.id].tete} style={styles.avatarImg} contentFit="cover" />
        </View>
        <Text weight="bold" style={styles.nom}>
          {c.nom}, ton coach
        </Text>
        <View style={styles.ecoute}>
          <View style={styles.vert} />
          <Text style={styles.ecouteTxt}>{ecrit ? 'Écrit…' : 'À ton écoute'}</Text>
        </View>
      </View>

      <ScrollView ref={defil} style={styles.flex} contentContainerStyle={styles.msgs} onContentSizeChange={() => defil.current?.scrollToEnd({ animated: true })} keyboardShouldPersistTaps="handled">
        {chat.map((m, i) =>
          m.r === 'me' ? (
            <Animated.View key={i} entering={FadeInUp.duration(260)} style={[styles.msg, styles.moi]}>
              <Text weight="medium" style={styles.msgTxt}>
                {m.t}
              </Text>
            </Animated.View>
          ) : (
            <Animated.View key={i} entering={FadeInUp.duration(260)} style={styles.ligneBot}>
              <Image source={COACH_IMAGES[c.id].tete} style={styles.mini} contentFit="cover" />
              <View style={[styles.msg, styles.bot]}>
                <Text style={styles.msgTxt}>{m.t}</Text>
              </View>
            </Animated.View>
          ),
        )}
        {ecrit && (
          <View style={styles.ligneBot} accessibilityLabel={`${c.nom} écrit`}>
            <Image source={COACH_IMAGES[c.id].tete} style={styles.mini} contentFit="cover" />
            <View style={[styles.msg, styles.bot]}>
              <Points />
            </View>
          </View>
        )}

        {/* Séances adaptées */}
        <View style={styles.choix}>
          {CHOIX.map((x) => (
            <Appui key={x.nom} accessibilityRole="button" accessibilityLabel={`${x.min} ${x.nom}`} onPress={() => dire(x.phrase)} style={styles.flex}>
              <Card style={styles.choixCarte}>
                <View style={styles.choixIc}>
                  <Icon name={x.icone} size={22} color={colors.pink} strokeWidth={2.2} />
                </View>
                <Text weight="bold" style={styles.choixMin}>
                  {x.min}
                </Text>
                <Text weight="medium" style={styles.choixNom}>
                  {x.nom}
                </Text>
                <Text style={styles.choixSous}>{x.sous}</Text>
              </Card>
            </Appui>
          ))}
        </View>
        <Appui accessibilityRole="button" onPress={() => router.navigate('/programme')}>
          <Card style={styles.adapte}>
            <Image source={COACH_IMAGES[c.id].tete} style={styles.adapteImg} contentFit="cover" />
            <View style={styles.flex}>
              <Text weight="bold" style={styles.adapteTitre}>
                Ta séance s’adapte à toi.
              </Text>
              <Text style={styles.choixSous}>On progresse sur le long terme.</Text>
            </View>
          </Card>
        </Appui>
      </ScrollView>

      {/* Ressentis et questions rapides */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rapides} style={styles.rapidesWrap} keyboardShouldPersistTaps="handled">
        {RAPIDES.map((q) => (
          <Appui key={q} accessibilityRole="button" onPress={() => dire(q)} style={styles.chip} echelle={0.94}>
            <Text style={styles.chipTxt}>{q}</Text>
          </Appui>
        ))}
      </ScrollView>

      {!isPremium() && (
        <View style={styles.quota}>
          <Text style={styles.quotaTxt}>
            {reste} message{reste > 1 ? 's' : ''} gratuit{reste > 1 ? 's' : ''} aujourd&apos;hui •{' '}
          </Text>
          <Appui accessibilityRole="button" onPress={() => ouvrirPlus()}>
            <Text weight="semibold" style={styles.quotaLien}>
              Illimité avec NÉA Plus
            </Text>
          </Appui>
        </View>
      )}

      {/* Saisie */}
      <View style={styles.composer}>
        <View style={styles.trombone}>
          <Icon name="bulle" size={18} color={colors.textSecondary} />
        </View>
        <TextInput
          style={styles.inp}
          value={saisie}
          onChangeText={setSaisie}
          placeholder={`Écris à ${c.nom}...`}
          placeholderTextColor={colors.textSecondary}
          onSubmitEditing={() => {
            dire(saisie);
            setSaisie('');
          }}
          returnKeyType="send"
          accessibilityLabel="Message"
        />
        <Appui
          accessibilityRole="button"
          accessibilityLabel="Envoyer"
          onPress={() => {
            dire(saisie);
            setSaisie('');
          }}
          style={styles.send}
          echelle={0.9}
        >
          <Icon name="arrow" color={colors.onPrimary} strokeWidth={2.4} />
        </Appui>
      </View>
    </KeyboardAvoidingView>
  );
}

/** Trois points qui clignotent (le coach écrit). */
function Points() {
  return (
    <View style={styles.typing}>
      {[0, 200, 400].map((d) => (
        <Point key={d} delai={d} />
      ))}
    </View>
  );
}

function Point({ delai }: { delai: number }) {
  const o = useSharedValue(1);
  useEffect(() => {
    o.set(withDelay(delai, withRepeat(withTiming(0.25, { duration: 500 }), -1, true)));
  }, [delai, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.point, anim]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  head: { alignItems: 'center', paddingTop: 6, paddingBottom: 10, gap: 4 },
  retour: { position: 'absolute', left: 14, top: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    overflow: 'hidden',
    backgroundColor: ui.iconBg,
    borderWidth: 2,
    borderColor: alpha(colors.pink, 0.6),
    boxShadow: `0 0 28px ${alpha(colors.pink, 0.45)}`,
  },
  avatarImg: { width: '100%', height: '100%' },
  nom: { fontSize: 19, lineHeight: 24, marginTop: 6 },
  ecoute: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vert: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  ecouteTxt: { fontSize: 13, lineHeight: 17, color: colors.textSecondary },
  msgs: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 10, gap: 12 },
  ligneBot: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  mini: { width: 34, height: 34, borderRadius: 17, backgroundColor: ui.iconBg },
  msg: { maxWidth: '78%', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 20 },
  bot: { backgroundColor: colors.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderBottomLeftRadius: 6 },
  moi: { backgroundColor: BULLE_MOI, borderBottomRightRadius: 6, alignSelf: 'flex-end' },
  msgTxt: { fontSize: 15, lineHeight: 21 },
  typing: { flexDirection: 'row', gap: 4, paddingVertical: 7 },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary },
  choix: { flexDirection: 'row', gap: 12, marginTop: 4 },
  choixCarte: { padding: 14, gap: 2 },
  choixIc: { width: 42, height: 42, borderRadius: 12, backgroundColor: ui.iconBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  choixMin: { fontSize: 19, lineHeight: 24 },
  choixNom: { fontSize: 16, lineHeight: 21 },
  choixSous: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: 2 },
  adapte: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  adapteImg: { width: 52, height: 52, borderRadius: 26, backgroundColor: ui.iconBg },
  adapteTitre: { fontSize: 16, lineHeight: 21 },
  rapidesWrap: { flexGrow: 0 },
  rapides: { gap: 8, paddingVertical: 6, paddingHorizontal: 16 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: alpha(colors.pink, 0.45), justifyContent: 'center' },
  chipTxt: { fontSize: 13, lineHeight: 17, color: colors.pinkPale },
  quota: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingTop: 2, paddingHorizontal: 16 },
  quotaTxt: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  quotaLien: { fontSize: 12, lineHeight: 16, color: ui.plusLien },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingHorizontal: 14, paddingBottom: 6 },
  trombone: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  inp: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    color: colors.text,
    ...fonts.regular,
    fontSize: 15,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${alpha(colors.pink, 0.45)}` },
});
