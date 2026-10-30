import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { Button, Text } from '@/components/ui';
import { changerMotDePasse, emailValide, envoyerCodeMotDePasse, pwScore } from '@/store/compte';
import { colors, fonts } from '@/theme';

import { Sheet } from './Sheet';

/**
 * « Mot de passe oublié ? » : l'email, puis le code reçu et le nouveau mot de passe.
 * Le prototype renvoyait à « la version publiée » ; mêmes champs et règles que l'écran de compte.
 */
export function MotDePasseSheet({ visible, emailInitial, onClose, onConnecte }: { visible: boolean; emailInitial: string; onClose: () => void; onConnecte: () => void }) {
  const [etape, setEtape] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(emailInitial);
  const [code, setCode] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);

  const envoyer = async () => {
    setErreur('');
    const mail = email.trim().toLowerCase();
    if (!emailValide(mail)) return setErreur('Adresse email invalide');
    setAttente(true);
    const r = await envoyerCodeMotDePasse(mail);
    setAttente(false);
    if (!r.ok) return setErreur(r.erreur);
    setEtape('code');
  };

  const valider = async () => {
    setErreur('');
    if (code.trim().length < 6) return setErreur('Entre le code reçu par email');
    if (pwScore(mdp) < 3 || mdp.length < 8) return setErreur('Mot de passe trop faible : 8 caractères, majuscule et chiffre');
    setAttente(true);
    const r = await changerMotDePasse(email.trim().toLowerCase(), code.trim(), mdp);
    setAttente(false);
    if (!r.ok) return setErreur(r.erreur);
    onConnecte();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Mot de passe oublié">
      {etape === 'email' ? (
        <>
          <Text style={styles.p}>Entre l&apos;adresse de ton compte : on t&apos;envoie un code pour choisir un nouveau mot de passe.</Text>
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
        </>
      ) : (
        <>
          <Text style={styles.p}>Code envoyé à {email.trim().toLowerCase()}. Vérifie aussi tes courriels indésirables.</Text>
          <TextInput
            style={styles.inp}
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
            placeholder="Code reçu"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={10}
            accessibilityLabel="Code reçu par email"
          />
          <TextInput
            style={[styles.inp, styles.mt10]}
            value={mdp}
            onChangeText={setMdp}
            placeholder="Nouveau mot de passe"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            autoCapitalize="none"
            accessibilityLabel="Nouveau mot de passe"
          />
        </>
      )}
      <Text style={styles.err} accessibilityRole="alert">
        {erreur}
      </Text>
      <Button
        label={attente ? '…' : etape === 'email' ? 'Recevoir un code' : 'Changer mon mot de passe'}
        disabled={attente}
        onPress={etape === 'email' ? envoyer : valider}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13.5, lineHeight: 19, color: colors.textSecondary, marginBottom: 14 },
  inp: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    ...fonts.regular,
    fontSize: 15,
  },
  mt10: { marginTop: 10 },
  err: { color: '#FF6B85', fontSize: 13, lineHeight: 18, minHeight: 18, marginVertical: 8 },
});
