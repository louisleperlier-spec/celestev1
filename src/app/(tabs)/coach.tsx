import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TitreOnglet } from '@/components/app/EnTete';
import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { Card, Glow, Icon, Text, type IconName } from '@/components/ui';
import { COACH_IMAGES } from '@/data';
import { chatLeft } from '@/lib/coach';
import { coachById } from '@/lib/plan';
import { isPremium } from '@/lib/premium';
import { envoyer, ouvrirChat } from '@/store/coach';
import { useProfil } from '@/store/profil';
import { colors, ui } from '@/theme';

/** Ressentis du jour : un toucher envoie la phrase au coach. */
const RESSENTIS: readonly [string, IconName, string][] = [
  ['En forme', 'smile', "Je me sens en forme aujourd'hui"],
  ['Fatigué', 'moon', 'Je suis fatigué'],
  ['Courbatures', 'pulse', "J'ai des courbatures"],
];

/** Actions rapides (questions du chat). */
const ACTIONS: readonly [string, string, IconName, string][] = [
  ['Adapter ma séance', 'Selon ta forme du jour', 'sliders', 'Adapte ma séance'],
  ['Préparer ma semaine', 'Tes séances et ta récupération', 'cal', 'Aide-moi à préparer ma semaine'],
];

/** Onglet Coach : le coach, ton ressenti du jour, des actions rapides, le dernier échange et l'accès au chat. */
export default function Coach() {
  const coachId = useProfil((s) => s.coach);
  const chat = useProfil((s) => s.chat);
  const chatQ = useProfil((s) => s.chatQ);
  useProfil((s) => s.premium);
  const c = coachById(coachId);
  const reste = chatLeft(chatQ, isPremium());

  useFocusEffect(
    useCallback(() => {
      ouvrirChat();
    }, []),
  );

  /** Ouvre le chat et envoie la phrase ; sans message gratuit restant, NÉA Plus. */
  const demander = (t: string) => {
    if (chatLeft(useProfil.getState().chatQ, isPremium()) <= 0) return ouvrirPlus();
    router.push('/chat');
    envoyer(t);
  };

  const dernierBot = [...chat].reverse().find((m) => m.r === 'bot');
  const dernierMoi = [...chat].reverse().find((m) => m.r === 'me');

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TitreOnglet titre={`Coach ${c.nom}`} />
        <Text style={styles.style}>{c.style}</Text>

        <View style={styles.hero}>
          <Glow width={260} height={220} intensity={0.3} />
          <Image source={COACH_IMAGES[c.id].corps} style={styles.heroImg} contentFit="contain" accessibilityIgnoresInvertColors />
        </View>

        <Card style={styles.carte}>
          <Text weight="semibold" style={styles.h2}>
            Comment te sens-tu ?
          </Text>
          <View style={styles.ressentis}>
            {RESSENTIS.map(([l, icon, t]) => (
              <Pressable key={l} accessibilityRole="button" onPress={() => demander(t)} style={({ pressed }) => [styles.ressenti, pressed && styles.appui]}>
                <Icon name={icon} size={20} color={colors.pinkLight} />
                <Text weight="medium" style={styles.ressentiTxt}>
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <View style={styles.actions}>
          {ACTIONS.map(([l, sous, icon, t]) => (
            <Pressable key={l} accessibilityRole="button" onPress={() => demander(t)} style={({ pressed }) => [styles.action, pressed && styles.appui]}>
              <View style={styles.actionIcon}>
                <Icon name={icon} size={20} color={colors.pink} />
              </View>
              <View style={styles.flex}>
                <Text weight="semibold" style={styles.actionTxt}>
                  {l}
                </Text>
                <Text style={styles.actionSous}>{sous}</Text>
              </View>
              <Icon name="right" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>

        {dernierBot && (
          <>
            <Text weight="semibold" style={styles.section}>
              Dernier échange
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Ouvrir la discussion" onPress={() => router.push('/chat')}>
              <Card style={styles.echange}>
                {dernierMoi && (
                  <Text style={styles.moi} numberOfLines={2}>
                    Toi : {dernierMoi.t}
                  </Text>
                )}
                <Text style={styles.bot} numberOfLines={4}>
                  {dernierBot.t}
                </Text>
                <Text weight="semibold" style={styles.lien}>
                  Continuer la discussion
                </Text>
              </Card>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Saisie : ouvre la discussion */}
      <View style={styles.bas}>
        {!isPremium() && (
          <Text style={styles.quota}>
            {reste} message{reste > 1 ? 's' : ''} gratuit{reste > 1 ? 's' : ''} aujourd&apos;hui
          </Text>
        )}
        <Pressable accessibilityRole="button" accessibilityLabel={`Écrire à ${c.nom}`} onPress={() => router.push('/chat')} style={styles.saisie}>
          <Text style={styles.saisieTxt}>Écris à {c.nom}…</Text>
          <View style={styles.envoyer}>
            <Icon name="arrow" size={18} color={colors.onPrimary} strokeWidth={2.4} />
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { paddingBottom: 16 },
  style: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, paddingHorizontal: 20 },
  hero: { height: 210, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  heroImg: { width: 200, height: 200 },
  carte: { marginHorizontal: 20, gap: 12 },
  h2: { fontSize: 18, lineHeight: 23 },
  ressentis: { flexDirection: 'row', gap: 8 },
  ressenti: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: ui.dark },
  ressentiTxt: { fontSize: 14, lineHeight: 18 },
  appui: { opacity: 0.7 },
  actions: { marginTop: 12, marginHorizontal: 20, gap: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: colors.surface },
  actionIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  actionTxt: { fontSize: 16, lineHeight: 21 },
  actionSous: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: 1 },
  section: { fontSize: 19, lineHeight: 24, marginTop: 22, marginBottom: 10, paddingHorizontal: 20 },
  echange: { marginHorizontal: 20, gap: 8 },
  moi: { fontSize: 14, lineHeight: 19, color: colors.textSecondary },
  bot: { fontSize: 15, lineHeight: 21 },
  lien: { fontSize: 14, lineHeight: 18, color: colors.pinkLight, marginTop: 2 },
  bas: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10, gap: 6 },
  quota: { fontSize: 12, lineHeight: 16, color: colors.textTertiary, textAlign: 'center' },
  saisie: { flexDirection: 'row', alignItems: 'center', height: 50, paddingLeft: 18, paddingRight: 5, borderRadius: 25, backgroundColor: colors.surface },
  saisieTxt: { flex: 1, fontSize: 15, lineHeight: 20, color: colors.textSecondary },
  envoyer: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
});
