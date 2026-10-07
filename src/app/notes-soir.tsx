import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconeNote } from '@/components/app/IconeNote';
import { Appui, Button, Icon, Text, toast } from '@/components/ui';
import { GROUPES_NOTE, TAGS_SOIR, type GroupeNote } from '@/lib/reveil';
import { useProfil } from '@/store/profil';
import { alpha, colors, fonts, ui } from '@/theme';

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/** « Notes du soir » (maquette de l'utilisateur) : habitudes, bien-être, routine et une note libre, gardées dans le journal du sommeil. */
export default function NotesSoir() {
  const deja = useProfil.getState().notesSoir.find((n) => n.d.slice(0, 10) === aujourdhui());
  const [tags, setTags] = useState<string[]>(deja?.tags ?? []);
  const [note, setNote] = useState(deja?.note ?? '');
  const fermer = () => (router.canGoBack() ? router.back() : router.navigate('/sommeil'));

  const enregistrer = () => {
    useProfil.getState().ajouterNoteSoir({ d: new Date().toISOString(), tags, note: note.trim() });
    toast('Notes enregistrées dans ton journal 🌙');
    fermer();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.head}>
        <Appui accessibilityRole="button" onPress={fermer} style={styles.annuler}>
          <Text style={styles.annulerTxt}>Annuler</Text>
        </Appui>
        <Text weight="bold" style={styles.titre} accessibilityRole="header">
          Notes du soir
        </Text>
        <View style={styles.annulerVide} />
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
          <Text style={styles.question}>Qu’est-ce qui a marqué ta journée ?</Text>
          {(Object.keys(GROUPES_NOTE) as GroupeNote[]).map((g) => (
            <View key={g} style={styles.groupe}>
              <Text weight="bold" style={styles.h3}>
                {GROUPES_NOTE[g]}
              </Text>
              <View style={styles.grille}>
                {TAGS_SOIR.filter((t) => t.groupe === g).map((t) => {
                  const on = tags.includes(t.id);
                  return (
                    <Appui
                      key={t.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={t.nom}
                      onPress={() => setTags(on ? tags.filter((x) => x !== t.id) : [...tags, t.id])}
                      style={[styles.tag, on && styles.tagOn]}
                    >
                      <IconeNote id={t.id} color={on ? colors.pink : colors.text} />
                      <Text weight="medium" style={styles.tagTxt} numberOfLines={1}>
                        {t.nom}
                      </Text>
                      {on && (
                        <View style={styles.coche}>
                          <Icon name="check" size={12} color={colors.onPrimary} strokeWidth={3} />
                        </View>
                      )}
                    </Appui>
                  );
                })}
              </View>
            </View>
          ))}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ajouter une note…"
            placeholderTextColor={colors.textSecondary}
            multiline
            style={styles.note}
            accessibilityLabel="Note"
            maxLength={400}
          />
          <Text style={styles.petit}>Retrouve ces notes dans ton journal.</Text>
          <Button label="Enregistrer mes notes" onPress={enregistrer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6 },
  annuler: { paddingHorizontal: 12, height: 34, borderRadius: 17, justifyContent: 'center', backgroundColor: ui.iconBg },
  annulerTxt: { fontSize: 14, lineHeight: 18, color: colors.textSecondary },
  annulerVide: { width: 70 },
  titre: { fontSize: 20, lineHeight: 26 },
  scroll: { paddingHorizontal: 20, paddingBottom: 30, gap: 12 },
  question: { fontSize: 16, lineHeight: 21, color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
  groupe: { gap: 10 },
  h3: { ...fonts.bold, fontSize: 18, lineHeight: 23 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    width: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagOn: { borderColor: colors.pink, backgroundColor: alpha(colors.pink, 0.1) },
  tagTxt: { flex: 1, fontSize: 15, lineHeight: 20 },
  coche: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink },
  note: {
    minHeight: 76,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  petit: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, textAlign: 'center' },
});
