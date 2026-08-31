import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PillButton } from '@/components/pill-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCheckIns } from '@/lib/checkins-store';

function Field({
  label,
  value,
  onChangeText,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  suffix: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <View style={[styles.fieldInputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={theme.textSecondary}
          style={[styles.fieldInput, { color: theme.text }]}
        />
        <ThemedText themeColor="textSecondary">{suffix}</ThemedText>
      </View>
    </View>
  );
}

export default function AddScanScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { addScan } = useCheckIns();

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const canSave = weight.trim() || bodyFat.trim() || waist.trim() || photoUri;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    await addScan({
      weightKg: weight.trim() ? Number(weight) : undefined,
      bodyFatPct: bodyFat.trim() ? Number(bodyFat) : undefined,
      waistCm: waist.trim() ? Number(waist) : undefined,
      note: note.trim() || undefined,
      photoUri: photoUri ?? undefined,
    });
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={() => router.back()}>
            <Ionicons name="close" size={26} color={theme.text} />
          </Pressable>
          <ThemedText type="smallBold">Nouveau scan</ThemedText>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            onPress={pickPhoto}
            style={[styles.photoPicker, { backgroundColor: theme.backgroundElement }]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <>
                <Ionicons name="camera" size={32} color={theme.textSecondary} />
                <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                  Ajouter une photo (optionnel)
                </ThemedText>
              </>
            )}
          </Pressable>

          <Field label="POIDS" value={weight} onChangeText={setWeight} suffix="kg" />
          <Field label="MASSE GRASSE" value={bodyFat} onChangeText={setBodyFat} suffix="%" />
          <Field label="TOUR DE TAILLE" value={waist} onChangeText={setWaist} suffix="cm" />

          <View style={styles.field}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.fieldLabel}>
              NOTE (OPTIONNEL)
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ressenti, contexte…"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[
                styles.notesInput,
                { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.border },
              ]}
            />
          </View>
        </ScrollView>

        <PillButton title="Enregistrer" onPress={handleSave} disabled={!canSave || saving} style={styles.cta} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
  },
  content: { gap: Spacing.three, paddingBottom: Spacing.four },
  photoPicker: {
    aspectRatio: 1.6,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  field: { gap: Spacing.two },
  fieldLabel: { letterSpacing: 1 },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  fieldInput: { flex: 1, paddingVertical: Spacing.three, fontSize: 16 },
  notesInput: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  cta: { marginBottom: Spacing.three },
});
