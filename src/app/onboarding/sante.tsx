import { StyleSheet } from 'react-native';

import { AckRow, CheckCard, Warn, warnText } from '@/components/onboarding/Choices';
import { ob, ObScaffold } from '@/components/onboarding/ObScaffold';
import { Text, toast } from '@/components/ui';
import { HEALTH_QUESTIONS } from '@/data';
import { healthFlagged, useProfil } from '@/store/profil';

/** 7/8 — Santé : 5 questions et confirmations obligatoires (vObHealth). */
export default function Sante() {
  const health = useProfil((s) => s.health);
  const set = useProfil((s) => s.set);
  const toggleHealthFlag = useProfil((s) => s.toggleHealthFlag);
  const toggleHealthAck = useProfil((s) => s.toggleHealthAck);
  const flags = health?.flags ?? [0, 0, 0, 0, 0];
  const any = healthFlagged(health);
  const ok = !!health?.ack && (!any || !!health?.ack2);

  return (
    <ObScaffold
      step="sante"
      title="Ta santé d'abord"
      sub="Réponds honnêtement : ça reste sur ton appareil et ça sert à adapter ton programme."
      ok={ok}
      onNext={() => {
        if (!health?.ack) {
          toast('Coche la case pour continuer');
          return false;
        }
        if (any) {
          if (!health.ack2) {
            toast('Confirme la deuxième case pour continuer');
            return false;
          }
          // Une réponse « oui » : programme au niveau débutant.
          set({ level: 'deb', obCoachSet: false });
        }
      }}
    >
      <Text style={[ob.lbl, ob.first]}>Coche ce qui s&apos;applique à toi</Text>
      {HEALTH_QUESTIONS.map((q, i) => (
        <CheckCard key={i} label={q} on={!!flags[i]} onPress={() => toggleHealthFlag(i)} />
      ))}
      {any && (
        <>
          <Warn style={styles.warn}>
            <Text style={warnText()}>
              <Text weight="bold" style={warnText()}>
                Consulte un professionnel de la santé
              </Text>{' '}
              (médecin, kinésiologue ou physiothérapeute) avant de commencer. Ton programme démarrera au niveau
              débutant, à faible intensité.
            </Text>
          </Warn>
          <AckRow
            on={!!health?.ack2}
            onPress={() => toggleHealthAck('ack2')}
            label="J'ai consulté, ou je choisis de commencer doucement sous ma responsabilité"
          />
        </>
      )}
      <AckRow
        on={!!health?.ack}
        onPress={() => toggleHealthAck('ack')}
        label="Je comprends que NÉA ne remplace pas un avis médical et j'arrête l'exercice en cas de douleur, de malaise ou d'essoufflement anormal"
      />
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  warn: { marginTop: 6 },
});
