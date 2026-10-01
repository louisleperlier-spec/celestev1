import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Children, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnTetePage } from '@/components/app/Catalogue';
import { ouvrirSante, ouvrirWatch } from '@/components/app/ouvrirSante';
import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { confirmer } from '@/components/app/confirmer';
import { AbonnementSheet } from '@/components/app/AbonnementSheet';
import { NotifSheet } from '@/components/app/NotifSheet';
import { PeseeSheet } from '@/components/app/PeseeSheet';
import { Glow, Icon, Text, toast, type IconName } from '@/components/ui';
import { COACH_IMAGES, GOALS } from '@/data';
import { dec } from '@/lib/charges';
import { ordreAccueil } from '@/lib/accueil';
import type { AlertesSante, ReglagesNotifs } from '@/lib/notifs';
import { demanderAutorisation } from '@/store/notifs';
import { coachById, LVLN, lvlN, prog, progWeek } from '@/lib/plan';
import { estPremium, ligneAbonnement } from '@/lib/premium';
import { santeDisponible } from '@/lib/sante';
import { lvlInfo, rankOf } from '@/lib/xp';
import { deconnecter, supprimerCompte, useCompte } from '@/store/compte';
import { selectProfil, useProfil } from '@/store/profil';

import { NeaMontre } from '../../../modules/nea-montre/src';
import { colors, fonts, glow, ui } from '@/theme';

/** Onglet Profil (vProfile du prototype). */
export default function Profil() {
  const p = useProfil();
  const email = useCompte((s) => s.email);
  const c = coachById(p.coach);
  const li = lvlInfo(p.xp);
  const lv = li.n;
  const [pesee, setPesee] = useState(false);
  const [reglages, setReglages] = useState(false);
  const [abonnement, setAbonnement] = useState(false);
  const profil = selectProfil(p);
  const pr = prog(profil);
  const cartesOn = ordreAccueil(p.accueil).filter((x) => x.on).length;
  const montre = !!NeaMontre?.estDisponible();
  const alerte = (r: Partial<ReglagesNotifs>) => p.reglerNotifs({ ...p.nset, ...r });
  /** Alertes santé de l'iPhone : en les activant, autorise aussi les notifications du téléphone. */
  const alerteSante = (r: Partial<AlertesSante>) => {
    useProfil.setState({ alertesSante: { ...p.alertesSante, ...r } });
    if (Object.values(r).some(Boolean)) void demanderAutorisation();
  };

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
        <EnTetePage titre="Profil" retour="/accueil" />
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

        <Section titre="Mon programme">
          <Ligne
            icon="clip"
            titre={pr.nom}
            sous={`Semaine ${progWeek(profil)} sur ${pr.sem} • ${p.days} séances de ${p.dur} min`}
            onPress={() => router.push(`/plan/${pr.id}`)}
          />
          <Ligne
            icon="cal"
            titre="Ma semaine"
            sous="Calendrier, déplacer ou ajouter une séance"
            onPress={() => router.navigate({ pathname: '/programme', params: { vue: 'calendrier' } })}
          />
          <Ligne
            icon="coach"
            titre="Mon coach"
            sous={`${c.nom} • ${c.style}`}
            onPress={() => router.push({ pathname: '/onboarding/coach', params: { depuis: 'profil' } })}
          />
          <Ligne
            icon="target"
            titre="Mes objectifs"
            sous={p.goals.map((g) => GOALS.find((x) => x[0] === g)?.[1]).join(', ')}
            onPress={() => router.push({ pathname: '/onboarding/objectifs', params: { depuis: 'profil' } })}
          />
          <Ligne
            icon="edit"
            titre="Niveau, matériel, poids, âge"
            sous={`${LVLN[lvlN(p.level) - 1]} • ${dec(p.weight)} kg • ${p.age} ans`}
            onPress={() => router.push('/reglages')}
          />
        </Section>

        <Section titre="Mon écran">
          <Ligne
            icon="sliders"
            titre="Mon écran d'accueil"
            sous={`${cartesOn} cartes affichées • ordre et choix`}
            onPress={() => router.push('/personnaliser')}
          />
          <Ligne
            icon="home"
            titre="Widgets de l'iPhone"
            sous="Bilan du jour et prochaine séance sur ton écran"
            onPress={() => router.push('/widgets')}
          />
          <Ligne
            icon="clock"
            titre="Apple Watch"
            sous={montre ? 'NÉA est installée sur ta montre' : 'Installe NÉA depuis l’app Watch de l’iPhone'}
            onPress={ouvrirWatch}
          />
        </Section>

        <Section titre="Alertes">
          <Bascule titre="VFC après la séance" sous="Rappel pour mesurer ta récupération" on={p.nset.post} onChange={(v) => alerte({ post: v })} />
          <Bascule titre="Bilan de la nuit" sous={`Le matin à ${p.nset.wake}`} on={p.nset.sleep} onChange={(v) => alerte({ sleep: v })} />
          <Bascule titre="Rappel du coucher" sous={`À ${p.nset.bedT}, pour viser 8 h`} on={p.nset.bed} onChange={(v) => alerte({ bed: v })} />
          <Ligne icon="bell" titre="Heures et délai" sous="Réveil, coucher, délai après la séance" onPress={() => setReglages(true)} />
        </Section>

        <Section titre="Alertes santé (Apple Watch)">
          <Bascule
            titre="VFC et fatigue"
            sous="Ta forme du jour, au plus toutes les heures"
            on={p.alertesSante.vfc}
            onChange={(v) => alerteSante({ vfc: v })}
          />
          <Bascule titre="Boire de l'eau" sous="Toutes les 2 h, de 10 h à 20 h" on={p.alertesSante.eau} onChange={(v) => alerteSante({ eau: v })} />
          <Bascule
            titre="Vélo et dépense du jour"
            sous="En fin d'après-midi, selon ta forme et ce qu'il reste à dépenser"
            on={p.alertesSante.velo}
            onChange={(v) => alerteSante({ velo: v })}
          />
          <Bascule titre="Objectif de pas" sous="À 80 % puis à 10 000 pas" on={p.alertesSante.pas} onChange={(v) => alerteSante({ pas: v })} />
        </Section>

        <Section titre="Santé">
          <Ligne icon="moon" titre="Sommeil" sous="Tes nuits, ta VFC nocturne et ton score" onPress={() => router.push('/sommeil')} />
          <Ligne icon="wave" titre="Mesure de récupération" sous="1 minute au calme" onPress={() => router.push('/recuperation')} />
          <Ligne
            icon="heart"
            titre="Apple Santé"
            sous={santeDisponible() ? 'Nuits, FC, calories et séances synchronisées' : "Dans l'app installée (TestFlight / App Store)"}
            onPress={ouvrirSante}
          />
          <Ligne icon="scale" titre="Ajouter mon poids" sous={`Dernier : ${dec(p.weight)} kg`} chevron="plus" onPress={() => setPesee(true)} />
        </Section>

        <Section titre="Abonnement et compte">
          <Ligne
            icon="star"
            couleur={ui.plusLien}
            titre="NÉA Plus"
            sous={ligneAbonnement(p.premium)}
            onPress={() => (estPremium(p.premium) ? setAbonnement(true) : ouvrirPlus())}
          />
          {email ? (
            <Ligne
              icon="user"
              titre={email}
              sous="Sauvegardé au Canada • toucher pour te déconnecter"
              chevron={null}
              onPress={() =>
                confirmer('Te déconnecter ?', 'Tes données restent sauvegardées sur ton compte.', 'Déconnexion', async () => {
                  await deconnecter();
                  router.replace('/bienvenue');
                })
              }
            />
          ) : (
            <Ligne
              icon="user"
              titre="Créer mon compte"
              sous="Sauvegarde ta progression avec Apple ou ton email"
              onPress={() => router.push({ pathname: '/compte', params: { mode: 'signup' } })}
            />
          )}
        </Section>

        <Section titre="Aide et confidentialité">
          <Ligne icon="book" titre="Conditions d'utilisation" sous="Et avertissement santé" onPress={() => router.push('/legal/conditions')} />
          <Ligne
            icon="book"
            titre="Politique de confidentialité"
            sous="Tes données et tes droits (Loi 25)"
            onPress={() => router.push('/legal/confidentialite')}
          />
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
          <Ligne
            icon="x"
            titre={email ? 'Supprimer mon compte' : 'Effacer toutes mes données'}
            sous="Suppression définitive, sans retour possible"
            chevron={null}
            danger
            onPress={supprimer}
          />
        </Section>
        <View style={{ height: 10 }} />
      </ScrollView>
      <PeseeSheet visible={pesee} onClose={() => setPesee(false)} />
      <NotifSheet visible={reglages} onClose={() => setReglages(false)} />
      <AbonnementSheet visible={abonnement} onClose={() => setAbonnement(false)} />
    </SafeAreaView>
  );
}

/** Section du menu : petit titre, puis ses lignes dans une seule carte. */
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  const lignes = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      <Text weight="semibold" style={styles.sectionTitre}>
        {titre}
      </Text>
      <View style={styles.groupe}>
        {lignes.map((l, i) => (
          <View key={i}>
            {i > 0 && <View style={styles.sep} />}
            {l}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Ligne du menu : icône dans une pastille, titre, précision, chevron. */
function Ligne({
  icon,
  titre,
  sous,
  onPress,
  chevron = 'right',
  danger,
  couleur: teinte,
}: {
  couleur?: string;
  icon: IconName;
  titre: string;
  sous: string;
  onPress: () => void;
  chevron?: IconName | null;
  danger?: boolean;
}) {
  const couleur = danger ? colors.error : (teinte ?? colors.pink);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={titre} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.appui]}>
      <View style={styles.tuile}>
        <Icon name={icon} size={19} color={couleur} />
      </View>
      <View style={styles.flex}>
        <Text weight="semibold" style={[styles.h5, danger && { color: couleur }]} numberOfLines={1}>
          {titre}
        </Text>
        {sous ? (
          <Text style={styles.p} numberOfLines={2}>
            {sous}
          </Text>
        ) : null}
      </View>
      {chevron && <Icon name={chevron} size={18} color={colors.textTertiary} />}
    </Pressable>
  );
}

/** Alerte activable directement dans le menu. */
function Bascule({ titre, sous, on, onChange }: { titre: string; sous: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text weight="semibold" style={styles.h5}>
          {titre}
        </Text>
        <Text style={styles.p}>{sous}</Text>
      </View>
      <Switch
        value={on}
        onValueChange={onChange}
        trackColor={{ true: colors.pink, false: ui.dark }}
        thumbColor={colors.text}
        accessibilityLabel={titre}
      />
    </View>
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
  section: { marginTop: 22, paddingHorizontal: 20 },
  sectionTitre: { fontSize: 14, lineHeight: 18, color: colors.textSecondary, marginBottom: 8, paddingHorizontal: 4 },
  groupe: { borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden' },
  sep: { position: 'absolute', top: 0, left: 62, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 60 },
  appui: { backgroundColor: colors.surface2 },
  tuile: { width: 36, height: 36, borderRadius: 10, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  h5: { fontSize: 16, lineHeight: 21, ...fonts.semibold },
  p: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: 1 },
});
