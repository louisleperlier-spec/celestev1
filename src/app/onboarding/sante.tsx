import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet } from '@/components/app/Sheet';
import { AckRow, CheckBox, ListeCoches, Warn, warnText } from '@/components/onboarding/Choices';
import { ObScaffold } from '@/components/onboarding/ObScaffold';
import { Button, Icon, Text, toast } from '@/components/ui';
import { HEALTH_QUESTIONS } from '@/data';
import { healthFlagged, useProfil } from '@/store/profil';
import { colors } from '@/theme';

/** Libellés courts des 5 questions (maquettes) ; les questions complètes sont dans « Pourquoi ces questions ? ». */
const COURTES = [
  'Problème cardiaque ou hypertension',
  "Douleur à la poitrine au repos ou à l'effort",
  'Étourdissements ou perte de connaissance cette année',
  'Blessure ou problème articulaire pouvant s’aggraver',
  'Grossesse ou accouchement depuis moins de 6 mois',
] as const;

/** 7/8 — Santé : 5 questions, « aucune », confirmations obligatoires (vObHealth). */
export default function Sante() {
  const health = useProfil((s) => s.health);
  const set = useProfil((s) => s.set);
  const toggleHealthFlag = useProfil((s) => s.toggleHealthFlag);
  const toggleHealthAck = useProfil((s) => s.toggleHealthAck);
  const flags = health?.flags ?? [0, 0, 0, 0, 0];
  const any = healthFlagged(health);
  // « Aucune de ces situations » : déjà vrai si l'écran a été validé sans case cochée.
  const [aucune, setAucune] = useState(!!health?.ack && !any);
  const [pourquoi, setPourquoi] = useState(false);
  const repondu = any || aucune;
  const ok = repondu && !!health?.ack && (!any || !!health?.ack2);

  const cocher = (i: number) => {
    if (!flags[i]) setAucune(false);
    toggleHealthFlag(i);
  };
  const cocherAucune = () => {
    if (!aucune) flags.forEach((f, i) => f && toggleHealthFlag(i));
    setAucune(!aucune);
  };

  return (
    <ObScaffold
      step="sante"
      eyebrow="TA SANTÉ"
      title="Avant de commencer"
      sub="Indique ce qui s'applique à toi."
      ok={ok}
      onNext={() => {
        if (!repondu) {
          toast('Coche au moins une réponse');
          return false;
        }
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
      <ListeCoches items={COURTES.map((label, i) => ({ label, on: !!flags[i], onPress: () => cocher(i) }))} />

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: aucune }} onPress={cocherAucune} style={[styles.aucune, aucune && styles.aucuneOn]}>
        <CheckBox on={aucune} />
        <Text weight="medium" style={styles.aucuneTxt}>
          Aucune de ces situations
        </Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={() => setPourquoi(true)} style={styles.pourquoi}>
        <Text style={styles.pourquoiTxt}>Pourquoi ces questions ?</Text>
        <Icon name="right" size={18} color={colors.textSecondary} />
      </Pressable>

      {any && (
        <>
          <Warn style={styles.warn}>
            <Text style={warnText()}>
              <Text weight="bold" style={warnText()}>
                Consulte un professionnel de la santé
              </Text>{' '}
              (médecin, kinésiologue ou physiothérapeute) avant de commencer. Ton programme démarrera au niveau débutant, à faible intensité.
            </Text>
          </Warn>
          <AckRow on={!!health?.ack2} onPress={() => toggleHealthAck('ack2')} label="J'ai consulté, ou je choisis de commencer doucement sous ma responsabilité" />
        </>
      )}
      <AckRow
        on={!!health?.ack}
        onPress={() => toggleHealthAck('ack')}
        label="Je comprends que NÉA ne remplace pas un avis médical."
        sous="J'arrête l'exercice en cas de douleur, de malaise ou d'essoufflement anormal."
      />

      <Sheet visible={pourquoi} onClose={() => setPourquoi(false)} title="Pourquoi ces questions ?">
        <Text style={styles.sheetTxt}>
          Elles repèrent les situations où un avis médical est conseillé avant de commencer. Tes réponses restent sur ton appareil et servent
          à adapter ton programme : si une situation s&apos;applique à toi, il démarre au niveau débutant, à faible intensité.
        </Text>
        <View style={styles.sheetListe}>
          {HEALTH_QUESTIONS.map((q) => (
            <Text key={q} style={styles.sheetQ}>
              • {q}
            </Text>
          ))}
        </View>
        <Button label="J'ai compris" onPress={() => setPourquoi(false)} />
      </Sheet>
    </ObScaffold>
  );
}

const styles = StyleSheet.create({
  aucune: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  aucuneOn: { borderColor: colors.pink },
  aucuneTxt: { flex: 1, fontSize: 16, lineHeight: 21 },
  pourquoi: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  pourquoiTxt: { flex: 1, fontSize: 16, lineHeight: 21 },
  warn: { marginTop: 14 },
  sheetTxt: { fontSize: 15, lineHeight: 21, color: colors.textSecondary },
  sheetListe: { gap: 8, marginTop: 14, marginBottom: 18 },
  sheetQ: { fontSize: 14, lineHeight: 19 },
});
