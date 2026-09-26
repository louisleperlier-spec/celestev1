import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DetailHead } from '@/components/app/Detail';
import { NotifSheet } from '@/components/app/NotifSheet';
import { Button, Card, Icon, Text, toast } from '@/components/ui';
import { ouvrirNotif, verifierNotifs } from '@/store/notifs';
import { useProfil } from '@/store/profil';
import { colors } from '@/theme';

/** Liste des notifications (vNotifs du prototype) : toutes marquées lues à l'ouverture. */
export default function Notifications() {
  const list = useProfil((s) => s.notifs);
  const [reglages, setReglages] = useState(false);

  useEffect(() => {
    useProfil.getState().lireNotifs();
  }, [list]);

  /** « Tester les notifications » : rappel VFC dans 2 s et bilan de nuit tout de suite. */
  const tester = () => {
    const st = useProfil.getState();
    const d = new Date();
    const maintenant = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const wake = st.nset.wake;
    st.set({ pending: [...st.pending, { at: Date.now() + 2000, type: 'post', kind: 'muscu', endHrv: 34 }], lastWake: null, nset: { ...st.nset, wake: maintenant } });
    verifierNotifs();
    useProfil.getState().set({ nset: { ...useProfil.getState().nset, wake } });
    toast('Notification VFC dans 2 s');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <DetailHead
        titre="Notifications"
        droite={
          <Pressable accessibilityRole="button" accessibilityLabel="Réglages" onPress={() => setReglages(true)} style={styles.iconbtn}>
            <Icon name="sliders" />
          </Pressable>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.list}>
          {list.length ? (
            list.map((n) => (
              <Pressable key={n.id} accessibilityRole="button" onPress={() => ouvrirNotif(n.act, n.id)}>
                <Card style={styles.nrow}>
                  <View style={[styles.nic, { backgroundColor: n.col }]}>
                    <Icon name={n.icon} color={colors.text} />
                  </View>
                  <View style={styles.flex}>
                    <Text weight="semibold" style={styles.h5}>
                      {n.title}
                    </Text>
                    <Text style={styles.p}>{n.body}</Text>
                    <Text style={styles.date}>{new Date(n.d).toLocaleString('fr-CA', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </Card>
              </Pressable>
            ))
          ) : (
            <Text style={styles.vide}>Aucune notification pour l&apos;instant.</Text>
          )}
        </View>
        <View style={styles.pad}>
          <Button label="Tester les notifications" variant="dark" onPress={tester} />
        </View>
        <View style={styles.bas} />
      </ScrollView>
      <NotifSheet visible={reglages} onClose={() => setReglages(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, minWidth: 0 },
  iconbtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, marginTop: 8 },
  nrow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8 },
  nic: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  h5: { fontSize: 14.5, lineHeight: 19 },
  p: { fontSize: 12, lineHeight: 16.8, color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: 11, lineHeight: 15, color: colors.textTertiary, marginTop: 2 },
  vide: { fontSize: 11.5, lineHeight: 16, color: colors.textSecondary, paddingVertical: 20, textAlign: 'center' },
  pad: { paddingHorizontal: 20, marginTop: 12 },
  bas: { height: 12 },
});
