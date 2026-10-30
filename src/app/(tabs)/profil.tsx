import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import { Children, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDefilementOnglets } from '@/components/app/TabBar';
import { BarreTraits } from '@/components/app/ProgrammeHaut';
import { ouvrirSante, ouvrirWatch } from '@/components/app/ouvrirSante';
import { ouvrirPlus } from '@/components/app/ouvrirPlus';
import { confirmer } from '@/components/app/confirmer';
import { AbonnementSheet } from '@/components/app/AbonnementSheet';
import { NotifSheet } from '@/components/app/NotifSheet';
import { PeseeSheet } from '@/components/app/PeseeSheet';
import { Glow, Icon, Segmente, Text, toast, type IconName } from '@/components/ui';
import { COACH_IMAGES, GOALS } from '@/data';
import { MASCOTTE_IMAGES } from '@/data/images';
import { dec } from '@/lib/charges';
import { ordreAccueil } from '@/lib/accueil';
import { expressionEnrage, messageEnrage, NB_MESSAGES_ENRAGE, NIVEAUX_ENRAGE, type NiveauEnrage } from '@/lib/enrage';
import type { AlertesSante, ReglagesNotifs } from '@/lib/notifs';
import { testerAlertes } from '@/store/alertes';
import { annoncer, demanderAutorisation } from '@/store/notifs';
import { coachById, LVLN, lvlN, prog, progWeek } from '@/lib/plan';
import { estPremium, ligneAbonnement } from '@/lib/premium';
import { santeDisponible } from '@/lib/sante';
import { lvlInfo, rankOf } from '@/lib/xp';
import { deconnecter, supprimerCompte, useCompte } from '@/store/compte';
import { selectProfil, useProfil } from '@/store/profil';

import { NeaMontre } from '../../../modules/nea-montre/src';
import { alpha, colors, ui } from '@/theme';

/** Onglet Profil (vProfile du prototype). */
export default function Profil() {
  const defile = useDefilementOnglets();
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
      <Animated.ScrollView onScroll={defile} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={styles.page}>
        {/* Barre du haut (design 10K « Réglages ») : retour rond, titre centré. */}
        <View style={styles.barre}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.navigate('/accueil')} style={styles.retour}>
            <Icon name="left" size={19} strokeWidth={2.2} />
          </Pressable>
          <Text weight="semibold" style={styles.barreTitre} accessibilityRole="header">
            Profil
          </Text>
          <View style={styles.vide} />
        </View>

        {/* Mon compte : avatar du coach, prénom et repères, puis le niveau en barre de traits. */}
        <View style={[styles.carte, styles.premiere]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Modifier mon profil" onPress={() => router.push('/reglages')} style={({ pressed }) => [styles.compte, pressed && styles.appui]}>
            <View style={[styles.avatar, { borderColor: c.c }]}>
              <Image source={COACH_IMAGES[c.id].tete} style={styles.avatarImg} contentFit="contain" />
            </View>
            <View style={styles.flex}>
              <Text weight="semibold" style={styles.nom} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.valeur} numberOfLines={1}>
                Coach {c.nom} · {dec(p.weight)} kg · {p.age} ans
              </Text>
            </View>
            <Icon name="right" size={14} color={colors.textTertiary} strokeWidth={2.4} />
          </Pressable>
          <View style={styles.sep} />
          <View style={styles.niveau}>
            <View style={styles.niveauHaut}>
              <Text weight="semibold" style={styles.niveauTitre}>
                Niveau {lv} · {rankOf(lv)[0]}
              </Text>
              <Text style={styles.niveauXp}>
                {li.cur} / {li.need} XP
              </Text>
            </View>
            <BarreTraits part={li.cur / li.need} />
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
          <Bascule icon="wave" titre="VFC après la séance" sous="Rappel pour mesurer ta récupération" on={p.nset.post} onChange={(v) => alerte({ post: v })} />
          <Bascule icon="moon" titre="Bilan de la nuit" sous={`Le matin à ${p.nset.wake}`} on={p.nset.sleep} onChange={(v) => alerte({ sleep: v })} />
          <Bascule icon="clock" titre="Rappel du coucher" sous={`À ${p.nset.bedT}, pour viser 8 h`} on={p.nset.bed} onChange={(v) => alerte({ bed: v })} />
          <Bascule icon="spark" titre="Motivation du jour" sous={`Un message différent chaque matin à ${p.nset.motivT ?? '08:00'}`} on={p.nset.motiv !== false} onChange={(v) => alerte({ motiv: v })} />
          <Bascule icon="dumb" titre="Rappel de séance" sous="« On bouge ensemble ? » à 18 h les jours de séance" on={p.nset.seance !== false} onChange={(v) => alerte({ seance: v })} />
          <Bascule icon="heart" titre="Mon cœur" sous="Bilan du matin (FC au repos, VFC) et conseils pour ton rythme" on={p.nset.coeur !== false} onChange={(v) => alerte({ coeur: v })} />
          <Ligne icon="bell" titre="Heures et délai" sous="Réveil, coucher, délai après la séance" onPress={() => setReglages(true)} />
        </Section>

        <View style={styles.enrageTete}>
          <Glow width={200} height={160} intensity={0.45} />
          <Image
            source={MASCOTTE_IMAGES[p.nset.enrage ? expressionEnrage('seance', p.nset.enrageNiv ?? 'venere') : 'fatigue']}
            style={styles.enrageImg}
            contentFit="contain"
          />
          <Text style={styles.enrageBulle}>{p.nset.enrage ? 'Je te surveille. 👀' : 'Je dors… pour l’instant. 💤'}</Text>
        </View>
        <Section titre="Axel Enragé 😤">
          <Bascule
            icon="flame"
            titre="Mode Sans excuses"
            sous={`Axel te relance (19 h 30, 21 h, série en danger, absence) avec ${NB_MESSAGES_ENRAGE} messages. Il se calme si ton cœur demande du repos.`}
            on={!!p.nset.enrage}
            onChange={(v) => {
              alerte({ enrage: v });
              if (v) void demanderAutorisation();
              toast(v ? 'Axel est réveillé. Bonne chance. 😤' : 'Axel retourne se calmer. 😌');
            }}
          />
          {!!p.nset.enrage && (
            <View style={styles.enrage}>
              <Segmente
                options={(Object.keys(NIVEAUX_ENRAGE) as NiveauEnrage[]).map((k) => [k, NIVEAUX_ENRAGE[k].nom] as [NiveauEnrage, string])}
                value={p.nset.enrageNiv ?? 'venere'}
                onChange={(v) => alerte({ enrageNiv: v })}
              />
              <Text style={styles.enrageDesc}>{NIVEAUX_ENRAGE[p.nset.enrageNiv ?? 'venere'].desc}</Text>
            </View>
          )}
          {!!p.nset.enrage && (
            <Ligne
              icon="flame"
              titre="Me faire secouer maintenant"
              sous="Un exemple tout de suite"
              onPress={() => {
                const ex = messageEnrage('seance', p.nset.enrageNiv ?? 'venere', { prenom: p.name, seance: 'Ta séance', date: new Date(Date.now() + Math.floor(Math.random() * 30) * 864e5) });
                annoncer({ type: 'motivation', icon: 'flame', col: colors.pink, act: 'seance', masc: expressionEnrage('seance', p.nset.enrageNiv ?? 'venere'), ...ex });
              }}
            />
          )}
        </Section>

        <Section titre="Alertes santé (Apple Watch)">
          <Bascule
            icon="pulse"
            titre="VFC et fatigue"
            sous="Ta forme du jour, au plus toutes les heures"
            on={p.alertesSante.vfc}
            onChange={(v) => alerteSante({ vfc: v })}
          />
          <Bascule icon="cloud" titre="Boire de l'eau" sous="Toutes les 2 h, de 10 h à 20 h" on={p.alertesSante.eau} onChange={(v) => alerteSante({ eau: v })} />
          <Bascule
            icon="bike"
            titre="Vélo et dépense du jour"
            sous="En fin d'après-midi, selon ta forme et ce qu'il reste à dépenser"
            on={p.alertesSante.velo}
            onChange={(v) => alerteSante({ velo: v })}
          />
          <Bascule icon="run" titre="Objectif de pas" sous="À 80 % puis à 10 000 pas" on={p.alertesSante.pas} onChange={(v) => alerteSante({ pas: v })} />
          <Ligne
            icon="bell"
            titre="Tester mes alertes"
            sous="8 exemples en 40 s : quitte l'app pour les voir"
            onPress={() =>
              testerAlertes().then((ok) =>
                toast(ok ? 'Quitte NÉA ou verrouille ton iPhone : 4 alertes arrivent 😉' : 'Autorise les notifications de NÉA dans Réglages'),
              )
            }
          />
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
          <Ligne icon="star" titre="Noter NÉA" sous="Ton avis sur l'App Store aide beaucoup" onPress={() => router.push('/noter')} />
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
        </Section>

        {/* Suppression (bouton rouge du design 10K), puis la version. */}
        <Pressable accessibilityRole="button" onPress={supprimer} style={({ pressed }) => [styles.supprimer, pressed && styles.presse]}>
          <Icon name="x" size={17} color={colors.error} strokeWidth={2.4} />
          <Text weight="semibold" style={styles.supprimerTxt}>
            {email ? 'Supprimer mon compte' : 'Effacer toutes mes données'}
          </Text>
        </Pressable>
        <Text style={styles.version}>{version()}</Text>
      </Animated.ScrollView>
      <PeseeSheet visible={pesee} onClose={() => setPesee(false)} />
      <NotifSheet visible={reglages} onClose={() => setReglages(false)} />
      <AbonnementSheet visible={abonnement} onClose={() => setAbonnement(false)} />
    </SafeAreaView>
  );
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** Version de l'app et date de la mise à jour en cours (pied du design 10K). */
function version() {
  const v = Constants.expoConfig?.version ?? '1.0.0';
  const d = Updates.createdAt;
  return d ? `NÉA v${v} · mise à jour du ${d.getDate()} ${MOIS[d.getMonth()]}` : `NÉA v${v}`;
}

/** Section (design 10K « Réglages ») : titre gris, puis ses lignes dans une carte à liseré, séparées sous le texte. */
function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  const lignes = Children.toArray(children).filter(Boolean);
  return (
    <View>
      <Text weight="semibold" style={styles.sectionTitre}>
        {titre}
      </Text>
      <View style={styles.carte}>
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

/** Ligne : icône seule dans sa colonne, titre de 16 pt, précision grise, chevron (ou rien). */
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
  const couleur = danger ? colors.error : (teinte ?? alpha(colors.text, 0.86));
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={titre} onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.appui]}>
      <View style={styles.icone}>
        <Icon name={icon} size={19} color={couleur} strokeWidth={1.9} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.titre, danger && { color: couleur }]} numberOfLines={1}>
          {titre}
        </Text>
        {sous ? (
          <Text style={styles.valeur} numberOfLines={2}>
            {sous}
          </Text>
        ) : null}
      </View>
      {chevron && <Icon name={chevron} size={14} color={colors.textTertiary} strokeWidth={2.4} />}
    </Pressable>
  );
}

/** Alerte activable dans la liste. */
function Bascule({ icon, titre, sous, on, onChange }: { icon: IconName; titre: string; sous: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.icone}>
        <Icon name={icon} size={19} color={alpha(colors.text, 0.86)} strokeWidth={1.9} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.titre}>{titre}</Text>
        <Text style={styles.valeur}>{sous}</Text>
      </View>
      <Switch
        value={on}
        onValueChange={onChange}
        trackColor={{ true: colors.pink, false: alpha(colors.text, 0.16) }}
        thumbColor={colors.text}
        accessibilityLabel={titre}
      />
    </View>
  );
}

const MARGE = 16;
const COLONNE = 28;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  page: { paddingHorizontal: MARGE, paddingBottom: 130 },
  barre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  retour: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.text, 0.1) },
  vide: { width: 40, height: 40 },
  barreTitre: { fontSize: 16, lineHeight: 21 },
  premiere: { marginTop: 24 },
  carte: { borderRadius: 22, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: alpha(colors.text, 0.1), overflow: 'hidden' },
  compte: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: MARGE, paddingVertical: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44 },
  nom: { fontSize: 18, lineHeight: 23 },
  niveau: { paddingHorizontal: MARGE, paddingTop: 12, paddingBottom: 14, gap: 10 },
  niveauHaut: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  niveauTitre: { fontSize: 15, lineHeight: 20 },
  niveauXp: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  sectionTitre: { fontSize: 13, lineHeight: 17, color: colors.textSecondary, marginTop: 28, marginBottom: 8, paddingHorizontal: MARGE },
  sep: { marginLeft: MARGE + COLONNE + 12, height: StyleSheet.hairlineWidth, backgroundColor: alpha(colors.text, 0.12) },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: MARGE, paddingVertical: 12, minHeight: 52 },
  appui: { backgroundColor: alpha(colors.text, 0.05) },
  presse: { opacity: 0.68, transform: [{ scale: 0.988 }] },
  icone: { width: COLONNE, alignItems: 'center' },
  titre: { fontSize: 16, lineHeight: 21 },
  valeur: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary, marginTop: 1 },
  enrageTete: { alignItems: 'center', marginTop: 28, marginBottom: -12 },
  enrageImg: { width: 120, height: 140 },
  enrageBulle: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 4 },
  enrage: { paddingHorizontal: MARGE, paddingVertical: 12, gap: 8 },
  enrageDesc: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  supprimer: {
    marginTop: 28,
    height: 48,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: alpha(colors.error, 0.55),
    backgroundColor: alpha(colors.error, 0.1),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  supprimerTxt: { fontSize: 17, lineHeight: 22, color: colors.error },
  version: { fontSize: 13, lineHeight: 17, color: alpha(colors.textSecondary, 0.85), textAlign: 'center', marginTop: 24 },
});
