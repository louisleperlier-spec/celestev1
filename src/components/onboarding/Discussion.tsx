import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Glow, Icon, Text } from '@/components/ui';
import { colors, fonts, ui } from '@/theme';

/**
 * Discussion de l'onboarding, portée du design 10K « Questionnaire » (moteur Moss, SwiftUI) : le coach écrit lettre à
 * lettre (18 ms par lettre, pauses sur la ponctuation), un toucher termine tout le message, les anciens messages
 * s'éloignent (opacité et taille selon la profondeur), les réponses arrivent en pastilles une à une.
 */

export type Message = {
  id: string;
  de: 'coach' | 'moi';
  texte: string;
  vu: number;
};

const LETTRE_MS = 18;
/** Respiration après chaque ligne, et silence entre une réponse et la ligne suivante. */
const SOUFFLE_MS = 165;
const APRES_REPONSE_MS = 140;

const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const delai = (c: string) => LETTRE_MS + (c === ',' ? 26 : c === '.' || c === '?' || c === '!' ? 58 : c === '\n' ? 115 : 0);

/** Machine à écrire : `dire` tape des lignes à la suite, `repondre` ajoute la bulle de l'utilisateur, `couper` revient en arrière. */
export function useDiscussion() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [ecrit, setEcrit] = useState(false);
  const liste = useRef<Message[]>([]);
  const jeton = useRef(0);
  const finir = useRef(false);
  const compteur = useRef(0);
  const reduit = useReducedMotion();

  const maj = useCallback((m: Message[]) => {
    liste.current = m;
    setMessages(m);
  }, []);

  /** Tape les lignes ; `instant` les affiche d'un coup (retour arrière). Renvoie false si une autre discussion a pris la main. */
  const dire = useCallback(
    async (lignes: string[], instant = false) => {
      const j = ++jeton.current;
      finir.current = false;
      if (instant || reduit) {
        maj([
          ...liste.current,
          ...lignes.map((texte) => ({
            id: `c${++compteur.current}`,
            de: 'coach' as const,
            texte,
            vu: texte.length,
          })),
        ]);
        setEcrit(false);
        return true;
      }
      setEcrit(true);
      if (liste.current.at(-1)?.de === 'moi') await pause(APRES_REPONSE_MS);
      for (const texte of lignes) {
        if (j !== jeton.current) return false;
        const id = `c${++compteur.current}`;
        if (finir.current) {
          maj([...liste.current, { id, de: 'coach', texte, vu: texte.length }]);
          continue;
        }
        maj([...liste.current, { id, de: 'coach', texte, vu: 0 }]);
        for (let k = 1; k <= texte.length; k++) {
          await pause(delai(texte[k - 1]));
          if (j !== jeton.current) return false;
          if (finir.current) break;
          maj(liste.current.map((x) => (x.id === id ? { ...x, vu: k } : x)));
        }
        maj(liste.current.map((x) => (x.id === id ? { ...x, vu: texte.length } : x)));
        if (!finir.current) await pause(SOUFFLE_MS);
      }
      if (j !== jeton.current) return false;
      setEcrit(false);
      return true;
    },
    [maj, reduit],
  );

  const repondre = useCallback((texte: string) => maj([...liste.current, { id: `m${++compteur.current}`, de: 'moi', texte, vu: texte.length }]), [maj]);

  /** Termine d'un coup les lignes en cours (toucher pendant l'écriture). */
  const completer = useCallback(() => {
    finir.current = true;
  }, []);

  /** Revient à `n` messages et arrête l'écriture. */
  const couper = useCallback(
    (n: number) => {
      jeton.current++;
      setEcrit(false);
      maj(liste.current.slice(0, n));
    },
    [maj],
  );

  // Arrête l'écriture si l'écran disparaît.
  useEffect(
    () => () => {
      jeton.current++;
    },
    [],
  );

  return {
    messages,
    ecrit,
    dire,
    repondre,
    completer,
    couper,
    taille: () => liste.current.length,
  };
}

/** Texte qui s'écrit lettre à lettre (bulle du coach à l'écran de choix) ; recommence quand le texte change. */
export function TexteTape({ texte, style }: { texte: string; style: StyleProp<TextStyle> }) {
  const reduit = useReducedMotion();
  // Lettres déjà écrites, pour quel texte (un autre texte repart de zéro sans effet de bord).
  const [etat, setEtat] = useState({ texte, vu: 0 });
  useEffect(() => {
    if (reduit) return;
    let k = 0;
    let t: ReturnType<typeof setTimeout>;
    const suite = () => {
      k++;
      setEtat({ texte, vu: k });
      if (k < texte.length) t = setTimeout(suite, delai(texte[k - 1]));
    };
    t = setTimeout(suite, 250);
    return () => clearTimeout(t);
  }, [texte, reduit]);
  const vu = reduit ? texte.length : etat.texte === texte ? etat.vu : 0;
  return (
    <Text style={style} accessibilityLabel={texte}>
      {texte.slice(0, vu)}
      <Text style={[style, styles.cache]}>{texte.slice(vu)}</Text>
    </Text>
  );
}

/** Nombre de messages gardés à l'écran. */
export const FENETRE = 5;
const opacite = (p: number) => (p <= 0 ? 1 : Math.max(0, 1 - p * 0.32));
const echelle = (p: number) => (p <= 0 ? 1 : Math.max(0.82, 1 - p * 0.04));

/** Un message du fil, plus ou moins éloigné selon sa profondeur (0 = le plus récent). */
export function Bulle({ m, profondeur }: { m: Message; profondeur: number }) {
  const o = useSharedValue(opacite(profondeur));
  const s = useSharedValue(echelle(profondeur));
  useEffect(() => {
    o.value = withTiming(opacite(profondeur), { duration: 220 });
    s.value = withTiming(echelle(profondeur), { duration: 220 });
  }, [profondeur, o, s]);
  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ scale: s.value }],
  }));
  const moi = m.de === 'moi';
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      style={[style, moi ? styles.ligneMoi : styles.ligneCoach, { transformOrigin: moi ? 'right top' : 'left top' }]}
    >
      {moi ? (
        <View style={styles.bulleMoi}>
          <Text weight="medium" style={styles.texteMoi}>
            {m.texte}
          </Text>
        </View>
      ) : (
        // Le texte entier est posé dès le départ (lettres à venir transparentes) : rien ne bouge pendant l'écriture.
        <Text style={styles.texteCoach} accessibilityLabel={m.texte}>
          {m.texte.slice(0, m.vu)}
          <Text style={[styles.texteCoach, styles.cache]}>{m.texte.slice(m.vu)}</Text>
        </Text>
      )}
    </Animated.View>
  );
}

/** Réponse en pastille (MossChip) ; `sous` = précision en gris, `on` = choix déjà fait (coche). */
export function Pastille({ label, sous, on = false, index, onPress }: { label: string; sous?: string; on?: boolean; index: number; onPress: () => void }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(240)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        onPress={onPress}
        style={({ pressed }) => [styles.pastille, on && styles.pastilleOn, pressed && styles.presse]}
      >
        <Text weight="medium" style={styles.pastilleTxt}>
          {label}
          {sous ? <Text style={[styles.pastilleTxt, styles.pastilleSous]}>{`  ${sous}`}</Text> : null}
        </Text>
        {on && <Icon name="check" size={16} color={colors.pink} />}
      </Pressable>
    </Animated.View>
  );
}

/** Lumière orange qui respire en bas de l'écran (MossBreathingArc), immobile si « Réduire les animations ». */
export function ArcRespire() {
  const { width, height } = useWindowDimensions();
  const reduit = useReducedMotion();
  const souffle = useSharedValue(0.5);
  useEffect(() => {
    if (reduit) return;
    souffle.value = 0;
    souffle.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduit, souffle]);
  const h = height * 0.62;
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 + 0.3 * souffle.value,
    transform: [{ translateY: h * (0.5 - 0.04 * souffle.value) }, { scale: 1 + 0.06 * souffle.value }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.arc, { width, height: h }, style]}>
      <Glow width={width * 1.5} height={h} color={colors.pink} intensity={0.42} />
    </Animated.View>
  );
}

/** Carte « Construit autour de toi » à la fin de la discussion. */
export function CarteResume({ sections, children }: { sections: { titre: string; valeurs: string[] }[]; children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.duration(320)} style={styles.carte}>
      <View style={styles.statut}>
        <View style={styles.point} />
        <Text weight="bold" style={styles.statutTxt}>
          Profil prêt
        </Text>
      </View>
      <Text style={styles.carteTitre}>Construit autour de toi</Text>
      <Text style={styles.carteSous}>Tout ce que tu m&apos;as dit est pris en compte.</Text>
      {sections.map((s) => (
        <View key={s.titre} style={styles.section}>
          <Text weight="semibold" style={styles.sectionTitre}>
            {s.titre}
          </Text>
          <View style={styles.puces}>
            {s.valeurs.map((v) => (
              <View key={v} style={styles.puce}>
                <Text weight="medium" style={styles.puceTxt}>
                  {v}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <View style={styles.carteBas}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ligneCoach: { alignSelf: 'stretch', paddingRight: 32 },
  ligneMoi: { alignSelf: 'flex-end', maxWidth: '80%' },
  texteCoach: { fontSize: 22, lineHeight: 29, color: colors.text },
  cache: { color: 'transparent' },
  bulleMoi: {
    minHeight: 35,
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 17.5,
    backgroundColor: ui.dark,
  },
  texteMoi: { fontSize: 15, lineHeight: 20, color: colors.text },
  pastille: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    maxWidth: 320,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border2,
  },
  pastilleOn: { borderColor: colors.pink },
  presse: { transform: [{ scale: 0.97 }] },
  pastilleTxt: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  pastilleSous: { color: colors.textSecondary },
  arc: { position: 'absolute', left: 0, bottom: 0 },
  carte: {
    padding: 20,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  statut: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(62,224,122,0.12)',
    marginBottom: 8,
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  statutTxt: { fontSize: 12, lineHeight: 16, color: colors.green },
  carteTitre: { ...fonts.bold, fontSize: 23, lineHeight: 29 },
  carteSous: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  section: { gap: 6, marginTop: 8 },
  sectionTitre: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  puces: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  puce: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  puceTxt: { fontSize: 13, lineHeight: 17 },
  carteBas: { marginTop: 14 },
});
