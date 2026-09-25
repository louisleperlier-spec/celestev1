import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { CoachFace } from '@/components/app/CoachFace';
import { Button, Icon, Text, toast } from '@/components/ui';
import { coachById } from '@/lib/plan';
import { connecter, emailValide, inscrire, pwScore } from '@/store/compte';
import { useProfil } from '@/store/profil';
import { colors, fonts, ui } from '@/theme';

type Mode = 'signup' | 'login';

const COULEURS_FORCE = ['#FF3B5C', '#FF8A1F', '#FFD21F', '#3EE07A'];
const TEXTES_FORCE = ['8 caractères minimum, avec majuscule et chiffre', 'Faible', 'Moyen', 'Bon', 'Excellent'];

/**
 * Création de compte / connexion (vAuth du prototype).
 * `onb=1` : fin de l'onboarding (« Ton programme est prêt »), avec « Plus tard ».
 */
export default function Compte() {
  const params = useLocalSearchParams<{ mode?: Mode; onb?: string }>();
  const onb = params.onb === '1';
  const [mode, setMode] = useState<Mode>(params.mode ?? (onb ? 'signup' : 'login'));
  const profil = useProfil();
  const c = coachById(profil.coach);
  const [prenom, setPrenom] = useState(profil.name);
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [voir, setVoir] = useState(false);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');
  const [attente, setAttente] = useState(false);
  const score = pwScore(mdp);

  /** Après la connexion : l'accueil si l'onboarding est fait, sinon l'onboarding. */
  const entrer = () => {
    const st = useProfil.getState();
    if (onb && !st.onboarded) {
      st.logWeight(st.weight);
      st.set({ onboarded: true });
    }
    router.dismissAll();
    router.replace(useProfil.getState().onboarded ? '/accueil' : '/onboarding/prenom');
  };

  const valider = async () => {
    setErreur('');
    setInfo('');
    const mail = email.trim().toLowerCase();
    if (!emailValide(mail)) return setErreur('Adresse email invalide');
    if (mode === 'signup' && (score < 3 || mdp.length < 8)) return setErreur('Mot de passe trop faible : 8 caractères, majuscule et chiffre');
    setAttente(true);
    if (mode === 'signup' && !onb && prenom.trim()) useProfil.getState().set({ name: prenom.trim() });
    const r = mode === 'signup' ? await inscrire(mail, mdp) : await connecter(mail, mdp);
    setAttente(false);
    if (!r.ok) return setErreur(r.erreur);
    if (r.confirmer) {
      // Supabase demande de confirmer l'adresse avant la première connexion.
      if (onb) {
        toast('Confirme ton email avec le lien reçu pour activer la sauvegarde');
        return entrer();
      }
      setMode('login');
      setMdp('');
      return setInfo('Compte créé ! Confirme ton adresse avec le lien reçu par email, puis connecte-toi.');
    }
    entrer();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      {!onb && (
        <View style={styles.obh}>
          <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
            <Icon name="left" />
          </Pressable>
        </View>
      )}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {onb ? (
            <View style={styles.hero}>
              <CoachFace id={c.id} size={70} borderColor={c.c} borderWidth={2} />
              <View style={styles.bubble}>
                <Text style={styles.bubbleTxt}>
                  Ton programme est prêt{profil.name ? ', ' + profil.name : ''} ! Crée ton compte pour ne rien perdre.
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text weight="light" style={styles.logo}>
                NÉA
              </Text>
              <Text weight="semibold" style={styles.logoSub}>
                COACHING SPORTIF IA
              </Text>
            </>
          )}
          <Text style={styles.h1}>{mode === 'signup' ? 'Crée ton compte' : 'Content de te revoir'}</Text>

          {/* Google et Apple : il faut d'abord les configurer (Google Cloud, Apple Developer). */}
          <Pressable accessibilityRole="button" style={styles.gbtn} onPress={() => toast('Connexion Google bientôt disponible')}>
            <Svg viewBox="0 0 24 24" width={20} height={20}>
              <Path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
              <Path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z" />
              <Path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8z" />
              <Path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z" />
            </Svg>
            <Text weight="semibold" style={styles.gTxt}>
              Continuer avec Google
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.abtn} onPress={() => toast('Connexion Apple bientôt disponible')}>
            <Svg viewBox="0 0 24 24" width={19} height={19}>
              <Path
                fill="#FFFFFF"
                d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM13.9 5c.7-.9 1.2-2 1-3.2-1 .1-2.2.7-3 1.6-.6.7-1.2 1.9-1 3.1 1.1.1 2.3-.6 3-1.5z"
              />
            </Svg>
            <Text weight="semibold" style={styles.aTxt}>
              Continuer avec Apple
            </Text>
          </Pressable>

          <View style={styles.or}>
            <View style={styles.orLine} />
            <Text style={styles.orTxt}>ou avec ton email</Text>
            <View style={styles.orLine} />
          </View>

          {mode === 'signup' && !onb && (
            <TextInput style={[styles.inp, styles.mb10]} value={prenom} onChangeText={setPrenom} placeholder="Prénom" placeholderTextColor={colors.textSecondary} autoComplete="given-name" accessibilityLabel="Prénom" />
          )}
          <TextInput
            style={styles.inp}
            value={email}
            onChangeText={setEmail}
            placeholder="Adresse email"
            placeholderTextColor={colors.textSecondary}
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            accessibilityLabel="Adresse email"
          />
          <View style={styles.pwwrap}>
            <TextInput
              style={[styles.inp, styles.pwInp]}
              value={mdp}
              onChangeText={setMdp}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!voir}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              autoCapitalize="none"
              onSubmitEditing={valider}
              accessibilityLabel="Mot de passe"
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Afficher le mot de passe" onPress={() => setVoir(!voir)} style={styles.eye}>
              <Text style={styles.eyeTxt}>👁</Text>
            </Pressable>
          </View>
          {mode === 'signup' ? (
            <>
              <View style={styles.pwm}>
                {[0, 1, 2, 3].map((k) => (
                  <View key={k} style={[styles.pwmBar, { backgroundColor: k < score ? COULEURS_FORCE[score - 1] : colors.border }]} />
                ))}
              </View>
              <Text style={styles.pwt}>{TEXTES_FORCE[score]}</Text>
            </>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => toast('La réinitialisation du mot de passe arrive bientôt')}>
              <Text style={styles.more}>Mot de passe oublié ?</Text>
            </Pressable>
          )}
          <Text style={[styles.aerr, info ? styles.info : null]} accessibilityRole="alert">
            {erreur || info}
          </Text>
          <Button label={attente ? '…' : mode === 'signup' ? 'Créer mon compte' : 'Se connecter'} disabled={attente} onPress={valider} style={styles.mt6} />
          <View style={styles.aswitch}>
            <Text style={styles.aswitchTxt}>{mode === 'signup' ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setErreur('');
                setInfo('');
                setMode(mode === 'signup' ? 'login' : 'signup');
              }}
            >
              <Text weight="semibold" style={styles.aswitchBtn}>
                {mode === 'signup' ? 'Se connecter' : 'Créer un compte'}
              </Text>
            </Pressable>
          </View>
          {onb && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                entrer();
                toast('Tu pourras créer ton compte depuis le Profil');
              }}
            >
              <Text style={styles.skip}>Plus tard, continuer sans compte</Text>
            </Pressable>
          )}
          <Text style={styles.note}>
            En continuant, tu acceptes les{' '}
            <Text style={styles.lnk} onPress={() => router.push('/legal/conditions')}>
              conditions d&apos;utilisation
            </Text>{' '}
            et la{' '}
            <Text style={styles.lnk} onPress={() => router.push('/legal/confidentialite')}>
              politique de confidentialité
            </Text>
            .
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  obh: { height: 52, paddingHorizontal: 12, justifyContent: 'center' },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 28 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  bubble: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    backgroundColor: ui.chipBg,
    borderWidth: 1,
    borderColor: colors.border2,
  },
  bubbleTxt: { fontSize: 14, lineHeight: 19.6 },
  logo: { fontSize: 34, lineHeight: 42, letterSpacing: 34 * 0.42, paddingLeft: 34 * 0.42, textAlign: 'center', marginTop: 6 },
  logoSub: { fontSize: 10.5, lineHeight: 14, letterSpacing: 10.5 * 0.32, color: colors.pinkLight, textAlign: 'center', marginTop: 4 },
  h1: { fontFamily: fonts.black, fontSize: 28, lineHeight: 31, letterSpacing: -0.28, marginTop: 18 },
  gbtn: { height: 52, borderRadius: 999, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
  gTxt: { fontSize: 15, lineHeight: 19, color: '#1F1F1F' },
  abtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#3A3A40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
  },
  aTxt: { fontSize: 15, lineHeight: 19 },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 14 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border2 },
  orTxt: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  inp: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  mb10: { marginBottom: 10 },
  pwwrap: { marginTop: 10 },
  pwInp: { paddingRight: 48 },
  eye: { position: 'absolute', right: 6, top: 5, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', opacity: 0.7 },
  eyeTxt: { fontSize: 16, lineHeight: 20 },
  pwm: { flexDirection: 'row', gap: 5, marginTop: 10 },
  pwmBar: { flex: 1, height: 4, borderRadius: 3 },
  pwt: { fontSize: 11.5, lineHeight: 15, color: colors.textSecondary, marginTop: 6 },
  more: { color: colors.pinkLight, fontSize: 13.5, lineHeight: 18, marginTop: 8 },
  aerr: { color: '#FF6B85', fontSize: 13, lineHeight: 18, minHeight: 18, marginTop: 8 },
  info: { color: colors.green },
  mt6: { marginTop: 6 },
  aswitch: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  aswitchTxt: { fontSize: 13.5, lineHeight: 18, color: colors.textSecondary },
  aswitchBtn: { fontSize: 13.5, lineHeight: 18, color: colors.pinkLight },
  skip: { textAlign: 'center', marginTop: 10, fontSize: 13.5, lineHeight: 18, color: colors.textSecondary, textDecorationLine: 'underline' },
  note: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, textAlign: 'center', paddingTop: 12 },
  lnk: { color: colors.pinkLight, textDecorationLine: 'underline' },
});
