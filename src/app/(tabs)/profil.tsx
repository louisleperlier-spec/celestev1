import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bientot } from '@/components/app/bientot';
import { confirmer } from '@/components/app/confirmer';
import { PeseeSheet } from '@/components/app/PeseeSheet';
import { Card, Glow, Icon, Text, toast, type IconName } from '@/components/ui';
import { COACH_IMAGES, GOALS } from '@/data';
import { dec } from '@/lib/charges';
import { coachById } from '@/lib/plan';
import { lvlInfo, rankOf } from '@/lib/xp';
import { deconnecter, supprimerCompte, useCompte } from '@/store/compte';
import { useProfil } from '@/store/profil';
import { colors, fonts, glow } from '@/theme';

/** Onglet Profil (vProfile du prototype). */
export default function Profil() {
  const p = useProfil();
  const email = useCompte((s) => s.email);
  const c = coachById(p.coach);
  const li = lvlInfo(p.xp);
  const lv = li.n;
  const [pesee, setPesee] = useState(false);

  const supprimer = () =>
    confirmer(
      email ? 'Supprimer définitivement le compte ' + email + ' ?' : 'Effacer toutes tes données ?',
      'Tes séances, ton programme, ton XP et tes mesures seront perdus.',
      email ? 'Supprimer' : 'Effacer',
      async () => {
        const r = await supprimerCompte();
        if (!r.ok) return toast(r.erreur);
        router.replace('/bienvenue');
      },
    );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* .prof */}
        <View style={styles.prof}>
          <View style={styles.bot}>
            <Glow width={200} height={170} intensity={0.35} />
            <Image source={COACH_IMAGES[c.id].corps} style={styles.botImg} contentFit="contain" />
          </View>
          <Text weight="extrabold" style={styles.h2}>
            {p.name}
          </Text>
          <Text style={styles.sous}>
            Coach {c.nom} • Niveau {lv} • {dec(p.weight)} kg • {p.age} ans
          </Text>
          <View style={styles.xp}>
            <View style={styles.xpBar}>
              <LinearGradient
                colors={['#FF8CC6', colors.pink]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.xpFill, { width: `${Math.round((li.cur / li.need) * 100)}%` }, glow(colors.pink, 10)]}
              />
            </View>
            <View style={styles.xpLbl}>
              <Text style={styles.xpTxt}>
                {li.cur}/{li.need} XP • {rankOf(lv)[0]}
              </Text>
              <Text style={styles.xpTxt}>Niveau {lv + 1}</Text>
            </View>
          </View>
        </View>

        <View style={styles.menu}>
          {/* subRow : NÉA Plus (étape 11) */}
          <Ligne icon="star" titre="NÉA Plus" sous="Version gratuite • Découvre l'essai 3 jours" onPress={() => bientot('plus')} />
          {/* accRow */}
          {email ? (
            <Card style={[styles.row, styles.acc]}>
              <Icon name="user" color={colors.pink} />
              <View style={styles.flex}>
                <Text weight="semibold" style={styles.h5} numberOfLines={1}>
                  {email}
                </Text>
                <Text style={styles.p}>Compte email • sauvegardé au Canada</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                style={styles.logout}
                onPress={() =>
                  confirmer('Te déconnecter ?', 'Tes données restent sauvegardées sur ton compte.', 'Déconnexion', async () => {
                    await deconnecter();
                    router.replace('/bienvenue');
                  })
                }
              >
                <Text weight="bold" style={styles.logoutTxt}>
                  Déconnexion
                </Text>
              </Pressable>
            </Card>
          ) : (
            <Ligne
              icon="user"
              titre="Créer mon compte"
              sous="Sauvegarde ta progression avec Google ou ton email"
              onPress={() => router.push({ pathname: '/compte', params: { mode: 'signup' } })}
            />
          )}
          <Ligne
            icon="coach"
            titre="Changer de coach"
            sous="Ton programme sera recréé avec son style"
            onPress={() => router.push({ pathname: '/onboarding/coach', params: { depuis: 'profil' } })}
          />
          <Ligne
            icon="target"
            titre="Mes objectifs"
            sous={p.goals.map((g) => GOALS.find((x) => x[0] === g)?.[1]).join(', ')}
            onPress={() => router.push({ pathname: '/onboarding/objectifs', params: { depuis: 'profil' } })}
          />
          <Ligne icon="edit" titre="Niveau, matériel, poids, âge" sous={`${p.days} jours par semaine`} onPress={() => router.push('/reglages')} />
          <Ligne icon="bell" titre="Notifications" sous="VFC post-séance, bilan de nuit, coucher" onPress={() => bientot('notifications')} />
          <Ligne icon="moon" titre="Sommeil" sous="Tes nuits, ta VFC nocturne et ton score" onPress={() => router.push('/sommeil')} />
          <Ligne icon="bt" titre="Ceinture cardio Bluetooth" sous="Arrive avec Apple Santé" onPress={() => bientot('sante')} />
          <Ligne icon="scale" titre="Ajouter mon poids" sous={`Dernier : ${dec(p.weight)} kg`} chevron="plus" onPress={() => setPesee(true)} />
          <Ligne
            icon="refresh"
            titre="Recommencer l'onboarding"
            sous="Remet ton profil à zéro"
            chevron={null}
            onPress={() =>
              confirmer("Recommencer l'onboarding ?", 'Ton profil sera remis à zéro.', 'Recommencer', () => {
                useProfil.getState().reset();
                router.replace('/bienvenue');
              })
            }
          />
          <Ligne icon="book" titre="Conditions d'utilisation" sous="Et avertissement santé" onPress={() => router.push('/legal/conditions')} />
          <Ligne icon="book" titre="Politique de confidentialité" sous="Tes données et tes droits (Loi 25)" onPress={() => router.push('/legal/confidentialite')} />
          <Ligne
            icon="x"
            titre={email ? 'Supprimer mon compte' : 'Effacer toutes mes données'}
            sous="Suppression définitive, sans retour possible"
            chevron={null}
            danger
            onPress={supprimer}
          />
        </View>
        <View style={{ height: 10 }} />
      </ScrollView>
      <PeseeSheet visible={pesee} onClose={() => setPesee(false)} />
    </SafeAreaView>
  );
}

/** Ligne du menu (.menu .card.row). */
function Ligne({
  icon,
  titre,
  sous,
  onPress,
  chevron = 'right',
  danger,
}: {
  icon: IconName;
  titre: string;
  sous: string;
  onPress: () => void;
  chevron?: IconName | null;
  danger?: boolean;
}) {
  const couleur = danger ? '#FF6B85' : colors.pink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={titre} onPress={onPress}>
      <Card style={styles.row}>
        <Icon name={icon} color={couleur} />
        <View style={styles.flex}>
          <Text weight="semibold" style={[styles.h5, danger && { color: couleur }]}>
            {titre}
          </Text>
          {sous ? <Text style={styles.p}>{sous}</Text> : null}
        </View>
        {chevron && <Icon name={chevron} color={colors.textSecondary} />}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  prof: { alignItems: 'center', paddingTop: 18, paddingHorizontal: 20, paddingBottom: 6 },
  bot: { height: 150, width: 200, alignItems: 'center', justifyContent: 'center' },
  botImg: { height: 150, width: 150 },
  h2: { fontSize: 22, lineHeight: 28, marginTop: 6 },
  sous: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  xp: { width: '100%', marginTop: 14 },
  xpBar: { height: 8, borderRadius: 8, backgroundColor: colors.border, overflow: 'hidden' },
  xpFill: { height: '100%' },
  xpLbl: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xpTxt: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  menu: { paddingHorizontal: 20, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  acc: {},
  h5: { fontSize: 14.5, lineHeight: 19, fontFamily: fonts.semibold },
  p: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  logout: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#1A1A1F',
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTxt: { fontSize: 12.5, lineHeight: 16 },
});
