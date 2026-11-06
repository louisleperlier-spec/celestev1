import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sheet } from '@/components/app/Sheet';
import { BigNumber, Button, Icon, Text, toast, type IconName } from '@/components/ui';
import { COACHES } from '@/data/coaches';
import { PLANS } from '@/data/monetisation';
import { mmss } from '@/lib/coeur';
import { coachById, prog } from '@/lib/plan';
import { isPremium, money, type OffreId } from '@/lib/premium';
import { achatsReels, acheterReel, eligibilites, restaurerReel } from '@/store/achats';
import { useCompte } from '@/store/compte';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, gradients, ui } from '@/theme';

type Offre = {
  id: OffreId;
  nom: string;
  prix: number;
  per: string;
  trial?: number;
  after?: number;
};
/**
 * Offre de sortie : 39,99 $ payés d'avance pour la 1re année, ensuite 59,99 $/an (produit `…annuel.offre`, sans essai
 * gratuit dans App Store Connect). Proposée seulement si Apple l'accorde encore à ce compte (`eligibilites`).
 */
const OFFRE_SORTIE: Offre = {
  id: 'an39',
  nom: 'Annuel (offre 1re année)',
  prix: 39.99,
  per: 'an',
  after: 59.99,
};

/** Paywall NÉA Plus (vPaywall du prototype). `?suite=compte` : fin de l'onboarding, la création de compte suit. */
export default function Plus() {
  const { suite } = useLocalSearchParams<{ suite?: string }>();
  const p = useProfil();
  const c = coachById(p.coach);
  const pr = prog(p);
  const [sel, setSel] = useState<OffreId>('an');
  const [achat, setAchat] = useState<Offre | null>(null);
  const [sortie, setSortie] = useState(false);
  const [croix, setCroix] = useState(false);
  // Offres de bienvenue qu'Apple accorde encore à ce compte (null : achat simulé, tout est possible).
  const [elig, setElig] = useState<{ essai: boolean; offre: boolean } | null>(null);
  useEffect(() => {
    let vivant = true;
    void eligibilites().then((e) => vivant && setElig(e));
    return () => {
      vivant = false;
    };
  }, []);
  // Plus d'essai gratuit pour qui l'a déjà eu : on n'affiche pas une promesse qu'Apple ne tiendrait pas.
  const plans = PLANS.map((x) => (x.trial && elig && !elig.essai ? { ...x, trial: undefined } : x));
  const plan = plans.find((x) => x.id === sel) ?? plans[0];
  const mo = PLANS[1].prix * 12;
  const save = Math.round((1 - PLANS[0].prix / mo) * 100);

  // La croix n'apparaît qu'après 2 secondes.
  useEffect(() => {
    const t = setTimeout(() => setCroix(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const partir = () => {
    if (suite === 'compte') router.replace({ pathname: '/compte', params: { onb: '1' } });
    else if (router.canGoBack()) router.back();
    else router.replace('/accueil');
  };

  /** Fermer : l'offre de sortie une seule fois, 10 minutes (data-pwclose). */
  const fermer = () => {
    const st = useProfil.getState();
    const offrePossible = !achatsReels() || elig?.offre === true;
    if (offrePossible && !isPremium() && (!st.exitUntil || st.exitUntil > Date.now()) && !st.exitDeclined) {
      if (!st.exitUntil) st.set({ exitUntil: Date.now() + 10 * 60000 });
      setSortie(true);
      return;
    }
    partir();
  };

  const acheter = async (o: Offre) => {
    setAchat(null);
    if (achatsReels()) {
      // Vrai achat : feuille de paiement d'Apple, l'abonnement arrive par RevenueCat.
      const r = await acheterReel(o.id);
      if (r === 'annule') return;
      if (r === 'introuvable') return toast("Cet abonnement n'est pas encore disponible sur l'App Store. Réessaie plus tard.");
      if (r === 'attente') return toast("Paiement en attente chez Apple : NÉA Plus s'ouvrira dès qu'il sera confirmé.");
      if (r === 'erreur') return toast("L'achat n'a pas abouti. Si Apple t'a débité, touche « Restaurer ».");
      useProfil.getState().recompenserAchat();
    } else useProfil.getState().acheterPlus(o.id);
    toast(o.trial ? 'Essai activé : 3 jours offerts' : 'Bienvenue dans NÉA Plus');
    setTimeout(partir, 900);
  };

  const restaurer = async () => {
    if (achatsReels()) {
      if (await restaurerReel()) {
        toast('Achat restauré');
        partir();
      } else toast('Aucun abonnement trouvé pour ce compte Apple');
      return;
    }
    if (isPremium()) {
      toast('Achat restauré');
      partir();
    } else toast(useCompte.getState().userId ? 'Aucun achat trouvé pour ce compte' : 'Connecte-toi pour restaurer tes achats');
  };

  // Avantages (PaywallBevelFeatureCatalog) : les 3 principaux, puis « inclut également ».
  const feats: [IconName, string][] = [
    ['dumb', `Tous les programmes des ${COACHES.length} coachs`],
    ['bulle', 'Ton coach IA en illimité'],
    ['heart', 'Récupération avancée'],
  ];
  const aussi: [IconName, string][] = [
    ['bolt', 'Turbo XP et boosts'],
    ['bike', 'Vélo : zones cardio et historique'],
  ];
  const cta = plan.trial ? `Essayer ${plan.trial} jours gratuitement` : 'Continuer, sans engagement';
  const mensuel = plans[1];
  const annuel = plans[0];

  return (
    <View style={styles.root}>
      {/* Fond (PaywallBevelBackdrop) : noir en haut, qui se réchauffe vers l'orange NÉA en bas. */}
      <LinearGradient
        colors={[colors.bgAlt, colors.bgAlt, alpha(colors.pink, 0.06), alpha(colors.pink, 0.16), alpha(colors.pink, 0.24)]}
        locations={[0, 0.3, 0.55, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        {/* Croix : visible après 2 s */}
        <View style={styles.haut}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={fermer} disabled={!croix} style={[styles.pwx, { opacity: croix ? 1 : 0 }]}>
            <Icon name="x" size={18} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.h1}>
            {'Débloque ton plan personnalisé avec '}
            <Text style={[styles.h1, styles.h1Plus]}>{'NÉA\u00a0Plus'}</Text>
          </Text>
          <Text style={styles.sub}>
            {p.name ? p.name + ', ton' : 'Ton'} programme « {pr.nom} » avec {c.nom}, au même endroit.
          </Text>

          <View style={styles.feats}>
            {feats.map(([ic, t]) => (
              <Avantage key={t} icon={ic} texte={t} />
            ))}
            <View style={styles.aussi}>
              <View style={styles.aussiTrait} />
              <Text weight="medium" style={styles.aussiTxt}>
                inclut également
              </Text>
              <View style={styles.aussiTrait} />
            </View>
            {aussi.map(([ic, t]) => (
              <Avantage key={t} icon={ic} texte={t} />
            ))}
          </View>
        </ScrollView>

        <View style={styles.foot}>
          <ChoixOffre
            sel={sel}
            onChange={setSel}
            annuel={{ titre: annuel.nom, barre: money(mo), prix: money(annuel.prix) }}
            mensuel={{ titre: mensuel.nom, prix: money(mensuel.prix) }}
            badge={`Économise ${save} %`}
          />
          <Text style={styles.essai}>
            {plan.trial ? `${plan.trial} jours gratuits, puis ${money(plan.prix)} CA par ${plan.per}` : `${money(plan.prix)} CA par ${plan.per}`}
          </Text>
          <BoutonBlanc label={cta} onPress={() => (achatsReels() ? acheter(plan) : setAchat(plan))} />
          <Text style={styles.legal}>
            {plan.trial
              ? `Puis ${money(plan.prix)} CA/${plan.per}, renouvelé automatiquement. Annule au moins 24 h avant la fin de l'essai pour éviter les frais. Taxes en sus.`
              : `${money(plan.prix)} CA par ${plan.per}, renouvelé automatiquement sauf annulation au moins 24 h avant la fin de la période. Taxes en sus.`}
          </Text>
          <View style={styles.liens}>
            <Text style={styles.lien} onPress={restaurer}>
              Restaurer
            </Text>
            <Text style={styles.lienSep}>•</Text>
            <Text style={styles.lien} onPress={() => router.push('/legal/conditions')}>
              Conditions
            </Text>
            <Text style={styles.lienSep}>•</Text>
            <Text style={styles.lien} onPress={() => router.push('/legal/confidentialite')}>
              Confidentialité
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <AchatSheet offre={achat} onClose={() => setAchat(null)} onConfirm={acheter} />
      {/* Montée à l'ouverture seulement : le compte à rebours part de l'heure réelle. */}
      {sortie && (
        <OffreSortie
          visible
          prenom={p.name}
          onAccept={() => {
            setSortie(false);
            if (achatsReels()) void acheter(OFFRE_SORTIE);
            else setAchat(OFFRE_SORTIE);
          }}
          onRefus={() => {
            useProfil.getState().set({ exitDeclined: true });
            setSortie(false);
            partir();
          }}
          onFin={() => {
            setSortie(false);
            partir();
          }}
        />
      )}
    </View>
  );
}

/** Ligne d'avantage (PaywallBevelFeatureRow) : icône dans une case de 30 pt, texte en 17 medium. */
function Avantage({ icon, texte }: { icon: IconName; texte: string }) {
  return (
    <View style={styles.feat}>
      <View style={styles.featIc}>
        <Icon name={icon} size={22} color={alpha(colors.text, 0.88)} />
      </View>
      <Text weight="medium" style={styles.featTxt}>
        {texte}
      </Text>
    </View>
  );
}

/**
 * Choix Annuel / Mensuel (PaywallBevelPlanSegmentPicker) : rail à liseré, pastille de verre qui glisse vers l'offre choisie
 * (ressort), prix barré de l'annuel (12 mois au prix mensuel) et badge d'économie posé sur le bord haut.
 */
function ChoixOffre({
  sel,
  onChange,
  annuel,
  mensuel,
  badge,
}: {
  sel: OffreId;
  onChange: (o: OffreId) => void;
  annuel: { titre: string; barre: string; prix: string };
  mensuel: { titre: string; prix: string };
  badge: string;
}) {
  const [larg, setLarg] = useState(0);
  const x = useSharedValue(sel === 'an' ? 0 : 1);
  useEffect(() => {
    x.set(withSpring(sel === 'an' ? 0 : 1, { damping: 20, stiffness: 220, mass: 0.8 }));
  }, [sel, x]);
  const moitie = larg / 2;
  const pastille = useAnimatedStyle(() => ({ width: moitie, transform: [{ translateX: x.value * moitie }] }));
  const segs: { id: OffreId; titre: string; prix: string; barre?: string }[] = [
    { id: 'an', ...annuel },
    { id: 'mois', ...mensuel },
  ];
  return (
    <View style={styles.rail} onLayout={(e: LayoutChangeEvent) => setLarg(e.nativeEvent.layout.width - 12)} accessibilityRole="radiogroup">
      {larg > 0 && <Animated.View pointerEvents="none" style={[styles.pastilleOffre, pastille]} />}
      {segs.map((o) => {
        const on = o.id === sel;
        return (
          <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.id)} style={styles.seg}>
            <Text weight={on ? 'bold' : 'semibold'} style={[styles.segTitre, !on && styles.segOff]}>
              {o.titre}
            </Text>
            <Text style={styles.segPrixLigne} numberOfLines={1}>
              {o.barre ? <Text style={[styles.segBarre, !on && styles.segOff]}>{o.barre} </Text> : null}
              <Text weight={on ? 'bold' : 'semibold'} style={[styles.segPrix, !on && styles.segOff]}>
                {o.prix}
              </Text>
            </Text>
          </Pressable>
        );
      })}
      <View pointerEvents="none" style={[styles.badgeZone, { width: moitie }]}>
        <View style={styles.badge}>
          <Text weight="bold" style={styles.badgeTxt}>
            {badge}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Bouton Continuer (PaywallBevelContinueButton) : pilule blanche de 56 pt à texte noir, halo orange flou derrière. */
function BoutonBlanc({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <View style={styles.ctaZone}>
      <View pointerEvents="none" style={styles.ctaHalo} />
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.cta, pressed && styles.ctaPresse]}>
        <Text weight="bold" style={styles.ctaTxt}>
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

/** Confirmation d'achat simulée (buySheet), sans clé RevenueCat ; sinon la feuille de paiement d'Apple la remplace. */
function AchatSheet({ offre: o, onClose, onConfirm }: { offre: Offre | null; onClose: () => void; onConfirm: (o: Offre) => void }) {
  return (
    <Sheet visible={!!o} onClose={onClose}>
      {o && (
        <>
          <View style={styles.buyh}>
            <Text weight="bold" style={styles.buyTitre}>
              Confirmer
            </Text>
            <Text weight="bold" style={styles.buySimule}>
              Achat simulé : aucun paiement réel
            </Text>
          </View>
          <View style={styles.buyr}>
            <Text style={styles.b14}>NÉA Plus {o.nom}</Text>
            <Text weight="bold" style={styles.b14}>
              {o.trial ? 'Gratuit ' + o.trial + ' jours' : money(o.prix)}
            </Text>
          </View>
          {o.trial ? (
            <View style={styles.buyr}>
              <Text style={styles.b14}>Ensuite</Text>
              <Text weight="bold" style={styles.b14}>
                {money(o.prix)} la 1re année
                {o.after ? ', puis ' + money(o.after) + '/an' : ''}
              </Text>
            </View>
          ) : null}
          <Text style={styles.buyNote}>Dans l&apos;app publiée, cette fenêtre sera celle de l&apos;App Store ou de Google Play.</Text>
          <Button label={o.trial ? "Commencer l'essai" : 'Payer ' + money(o.prix)} onPress={() => onConfirm(o)} />
        </>
      )}
    </Sheet>
  );
}

/** Offre de sortie, une seule fois, compte à rebours réel de 10 minutes (exitOffer). */
function OffreSortie({
  visible,
  prenom,
  onAccept,
  onRefus,
  onFin,
}: {
  visible: boolean;
  prenom: string;
  onAccept: () => void;
  onRefus: () => void;
  onFin: () => void;
}) {
  const fin = useProfil((s) => s.exitUntil);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!visible) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [visible]);
  const reste = Math.max(0, Math.round((fin - now) / 1000));
  useEffect(() => {
    if (visible && fin && reste <= 0) onFin();
  }, [visible, fin, reste, onFin]);
  return (
    <Sheet visible={visible} onClose={onRefus}>
      <View style={styles.exh}>
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[styles.plus, styles.plusExh]}>
          <Text weight="extrabold" style={styles.plusTxt}>
            OFFRE UNIQUE
          </Text>
        </LinearGradient>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onRefus} style={styles.exx}>
          <Icon name="x" size={15} />
        </Pressable>
      </View>
      <Text weight="extrabold" style={styles.exti}>
        Attends {prenom} ! −33 % sur ta première année
      </Text>
      <View style={styles.exprice}>
        <Text style={styles.exBarre} numberOfLines={1}>
          59,99 $
        </Text>
        <BigNumber value="39,99 $" size={44} color={ui.plusLien} />
        <Text style={styles.exSmall}>la première année</Text>
      </View>
      <Text style={styles.exSub}>
        Soit <Text style={styles.exBlanc}>0,77 $ par semaine</Text> pour ta première année.
      </Text>
      <View style={styles.exclock}>
        <Icon name="clock" size={16} color={ui.plusLien} />
        <Text style={styles.exClockTxt}>Offre valable encore </Text>
        <Text weight="bold" style={[styles.exClockTxt, { color: ui.plusLien, fontVariant: ['tabular-nums'] }]}>
          {mmss(reste)}
        </Text>
      </View>
      <Button label="Profiter de l'offre" onPress={onAccept} />
      <Pressable accessibilityRole="button" onPress={onRefus}>
        <Text style={styles.skip}>Non merci, continuer en gratuit</Text>
      </Pressable>
      <Text style={styles.legal}>
        39,99 $ payés aujourd&apos;hui pour la première année, ensuite 59,99 $ par an, renouvelé automatiquement sauf annulation au moins 24 h avant la fin de
        la période. Offre proposée une seule fois, pour un premier abonnement. Taxes en sus.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  ctaTxt: { fontSize: 17, lineHeight: 22, color: colors.bgAlt },
  ctaPresse: { opacity: 0.94, transform: [{ scale: 0.985 }] },
  cta: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    boxShadow: `0 4px 16px ${alpha(colors.pink, 0.35)}`,
  },
  ctaHalo: {
    position: 'absolute',
    left: 4,
    right: 4,
    top: 6,
    bottom: 6,
    borderRadius: 999,
    backgroundColor: alpha(colors.pink, 0.38),
    boxShadow: `0 0 22px 6px ${alpha(colors.pink, 0.45)}`,
  },
  ctaZone: { marginTop: 12, justifyContent: 'center' },
  essai: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary, textAlign: 'center', marginTop: 12 },
  badgeTxt: { fontSize: 12, lineHeight: 15, color: colors.onPrimary },
  badgeZone: { position: 'absolute', top: -12, left: 6, alignItems: 'center' },
  badge: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.pink },
  segBarre: { fontSize: 16, lineHeight: 21, color: colors.textSecondary, textDecorationLine: 'line-through' },
  segPrix: { fontSize: 16, lineHeight: 21, color: colors.text },
  segPrixLigne: { fontSize: 16, lineHeight: 21 },
  segOff: { color: alpha(colors.text, 0.56) },
  segTitre: { fontSize: 18, lineHeight: 23 },
  seg: { flex: 1, minHeight: 88, justifyContent: 'center', gap: 7, paddingHorizontal: 14 },
  pastilleOffre: {
    position: 'absolute',
    top: 6,
    left: 6,
    bottom: 6,
    borderRadius: 24,
    backgroundColor: alpha(colors.text, 0.12),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: alpha(colors.text, 0.3),
    boxShadow: `0 2px 6px ${alpha(colors.bgAlt, 0.5)}`,
  },
  rail: { flexDirection: 'row', padding: 6, marginTop: 12, borderRadius: 30, borderWidth: 1, borderColor: alpha(colors.text, 0.26) },
  aussiTxt: { fontSize: 12, lineHeight: 16, color: colors.textTertiary },
  aussiTrait: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border2 },
  aussi: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  featIc: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  h1Plus: { color: colors.pink },
  root: { flex: 1, backgroundColor: colors.bgAlt },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  haut: { height: 48, paddingHorizontal: 16, alignItems: 'flex-end', justifyContent: 'center' },
  eyebrow: { fontSize: 15, lineHeight: 20, letterSpacing: 2.4, color: colors.pink, textAlign: 'center' },
  featTxt: { flex: 1, fontSize: 17, lineHeight: 22, color: alpha(colors.text, 0.92) },
  plTete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  eco: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.pink },
  ecoTxt: { fontSize: 13, lineHeight: 17, color: colors.onPrimary },
  prixLigne: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  prix: { justifyContent: 'flex-start' },
  per: { fontSize: 17, lineHeight: 22, color: colors.textSecondary },
  plSous: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 2 },
  radPoint: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pink },
  tlRang: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  tlPoint: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.textSecondary },
  tlPointOn: { backgroundColor: colors.pink },
  tlTxt: { flex: 1, fontSize: 15.5, lineHeight: 21 },
  liens: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 10 },
  lienSep: { fontSize: 13, lineHeight: 18, color: colors.textTertiary },
  plus: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginTop: 10,
  },
  plusExh: { marginTop: 0 },
  plusTxt: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2.2,
    color: ui.onGold,
  },
  h1: { ...fonts.bold, fontSize: 31, lineHeight: 37, letterSpacing: -0.45, textAlign: 'center' },
  sub: { color: colors.textSecondary, fontSize: 15, lineHeight: 20, marginTop: 12, textAlign: 'center' },
  feats: { paddingTop: 26, paddingHorizontal: 2 },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  b14: { fontSize: 14, lineHeight: 18 },
  small12: { fontSize: 12, lineHeight: 16, color: colors.textSecondary, marginTop: 2 },
  plans: { gap: 12, paddingTop: 24 },
  pl: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  plOn: { borderColor: colors.pink, borderWidth: 2, backgroundColor: ui.selFond },
  rad: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radOn: { borderColor: colors.pink },
  plNom: { fontSize: 18, lineHeight: 23 },
  tl: { marginTop: 22, paddingTop: 18, gap: 18, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 12 },
  tlLigne: { position: 'absolute', left: 18, top: 30, bottom: 8, width: 2, backgroundColor: colors.border2 },
  foot: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 8 },
  legal: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  lien: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  pwx: { width: 34, height: 34, borderRadius: 17, backgroundColor: alpha(colors.text, 0.12), alignItems: 'center', justifyContent: 'center' },
  buyh: { alignItems: 'center', marginBottom: 14 },
  buyTitre: { fontSize: 17, lineHeight: 22 },
  buySimule: {
    fontSize: 11,
    lineHeight: 15,
    color: gradients.gold[1],
    letterSpacing: 0.44,
  },
  buyr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  buyNote: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
    paddingTop: 6,
    paddingBottom: 12,
  },
  exh: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exx: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ui.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exti: {
    fontSize: 21,
    lineHeight: 25,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  exprice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 10,
  },
  exBarre: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  exSmall: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  exSub: {
    fontSize: 14,
    lineHeight: 19.6,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  exBlanc: { ...fonts.bold, color: colors.text },
  exclock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 14,
  },
  exClockTxt: { fontSize: 13.5, lineHeight: 18, color: ui.text3 },
  skip: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
