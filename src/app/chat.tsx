import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bientot } from '@/components/app/bientot';
import { CoachFace } from '@/components/app/CoachFace';
import { Icon, Text } from '@/components/ui';
import { chatLeft, QUESTIONS_RAPIDES } from '@/lib/coach';
import { coachById } from '@/lib/plan';
import { isPremium } from '@/lib/premium';
import { envoyer, ouvrirChat, useCoachEcrit } from '@/store/coach';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

/** Discussion avec le coach IA (vChat du prototype). */
export default function Chat() {
  const coachId = useProfil((s) => s.coach);
  const chat = useProfil((s) => s.chat);
  const chatQ = useProfil((s) => s.chatQ);
  const ecrit = useCoachEcrit((s) => s.ecrit);
  const c = coachById(coachId);
  const [saisie, setSaisie] = useState('');
  const defil = useRef<ScrollView>(null);
  const reste = chatLeft(chatQ, isPremium());

  useEffect(() => {
    ouvrirChat();
  }, [coachId]);

  const envoyerSaisie = () => {
    const t = saisie.trim();
    if (!t) return;
    setSaisie('');
    envoyer(t);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* .chathead */}
        <View style={styles.head}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/accueil'))} style={styles.back}>
            <Icon name="left" />
          </Pressable>
          <CoachFace id={c.id} size={44} borderColor={colors.pink} />
          <View style={styles.flex}>
            <Text weight="bold" style={styles.nom}>
              {c.nom}
            </Text>
            <Text style={styles.enLigne}>En ligne • {c.style}</Text>
          </View>
        </View>

        {/* .msgs */}
        <ScrollView ref={defil} style={styles.flex} contentContainerStyle={styles.msgs} onContentSizeChange={() => defil.current?.scrollToEnd({ animated: true })}>
          {chat.map((m, i) =>
            m.r === 'me' ? (
              <LinearGradient key={i} colors={ui.bulleMoi} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.msg, styles.moi]}>
                <Text weight="medium" style={[styles.msgTxt, { color: colors.onPrimary }]}>
                  {m.t}
                </Text>
              </LinearGradient>
            ) : (
              <View key={i} style={[styles.msg, styles.bot]}>
                <Text style={styles.msgTxt}>{m.t}</Text>
              </View>
            ),
          )}
          {ecrit && (
            <View style={[styles.msg, styles.bot]} accessibilityLabel={`${c.nom} écrit`}>
              <Points />
            </View>
          )}
        </ScrollView>

        {/* .quick */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quick} style={styles.quickWrap}>
          {QUESTIONS_RAPIDES.map((q) => (
            <Pressable key={q} accessibilityRole="button" onPress={() => envoyer(q)} style={styles.chip}>
              <Text style={styles.chipTxt}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* .quota */}
        {!isPremium() && (
          <View style={styles.quota}>
            <Text style={styles.quotaTxt}>
              {reste} message{reste > 1 ? 's' : ''} gratuit{reste > 1 ? 's' : ''} aujourd&apos;hui •{' '}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => bientot('plus')}>
              <Text weight="semibold" style={styles.quotaLien}>
                Illimité avec NÉA Plus
              </Text>
            </Pressable>
          </View>
        )}

        {/* .composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.inp}
            value={saisie}
            onChangeText={setSaisie}
            placeholder="Écris ton message..."
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={envoyerSaisie}
            returnKeyType="send"
            accessibilityLabel="Message"
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Envoyer" onPress={envoyerSaisie}>
            <LinearGradient colors={ui.envoyer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.send}>
              <Icon name="arrow" color={colors.onPrimary} strokeWidth={2.4} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Trois points qui clignotent (.typing). */
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
    o.value = withDelay(delai, withRepeat(withTiming(0.25, { duration: 500 }), -1, true));
  }, [delai, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.point, anim]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 10, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.border },
  back: { width: 32, height: 40, justifyContent: 'center', marginLeft: -8 },
  nom: { fontSize: 16, lineHeight: 20 },
  enLigne: { fontSize: 12, lineHeight: 16, color: colors.green },
  msgs: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  msg: { maxWidth: '82%', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 18 },
  bot: { backgroundColor: ui.segBg, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6, alignSelf: 'flex-start' },
  moi: { borderBottomRightRadius: 6, alignSelf: 'flex-end' },
  msgTxt: { fontSize: 14, lineHeight: 20.3 },
  typing: { flexDirection: 'row', gap: 4, paddingVertical: 7 },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSecondary },
  quickWrap: { flexGrow: 0 },
  quick: { gap: 8, paddingVertical: 6, paddingHorizontal: 16 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,79,163,0.45)', justifyContent: 'center' },
  chipTxt: { fontSize: 12.5, lineHeight: 16, color: colors.pinkPale },
  quota: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', paddingTop: 4, paddingHorizontal: 16 },
  quotaTxt: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  quotaLien: { fontSize: 12, lineHeight: 16, color: ui.plusLien },
  composer: { flexDirection: 'row', gap: 8, paddingTop: 8, paddingHorizontal: 16, paddingBottom: 4 },
  inp: {
    flex: 1,
    height: 46,
    borderRadius: 999,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  send: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
