import { StyleSheet } from 'react-native';

import { Button, Text, toast } from '@/components/ui';
import { enEssai } from '@/lib/premium';
import { useProfil } from '@/store/profil';
import { colors, fonts } from '@/theme';

import { Sheet } from './Sheet';

/** « Ton abonnement » (subSheet du prototype) : annuler ou réactiver le renouvellement. */
export function AbonnementSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const p = useProfil((s) => s.premium);
  if (!p) return null;
  const basculer = () => {
    const avant = p.plan !== 'vie' && p.renew;
    useProfil.getState().basculerRenouvellement();
    onClose();
    toast(avant ? 'Renouvellement annulé' : 'Renouvellement réactivé');
  };
  return (
    <Sheet visible={visible} onClose={onClose} title="Ton abonnement">
      <Text style={styles.sub}>
        {p.plan === 'vie'
          ? "Tu as l'accès à vie, rien à gérer."
          : enEssai(p)
            ? "Essai gratuit en cours. Si tu annules, tu gardes l'accès jusqu'à la fin de l'essai et rien n'est facturé."
            : "Si tu annules, tu gardes l'accès jusqu'à la fin de la période payée."}
      </Text>
      {p.plan !== 'vie' && <Button label={p.renew ? 'Annuler le renouvellement' : 'Réactiver le renouvellement'} variant="dark" onPress={basculer} />}
      <Text style={styles.note}>Dans l&apos;app publiée, la gestion passe par les réglages App Store ou Google Play.</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  sub: { color: colors.textSecondary, fontSize: 14, lineHeight: 19.6, marginBottom: 14 },
  note: { fontFamily: fonts.regular, fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingTop: 10 },
});
