import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sheet } from '@/components/app/Sheet';
import { BigNumber, Button, Icon, Text, toast, type IconName } from '@/components/ui';
import { COACHES } from '@/data/coaches';
import { PLANS } from '@/data/monetisation';
import { mmss } from '@/lib/coeur';
import { coachById, prog } from '@/lib/plan';
import { isPremium, money, type OffreId } from '@/lib/premium';
import { achatsReels, acheterReel, restaurerReel } from '@/store/achats';
import { useCompte } from '@/store/compte';
import { useProfil } from '@/store/profil';
import { colors, fonts, gradients, ui } from '@/theme';

type Offre = {
  id: OffreId;
  nom: string;
  prix: number;
  per: string;
  trial?: number;
  after?: number;
};
/** Offre de sortie : 3 jours gratuits, puis 39,99 $ la 1re année, ensuite 59,99 $/an. */
const OFFRE_SORTIE: Offre = {
  id: 'an39',
  nom: 'Annuel (offre 1re année)',
  prix: 39.99,
  per: 'an',
  trial: 3,
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
  const [now] = useState(Date.now);
  const plan = PLANS.find((x) => x.id === sel) ?? PLANS[0];
  const mo = PLANS[1].prix * 12;
  const save = Math.round((1 - PLANS[0].prix / mo) * 100);
  const f = (d: number) => new Date(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });

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
    if (!isPremium() && (!st.exitUntil || st.exitUntil > Date.now()) && !st.exitDeclined) {
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
      if (r === 'erreur') return toast("L'achat n'a pas abouti, réessaie");
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

  const feats: [IconName, string][] = [
    ['dumb', `Tous les programmes des ${COACHES.length} coachs`],
    ['bulle', 'Ton coach IA en illimité'],
    ['heart', 'Récupération avancée'],
    ['users', "Turbo XP et boosts d'équipe"],
    ['bike', 'Vélo : zones cardio et historique'],
  ];
  const cta = plan.trial ? `Essayer ${plan.trial} jours gratuitement` : `S'abonner : ${money(plan.prix)}/${plan.per}`;

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        {/* Croix : visible après 2 s */}
        <View style={styles.haut}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={fermer} disabled={!croix} style={[styles.pwx, { opacity: croix ? 1 : 0 }]}>
            <Icon name="x" size={24} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text weight="bold" style={styles.eyebrow}>
            NÉA PLUS
          </Text>
          <Text style={styles.h1}>Va plus loin avec {c.nom}.</Text>
          <Text style={styles.sub}>
            {p.name ? p.name + ', ton' : 'Ton'} programme « {pr.nom} » est prêt.
          </Text>

          <View style={styles.feats}>
            {feats.map(([ic, t]) => (
              <View key={t} style={styles.feat}>
                <Icon name={ic} size={26} color={colors.text} />
                <Text style={styles.featTxt}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plans}>
            {PLANS.map((x) => {
              const on = x.id === sel;
              return (
                <Pressable
                  key={x.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setSel(x.id as OffreId)}
                  style={[styles.pl, on && styles.plOn]}
                >
                  <View style={[styles.rad, on && styles.radOn]}>{on && <View style={styles.radPoint} />}</View>
                  <View style={styles.flex}>
                    <View style={styles.plTete}>
                      <Text weight="bold" style={styles.plNom}>
                        {x.nom}
                      </Text>
                      {x.id === 'an' && (
                        <View style={styles.eco}>
                          <Text weight="bold" style={styles.ecoTxt}>
                            Économise {save} %
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.prixLigne}>
                      <BigNumber value={`${money(x.prix)} CA`} size={26} style={styles.prix} />
                      <Text style={styles.per}>/ {x.per}</Text>
                    </View>
                    {x.trial ? <Text style={styles.plSous}>{x.trial} jours gratuits, puis facturation annuelle</Text> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Frise de l'essai */}
          {plan.trial ? (
            <View style={styles.tl}>
              <View style={styles.tlLigne} />
              <View style={styles.tlRang}>
                <View style={[styles.tlPoint, styles.tlPointOn]} />
                <Text style={styles.tlTxt}>Aujourd&apos;hui : début de l&apos;essai</Text>
              </View>
              <View style={styles.tlRang}>
                <View style={styles.tlPoint} />
                <Text style={styles.tlTxt}>
                  Dans {plan.trial} jours ({f(now + plan.trial * 864e5)}) : {money(plan.prix)} CA / {plan.per}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.foot}>
          <Button label={cta} onPress={() => (achatsReels() ? acheter(plan) : setAchat(plan))} />
          <Text style={styles.legal}>
            {plan.trial
              ? `Puis ${money(plan.prix)} CA/${plan.per}, renouvelé automatiquement. Annule au moins 24 h avant la fin de l'essai pour éviter les frais. Taxes en sus.`
              : `${money(plan.prix)} CA par mois, renouvelé automatiquement sauf annulation au moins 24 h avant la fin de la période. Taxes en sus.`}
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
function OffreSortie({ visible, prenom, onAccept, onRefus, onFin }: { visible: boolean; prenom: string; onAccept: () => void; onRefus: () => void; onFin: () => void }) {
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
        Soit 0,77 $ par semaine, avec toujours <Text style={styles.exBlanc}>3 jours gratuits</Text> pour essayer.
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
        Essai gratuit de 3 jours, puis 39,99 $ la première année, ensuite 59,99 $ par an, renouvelé automatiquement sauf annulation au moins 24 h avant la fin de la
        période. Offre proposée une seule fois.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingHorizontal: 20, paddingBottom: 12 },
  haut: { height: 48, paddingHorizontal: 12, justifyContent: 'center' },
  eyebrow: { fontSize: 15, lineHeight: 20, letterSpacing: 2.4, color: colors.pink, textAlign: 'center' },
  featTxt: { flex: 1, fontSize: 17, lineHeight: 22 },
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
  h1: { ...fonts.black, fontSize: 32, lineHeight: 38, letterSpacing: -0.5, textAlign: 'center', marginTop: 6 },
  sub: { color: colors.textSecondary, fontSize: 15, lineHeight: 20, marginTop: 6, textAlign: 'center' },
  feats: { gap: 16, paddingTop: 22, paddingHorizontal: 6 },
  feat: { flexDirection: 'row', alignItems: 'center', gap: 18 },
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
  rad: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.textSecondary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radOn: { borderColor: colors.pink },
  plNom: { fontSize: 18, lineHeight: 23 },
  tl: { marginTop: 22, paddingTop: 18, gap: 18, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 12 },
  tlLigne: { position: 'absolute', left: 18, top: 30, bottom: 8, width: 2, backgroundColor: colors.border2 },
  foot: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 8 },
  legal: { fontSize: 12.5, lineHeight: 17, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  lien: { fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  pwx: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
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
