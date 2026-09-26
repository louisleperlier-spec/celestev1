import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from "react-native-svg";

import { Sheet } from "@/components/app/Sheet";
import {
  BigNumber,
  Button,
  Card,
  Glow,
  Icon,
  RadialBackground,
  Text,
  toast,
  type IconName,
} from "@/components/ui";
import { COACH_IMAGES } from "@/data";
import { PLANS } from "@/data/monetisation";
import { SEANCES } from "@/data/seances";
import { mmss } from "@/lib/coeur";
import { coachById, prog } from "@/lib/plan";
import { isPremium, money, type OffreId } from "@/lib/premium";
import { useCompte } from "@/store/compte";
import { useProfil } from "@/store/profil";
import { alpha, colors, fonts, gradients, ui } from "@/theme";

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
  id: "an39",
  nom: "Annuel (offre 1re année)",
  prix: 39.99,
  per: "an",
  trial: 3,
  after: 59.99,
};

/** Paywall NÉA Plus (vPaywall du prototype). `?suite=compte` : fin de l'onboarding, la création de compte suit. */
export default function Plus() {
  const { suite } = useLocalSearchParams<{ suite?: string }>();
  const p = useProfil();
  const c = coachById(p.coach);
  const pr = prog(p);
  const [sel, setSel] = useState<OffreId>("an");
  const [achat, setAchat] = useState<Offre | null>(null);
  const [sortie, setSortie] = useState(false);
  const [croix, setCroix] = useState(false);
  const [now] = useState(Date.now);
  const plan = PLANS.find((x) => x.id === sel) ?? PLANS[0];
  const mo = PLANS[1].prix * 12;
  const save = Math.round((1 - PLANS[0].prix / mo) * 100);
  const f = (d: number) =>
    new Date(d).toLocaleDateString("fr-CA", { day: "numeric", month: "long" });

  // La croix n'apparaît qu'après 2 secondes.
  useEffect(() => {
    const t = setTimeout(() => setCroix(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const partir = () => {
    if (suite === "compte")
      router.replace({ pathname: "/compte", params: { onb: "1" } });
    else if (router.canGoBack()) router.back();
    else router.replace("/accueil");
  };

  /** Fermer : l'offre de sortie une seule fois, 10 minutes (data-pwclose). */
  const fermer = () => {
    const st = useProfil.getState();
    if (
      !isPremium() &&
      (!st.exitUntil || st.exitUntil > Date.now()) &&
      !st.exitDeclined
    ) {
      if (!st.exitUntil) st.set({ exitUntil: Date.now() + 10 * 60000 });
      setSortie(true);
      return;
    }
    partir();
  };

  const acheter = (o: Offre) => {
    useProfil.getState().acheterPlus(o.id);
    setAchat(null);
    toast(
      o.trial ? "Essai activé : 3 jours offerts" : "Bienvenue dans NÉA Plus",
    );
    setTimeout(partir, 900);
  };

  const restaurer = () => {
    if (isPremium()) {
      toast("Achat restauré");
      partir();
    } else
      toast(
        useCompte.getState().userId
          ? "Aucun achat trouvé pour ce compte"
          : "Connecte-toi pour restaurer tes achats",
      );
  };

  const feats: [IconName, string, string][] = [
    [
      "clip",
      "Tous les programmes des 6 coachs",
      "18 programmes complets et " + SEANCES.length + " séances prêtes",
    ],
    [
      "coach",
      `${c.nom} en illimité`,
      "Ton coach IA répond à toutes tes questions",
    ],
    [
      "wave",
      "Récupération avancée",
      "VFC post-séance, score de nuit, alertes de fatigue",
    ],
    ["bolt", "Turbo XP et boosts d'équipe", "Monte plus vite dans la Ligue"],
    [
      "bike",
      "Vélo : zones cardio et historique complet",
      "Chaque sortie analysée",
    ],
  ];
  const cta = plan.trial
    ? `Commencer mes ${plan.trial} jours gratuits`
    : plan.id === "vie"
      ? `Débloquer à vie : ${money(plan.prix)}`
      : `S'abonner : ${money(plan.prix)}/${plan.per}`;

  return (
    <View style={styles.root}>
      <RadialBackground
        layers={[{ rx: 90, ry: 40, cx: 50, cy: 0, color: alpha(c.c, 0.3) }]}
      />
      <SafeAreaView
        style={styles.flex}
        edges={["top", "left", "right", "bottom"]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Heros coachId={c.id} couleur={c.c} />
          <View style={styles.center}>
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.plus}
            >
              <Text weight="extrabold" style={styles.plusTxt}>
                NÉA PLUS
              </Text>
            </LinearGradient>
            <Text style={styles.h1}>
              {p.name ? p.name + ", ton" : "Ton"} programme{" "}
              <Text style={[styles.h1, { color: colors.pink }]}>{pr.nom}</Text>{" "}
              est prêt
            </Text>
            <Text style={styles.sub}>
              Débloque tout NÉA pour aller jusqu&apos;au bout avec {c.nom}.
            </Text>
          </View>

          {/* .proj : progression prévue */}
          <Card style={styles.proj}>
            <View style={styles.projh}>
              <Text style={styles.projSmall}>Ta progression prévue</Text>
              <Text weight="bold" style={styles.projB}>
                {pr.sem} semaines
              </Text>
            </View>
            <Svg
              width="100%"
              height={90}
              viewBox="0 0 300 90"
              preserveAspectRatio="none"
              style={styles.projSvg}
            >
              <Defs>
                <SvgGradient id="pj" x1="0" x2="1" y1="0" y2="0">
                  <Stop offset="0" stopColor={colors.pinkLight} />
                  <Stop offset="1" stopColor={colors.pink} />
                </SvgGradient>
                <SvgGradient id="pja" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={colors.pink} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={colors.pink} stopOpacity={0} />
                </SvgGradient>
              </Defs>
              <Path
                d="M10 78 C 80 74, 120 60, 170 42 S 260 14, 290 10 L290 88 L10 88Z"
                fill="url(#pja)"
              />
              <Path
                d="M10 78 C 80 74, 120 60, 170 42 S 260 14, 290 10"
                fill="none"
                stroke="url(#pj)"
                strokeWidth={3.5}
                strokeLinecap="round"
              />
              <Circle cx={10} cy={78} r={5} fill={colors.text} />
              <Circle
                cx={290}
                cy={10}
                r={7}
                fill={colors.pink}
                stroke={colors.text}
                strokeWidth={2}
              />
            </Svg>
            <View style={styles.projl}>
              <Text style={styles.projLbl}>Aujourd&apos;hui</Text>
              <Text style={styles.projLbl}>
                Semaine {Math.ceil(pr.sem / 2)}
              </Text>
              <Text style={styles.projLbl}>Objectif</Text>
            </View>
          </Card>

          {/* .feats */}
          <View style={styles.feats}>
            {feats.map(([ic, t, s]) => (
              <View key={t} style={styles.feat}>
                <View style={styles.featIco}>
                  <Icon name={ic} size={19} color={colors.pink} />
                </View>
                <View style={styles.flex}>
                  <Text weight="bold" style={styles.b14}>
                    {t}
                  </Text>
                  <Text style={styles.small12}>{s}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* .plans2 */}
          <View style={styles.plans}>
            {PLANS.map((x) => {
              const on = x.id === sel;
              return (
                <Pressable
                  key={x.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => setSel(x.id as OffreId)}
                >
                  <View style={[styles.pl, on && styles.plOn]}>
                    {on && (
                      <LinearGradient
                        colors={[ui.selTop, ui.selBottom]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <View style={[styles.rad, on && styles.radOn]} />
                    <View style={styles.flex}>
                      <Text weight="bold" style={styles.plNom}>
                        {x.nom}
                      </Text>
                      <Text style={styles.small12}>
                        {x.trial
                          ? `${x.trial} jours gratuits, puis ${money(x.prix)}/an`
                          : x.id === "vie"
                            ? "Payé une fois, à toi pour toujours"
                            : `${money(x.prix)} par mois`}
                      </Text>
                    </View>
                    <View style={styles.plp}>
                      <Text weight="bold" style={styles.plPrix}>
                        {x.id === "an"
                          ? money(x.prix / 52)
                          : x.id === "mois"
                            ? money(x.prix / 4.33)
                            : money(x.prix)}
                      </Text>
                      {x.id !== "vie" && (
                        <Text style={styles.plSem}>/semaine</Text>
                      )}
                      {x.id === "an" && (
                        <Text weight="bold" style={styles.plEco}>
                          −{save} %
                        </Text>
                      )}
                    </View>
                  </View>
                  {x.badge && (
                    <View style={styles.plb}>
                      <Text weight="extrabold" style={styles.plbTxt}>
                        {x.badge}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* .tl : frise de l'essai */}
          {plan.trial ? (
            <View style={styles.tl}>
              <LinearGradient
                colors={[colors.pink, colors.border2]}
                style={styles.tlLigne}
              />
              <Etape
                icon="bolt"
                on
                titre="Aujourd'hui"
                sous="Accès complet à NÉA Plus, gratuitement"
              />
              <Etape
                icon="bell"
                titre={f(now + 2 * 864e5)}
                sous="On te rappelle que ton essai se termine demain"
              />
              <Etape
                icon="star"
                titre={f(now + 3 * 864e5)}
                sous="Début de l'abonnement, annule avant si tu veux"
              />
            </View>
          ) : null}
          <View style={styles.bas} />
        </ScrollView>

        {/* .pwfoot */}
        <View style={styles.foot}>
          <LinearGradient
            colors={["transparent", colors.bg]}
            locations={[0, 0.22]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Button
            label={cta}
            onPress={() => setAchat(plan)}
            style={styles.cta}
          />
          <Text style={styles.mini}>
            {plan.trial
              ? "✓ Aucun paiement aujourd'hui  ✓ Annule quand tu veux"
              : plan.id === "vie"
                ? "✓ Un seul paiement  ✓ Toutes les futures mises à jour"
                : "✓ Sans engagement  ✓ Annule quand tu veux"}
          </Text>
          <Text style={styles.legal}>
            {plan.trial
              ? `Essai gratuit de ${plan.trial} jours, puis ${money(plan.prix)} par an, renouvelé automatiquement sauf annulation au moins 24 h avant la fin de la période en cours.`
              : plan.id === "mois"
                ? `${money(plan.prix)} par mois, renouvelé automatiquement sauf annulation au moins 24 h avant la fin de la période.`
                : "Achat unique non récurrent."}{" "}
            Prix en dollars canadiens, taxes en sus.{" "}
            <Text style={styles.lien} onPress={restaurer}>
              Restaurer
            </Text>
            {" • "}
            <Text
              style={styles.lien}
              onPress={() => router.push("/legal/conditions")}
            >
              Conditions
            </Text>
            {" • "}
            <Text
              style={styles.lien}
              onPress={() => router.push("/legal/confidentialite")}
            >
              Confidentialité
            </Text>
          </Text>
        </View>

        {/* .pwx : visible après 2 s */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={fermer}
          disabled={!croix}
          style={[styles.pwx, { opacity: croix ? 0.8 : 0 }]}
        >
          <Icon name="x" size={16} />
        </Pressable>
      </SafeAreaView>

      <AchatSheet
        offre={achat}
        onClose={() => setAchat(null)}
        onConfirm={acheter}
      />
      {/* Montée à l'ouverture seulement : le compte à rebours part de l'heure réelle. */}
      {sortie && (
        <OffreSortie
          visible
          prenom={p.name}
          onAccept={() => {
            setSortie(false);
            setAchat(OFFRE_SORTIE);
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

/** Coach qui flotte sur son halo (.pwhero). */
function Heros({
  coachId,
  couleur,
}: {
  coachId: Parameters<typeof coachById>[0];
  couleur: string;
}) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withTiming(-8, { duration: 1750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [y]);
  const flotte = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  return (
    <View style={styles.hero}>
      <View style={styles.heroGlow}>
        <Glow width={260} height={80} color={couleur} intensity={0.5} />
      </View>
      <Animated.View style={flotte}>
        <Image
          source={COACH_IMAGES[coachId].corps}
          style={styles.heroImg}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

function Etape({
  icon,
  titre,
  sous,
  on = false,
}: {
  icon: IconName;
  titre: string;
  sous: string;
  on?: boolean;
}) {
  return (
    <View style={styles.etape}>
      <View style={[styles.tld, on && styles.tldOn]}>
        <Icon name={icon} size={17} color={on ? colors.onPrimary : ui.text3} />
      </View>
      <View style={styles.flex}>
        <Text weight="bold" style={styles.b14}>
          {titre}
        </Text>
        <Text style={styles.small12}>{sous}</Text>
      </View>
    </View>
  );
}

/** Confirmation d'achat (buySheet). Simulé tant que les achats App Store (RevenueCat) ne sont pas branchés. */
function AchatSheet({
  offre: o,
  onClose,
  onConfirm,
}: {
  offre: Offre | null;
  onClose: () => void;
  onConfirm: (o: Offre) => void;
}) {
  return (
    <Sheet visible={!!o} onClose={onClose}>
      {o && (
        <>
          <View style={styles.buyh}>
            <Text weight="bold" style={styles.buyTitre}>
              Confirmer
            </Text>
            <Text weight="bold" style={styles.buySimule}>
              ACHAT SIMULÉ : AUCUN PAIEMENT RÉEL
            </Text>
          </View>
          <View style={styles.buyr}>
            <Text style={styles.b14}>NÉA Plus {o.nom}</Text>
            <Text weight="bold" style={styles.b14}>
              {o.trial ? "Gratuit " + o.trial + " jours" : money(o.prix)}
            </Text>
          </View>
          {o.trial ? (
            <View style={styles.buyr}>
              <Text style={styles.b14}>Ensuite</Text>
              <Text weight="bold" style={styles.b14}>
                {money(o.prix)} la 1re année
                {o.after ? ", puis " + money(o.after) + "/an" : ""}
              </Text>
            </View>
          ) : null}
          <Text style={styles.buyNote}>
            Dans l&apos;app publiée, cette fenêtre sera celle de l&apos;App
            Store ou de Google Play.
          </Text>
          <Button
            label={o.trial ? "Commencer l'essai" : "Payer " + money(o.prix)}
            onPress={() => onConfirm(o)}
          />
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
        <LinearGradient
          colors={gradients.gold}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.plus, styles.plusExh]}
        >
          <Text weight="extrabold" style={styles.plusTxt}>
            OFFRE UNIQUE
          </Text>
        </LinearGradient>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onRefus}
          style={styles.exx}
        >
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
        Soit 0,77 $ par semaine, avec toujours{" "}
        <Text style={styles.exBlanc}>3 jours gratuits</Text> pour essayer.
      </Text>
      <View style={styles.exclock}>
        <Icon name="clock" size={16} color={ui.plusLien} />
        <Text style={styles.exClockTxt}>Offre valable encore </Text>
        <Text
          weight="bold"
          style={[
            styles.exClockTxt,
            { color: ui.plusLien, fontVariant: ["tabular-nums"] },
          ]}
        >
          {mmss(reste)}
        </Text>
      </View>
      <Button label="Profiter de l'offre" onPress={onAccept} />
      <Pressable accessibilityRole="button" onPress={onRefus}>
        <Text style={styles.skip}>Non merci, continuer en gratuit</Text>
      </Pressable>
      <Text style={styles.legal}>
        Essai gratuit de 3 jours, puis 39,99 $ la première année, ensuite 59,99
        $ par an, renouvelé automatiquement sauf annulation au moins 24 h avant
        la fin de la période. Offre proposée une seule fois.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  scroll: { paddingBottom: 12 },
  hero: { height: 210, alignItems: "center", justifyContent: "flex-end" },
  heroGlow: { position: "absolute", bottom: -20, width: 260, height: 80 },
  heroImg: { width: 200, height: 200 },
  center: { alignItems: "center", paddingHorizontal: 20 },
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
  h1: {
    fontFamily: fonts.black,
    fontSize: 27,
    lineHeight: 30,
    letterSpacing: -0.27,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 10,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 19.6,
    marginTop: 6,
    textAlign: "center",
  },
  proj: { marginTop: 16, marginHorizontal: 20, padding: 14, gap: 0 },
  projh: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  projSmall: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  projB: { fontSize: 14, lineHeight: 18, color: colors.pinkLight },
  projSvg: { marginTop: 6 },
  projl: { flexDirection: "row", justifyContent: "space-between" },
  projLbl: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  feats: { gap: 12, paddingTop: 18, paddingHorizontal: 24 },
  feat: { flexDirection: "row", alignItems: "center", gap: 12 },
  featIco: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(255,79,163,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  b14: { fontSize: 14, lineHeight: 18 },
  small12: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    marginTop: 2,
  },
  plans: { gap: 10, paddingTop: 20, paddingHorizontal: 20 },
  pl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  plOn: {
    borderColor: colors.pink,
    borderWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 13,
    boxShadow: "0 0 20px rgba(255,79,163,0.25)",
  },
  rad: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border2,
  },
  radOn: { borderWidth: 7, borderColor: colors.pink },
  plNom: { fontSize: 15.5, lineHeight: 20 },
  plp: { alignItems: "flex-end" },
  plPrix: { fontSize: 15, lineHeight: 19 },
  plSem: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  plEco: { fontSize: 11, lineHeight: 14, color: colors.green, marginTop: 2 },
  plb: {
    position: "absolute",
    top: -10,
    right: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.pink,
  },
  plbTxt: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.6,
    color: colors.onPrimary,
  },
  tl: { marginTop: 18, marginHorizontal: 24, gap: 14 },
  tlLigne: { position: "absolute", left: 17, top: 18, bottom: 18, width: 2 },
  etape: { flexDirection: "row", alignItems: "center", gap: 12 },
  tld: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ui.iconBg,
    borderWidth: 1,
    borderColor: colors.border2,
    alignItems: "center",
    justifyContent: "center",
  },
  tldOn: {
    backgroundColor: colors.pink,
    borderWidth: 0,
    boxShadow: `0 0 12px ${colors.pink}`,
  },
  bas: { height: 170 },
  foot: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 26,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  cta: { height: 56 },
  mini: {
    textAlign: "center",
    fontSize: 12.5,
    lineHeight: 17,
    color: ui.text3,
    marginTop: 8,
  },
  legal: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textTertiary,
    textAlign: "center",
    marginTop: 6,
  },
  lien: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
  pwx: {
    position: "absolute",
    top: 10,
    left: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(40,40,46,0.7)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  buyh: { alignItems: "center", marginBottom: 14 },
  buyTitre: { fontSize: 17, lineHeight: 22 },
  buySimule: {
    fontSize: 11,
    lineHeight: 15,
    color: gradients.gold[1],
    letterSpacing: 0.44,
  },
  buyr: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exx: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ui.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  exti: {
    fontSize: 21,
    lineHeight: 25,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  exprice: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 10,
  },
  exBarre: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textSecondary,
    textDecorationLine: "line-through",
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
    textAlign: "center",
    marginTop: 6,
  },
  exBlanc: { fontFamily: fonts.bold, color: colors.text },
  exclock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginVertical: 14,
  },
  exClockTxt: { fontSize: 13.5, lineHeight: 18, color: ui.text3 },
  skip: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 13.5,
    lineHeight: 18,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
});
