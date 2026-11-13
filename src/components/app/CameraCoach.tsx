import { requireNativeView, requireOptionalNativeModule } from 'expo';
import { useKeepAwake } from 'expo-keep-awake';
import { useRef, useState, type ComponentType } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, View, type NativeSyntheticEvent, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BigNumber, Icon, Text } from '@/components/ui';
import type { ExerciceId } from '@/data/types';
import { mmss } from '@/lib/coeur';
import { profilDe, suiviInitial, suivre, type Articulation, type Pose, type Suivi } from '@/lib/mouvement';
import { exercice } from '@/lib/plan';
import { alpha, colors, ui } from '@/theme';

type EvPose = {
  j: Record<string, [number, number, number]>;
  w: number;
  h: number;
  t: number;
};
type PropsVue = ViewProps & {
  actif: boolean;
  avant: boolean;
  alerte: string[];
  onPose: (e: NativeSyntheticEvent<EvPose>) => void;
  onEtat: (e: NativeSyntheticEvent<{ etat: 'pret' | 'refuse' | 'indisponible' }>) => void;
};

type Voix = typeof import('expo-speech');
/** Voix du coach : `expo-speech` n'existe qu'à partir du build 35 ; l'importer sans le module natif ferait planter l'app. */
const Speech: Pick<Voix, 'speak' | 'stop'> = (() => {
  const muette = { speak: () => {}, stop: async () => {} };
  if (!requireOptionalNativeModule('ExpoSpeech')) return muette;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech') as Voix;
  } catch {
    return muette;
  }
})();

const moduleCamera = requireOptionalNativeModule<{ disponible(): boolean }>('NeaCamera');
/** Vue native chargée seulement si le module existe (sinon `requireNativeView` lèverait une erreur). */
const VueCamera: ComponentType<PropsVue> | null = Platform.OS === 'ios' && moduleCamera ? requireNativeView<PropsVue>('NeaCamera') : null;

/** Caméra + squelette disponibles (build 35+, iPhone) ; absents dans Expo Go, le navigateur et Android. */
export function cameraDisponible(): boolean {
  try {
    return !!VueCamera && !!moduleCamera?.disponible();
  } catch {
    return false;
  }
}

/**
 * Coach caméra (demandé par l'utilisateur, nov. 2026) : caméra en direct avec l'exosquelette dessiné par l'iPhone (`NeaCamera`,
 * Apple Vision), comptage des reps et corrections (`lib/mouvement.ts`), dites à voix haute (`expo-speech`, coupable).
 * Rien n'est filmé ni envoyé. `cible` : reps prévues ; `onValider` (séance en cours) reçoit les reps comptées.
 */
export function CameraCoach({
  exo,
  cible,
  onValider,
  onClose,
}: {
  exo: ExerciceId | null;
  cible?: number;
  onValider?: (reps: number) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={!!exo} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
      {exo && <Contenu exo={exo} cible={cible} onValider={onValider} onClose={onClose} />}
    </Modal>
  );
}

function Contenu({ exo, cible, onValider, onClose }: { exo: ExerciceId; cible?: number; onValider?: (reps: number) => void; onClose: () => void }) {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const e = exercice(exo);
  const prof = profilDe(exo);
  const [avant, setAvant] = useState(true);
  const [voix, setVoix] = useState(true);
  const [etat, setEtat] = useState<'attente' | 'pret' | 'refuse' | 'indisponible'>('attente');
  const [s, setS] = useState<Suivi>(() => suiviInitial(prof));
  const dernierConseil = useRef(0);
  const actuel = useRef<Suivi>(s);

  const parler = (texte: string, prioritaire: boolean) => {
    if (!voix) return;
    if (prioritaire) Speech.stop();
    Speech.speak(texte, { language: 'fr-FR', rate: 1.05 });
  };

  const surPose = (ev: NativeSyntheticEvent<EvPose>) => {
    const { j, w, h, t } = ev.nativeEvent;
    const pose: Pose = {};
    for (const [k, [x, y, c]] of Object.entries(j)) pose[k as Articulation] = { x: x * w, y: y * h, c };
    const n = suivre(actuel.current, prof, pose, t);
    actuel.current = n;
    setS(n);
    if (n.evenement === 'rep') parler(n.ton === 'ok' || !n.joints.length ? String(n.reps) : `${n.reps}. ${n.message}`, true);
    else if ((n.evenement === 'forme' || n.evenement === 'partielle') && t - dernierConseil.current > 3500) {
      dernierConseil.current = t;
      parler(n.message, false);
    }
  };

  const fermer = () => {
    Speech.stop();
    onClose();
  };
  const recommencer = () => {
    Speech.stop();
    actuel.current = suiviInitial(prof);
    setS(actuel.current);
  };

  const couleurMsg = s.ton === 'ok' ? colors.pink : s.ton === 'alerte' ? ui.warnText : colors.text;

  return (
    <View style={styles.root}>
      {VueCamera && (
        <VueCamera style={StyleSheet.absoluteFill} actif avant={avant} alerte={s.joints} onPose={surPose} onEtat={(ev) => setEtat(ev.nativeEvent.etat)} />
      )}
      <View pointerEvents="none" style={[styles.voileHaut, { height: insets.top + 150 }]} />
      <View pointerEvents="none" style={[styles.voileBas, { height: 300 + insets.bottom }]} />

      {/* Barre du haut : fermer, exercice, caméra avant / arrière, voix. */}
      <View style={[styles.haut, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer la caméra" onPress={fermer} hitSlop={6} style={styles.rond}>
          <Icon name="x" size={17} />
        </Pressable>
        <View style={styles.flex}>
          <Text weight="bold" style={styles.titre} numberOfLines={1}>
            {e.nom}
          </Text>
          <Text style={styles.sous} numberOfLines={1}>
            Caméra en direct · rien n’est enregistré
          </Text>
        </View>
        <Pressable
          accessibilityRole="switch"
          accessibilityLabel="Voix du coach"
          accessibilityState={{ checked: voix }}
          onPress={() => {
            if (voix) Speech.stop();
            setVoix(!voix);
          }}
          style={[styles.rond, voix && styles.rondOn]}
        >
          <Icon name="bulle" size={17} color={voix ? colors.bg : colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={avant ? 'Passer à la caméra arrière' : 'Passer à la caméra avant'}
          onPress={() => setAvant(!avant)}
          style={styles.rond}
        >
          <Icon name="refresh" size={17} />
        </Pressable>
      </View>

      {/* Compteur. */}
      {prof && (
        <View style={[styles.compteur, { top: insets.top + 64 }]} accessibilityLiveRegion="polite">
          {prof.tenue ? (
            <>
              <BigNumber value={mmss(Math.floor(s.tenueOk))} size={44} />
              <Text style={styles.compteurSous}>bien aligné</Text>
            </>
          ) : (
            <>
              <BigNumber value={s.reps} unit={cible ? `/ ${cible}` : undefined} size={64} unitSize={20} />
              <Text style={styles.compteurSous}>
                {s.propres} propre{s.propres > 1 ? 's' : ''}
                {s.partielles ? ` · ${s.partielles} incomplète${s.partielles > 1 ? 's' : ''}` : ''}
              </Text>
            </>
          )}
        </View>
      )}

      {/* Autorisation refusée ou caméra absente. */}
      {(etat === 'refuse' || etat === 'indisponible') && (
        <View style={styles.centre}>
          <View style={styles.carteEtat}>
            <Icon name="info" size={26} color={colors.text} />
            <Text weight="bold" style={styles.etatTitre}>
              {etat === 'refuse' ? 'La caméra est bloquée' : 'Caméra indisponible'}
            </Text>
            <Text style={styles.etatTexte}>
              {etat === 'refuse'
                ? 'Autorise la caméra pour NÉA dans les Réglages de l’iPhone : tout reste sur ton téléphone.'
                : 'Aucune caméra n’est disponible sur cet appareil.'}
            </Text>
            {etat === 'refuse' && (
              <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} style={styles.boutonBlanc}>
                <Text weight="bold" style={styles.boutonBlancTxt}>
                  Ouvrir les Réglages
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Bas : amplitude, message du coach, commandes. */}
      <View style={[styles.bas, { paddingBottom: insets.bottom + 14 }]}>
        {prof && !prof.tenue && (
          <View style={styles.jauge} accessibilityLabel={`Amplitude ${Math.round(s.amplitude * 100)} %`}>
            <View style={[styles.jaugeIn, { width: `${Math.round(s.amplitude * 100)}%` }, s.amplitude >= 1 && styles.jaugeOk]} />
          </View>
        )}
        <View style={[styles.message, s.ton === 'alerte' && styles.messageAlerte]} accessibilityLiveRegion="polite">
          <View
            style={[
              styles.point,
              {
                backgroundColor: s.ton === 'alerte' ? ui.warnBorder : s.ton === 'ok' ? colors.pink : alpha(colors.text, 0.5),
              },
            ]}
          />
          <Text weight="semibold" style={[styles.messageTxt, { color: couleurMsg }]}>
            {etat === 'attente' ? 'J’allume la caméra…' : s.message}
          </Text>
        </View>
        <View style={styles.commandes}>
          <Pressable accessibilityRole="button" onPress={recommencer} style={({ pressed }) => [styles.secondaire, pressed && styles.presse]}>
            <Icon name="refresh" size={17} />
            <Text weight="semibold" style={styles.secondaireTxt}>
              Recommencer
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Speech.stop();
              if (onValider && prof && !prof.tenue && s.reps > 0) onValider(s.reps);
              onClose();
            }}
            style={({ pressed }) => [styles.principal, pressed && styles.presse]}
          >
            <Icon name="check" size={18} color={colors.bg} />
            <Text weight="bold" style={styles.principalTxt}>
              {onValider && prof && !prof.tenue && s.reps > 0 ? `Valider ${s.reps} rep${s.reps > 1 ? 's' : ''}` : 'Terminer'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  flex: { flex: 1 },
  voileHaut: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: alpha(colors.bg, 0.45),
  },
  voileBas: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: alpha(colors.bg, 0.55),
  },
  haut: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  rond: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: alpha(colors.bg, 0.6),
    borderWidth: 0.5,
    borderColor: colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rondOn: { backgroundColor: colors.text },
  titre: { fontSize: 16, lineHeight: 21, color: colors.text },
  sous: { fontSize: 12, lineHeight: 16, color: ui.text3 },
  compteur: { position: 'absolute', right: 18, alignItems: 'flex-end' },
  compteurSous: {
    fontSize: 13,
    lineHeight: 17,
    color: ui.text3,
    marginTop: -2,
  },
  centre: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  carteEtat: {
    alignItems: 'center',
    gap: 10,
    padding: 22,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  etatTitre: {
    fontSize: 18,
    lineHeight: 23,
    color: colors.text,
    textAlign: 'center',
  },
  etatTexte: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  boutonBlanc: {
    marginTop: 6,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boutonBlancTxt: { fontSize: 15, lineHeight: 20, color: colors.bg },
  bas: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    gap: 12,
  },
  jauge: {
    height: 8,
    borderRadius: 4,
    backgroundColor: alpha(colors.text, 0.18),
    overflow: 'hidden',
  },
  jaugeIn: { height: '100%', borderRadius: 4, backgroundColor: colors.text },
  jaugeOk: { backgroundColor: colors.pink },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: alpha(colors.surface, 0.92),
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  messageAlerte: {
    backgroundColor: alpha(ui.warnBg, 0.95),
    borderColor: ui.warnBorder,
  },
  point: { width: 10, height: 10, borderRadius: 5 },
  messageTxt: { flex: 1, fontSize: 17, lineHeight: 23 },
  commandes: { flexDirection: 'row', gap: 10 },
  secondaire: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    paddingHorizontal: 18,
    borderRadius: 27,
    backgroundColor: alpha(colors.text, 0.12),
  },
  secondaireTxt: { fontSize: 15, lineHeight: 20, color: colors.text },
  principal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.text,
  },
  principalTxt: { fontSize: 16, lineHeight: 21, color: colors.bg },
  presse: { transform: [{ scale: 0.97 }] },
});
