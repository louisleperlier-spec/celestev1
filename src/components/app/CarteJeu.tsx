import { Image } from 'expo-image';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { Text } from '@/components/ui';
import { COACH_IMAGES, EXERCICE_IMAGES } from '@/data';
import { RANDO_IMAGES } from '@/data/randosImages';
import { carte, RARETES, type CarteId } from '@/lib/jeu';
import { alpha, colors, fonts, ui } from '@/theme';

/** Cadres dessinés par l'utilisateur (étoiles comprises) ; le Rare est dérivé de l'Épique en attendant le sien. */
const CADRES: readonly ImageSourcePropType[] = [
  require('@/assets/cartes/commune.webp'),
  require('@/assets/cartes/rare.webp'),
  require('@/assets/cartes/epique.webp'),
  require('@/assets/cartes/legendaire.webp'),
];
const DOS: ImageSourcePropType = require('@/assets/cartes/dos.webp');

/** Zones des cadres (en part de la carte) : illustration et bandeau du nom. */
const ZONE_IMG = { left: '9.4%', right: '9.2%', top: '17%', bottom: '23.2%' } as const;
const ZONE_NOM = { left: '10%', right: '10%', top: '78.4%', bottom: '8.6%' } as const;

/**
 * Carte récompense : cadre de sa rareté, illustration de l'exercice (mascotte du coach, photo du sentier), nom et groupe.
 * `largeur` fixe la taille (format 5:7) ; `cachee` : carte pas encore trouvée ; `dos` : face cachée (ouverture).
 */
export function CarteJeu({ id, largeur, cachee = false, dos = false, nombre = 0 }: { id: CarteId; largeur: number; cachee?: boolean; dos?: boolean; nombre?: number }) {
  const c = carte(id);
  const h = Math.round((largeur * 7) / 5);
  const k = largeur / 110;
  const taille = { width: largeur, height: h };
  if (dos) return <Image source={DOS} style={taille} contentFit="fill" />;
  if (cachee) {
    return (
      <View style={taille}>
        <Image source={CADRES[c.rarete]} style={[StyleSheet.absoluteFill, styles.terne]} contentFit="fill" />
        <View style={[styles.zone, ZONE_IMG, styles.centre]}>
          <Text weight="bold" style={{ fontSize: 34 * k, lineHeight: 40 * k, color: colors.textSecondary }}>
            ?
          </Text>
        </View>
      </View>
    );
  }
  const img = c.coach ? COACH_IMAGES[c.coach].corps : c.rando ? RANDO_IMAGES[c.rando] : EXERCICE_IMAGES[c.ex!];
  const col = ui.rarete[c.rarete];
  return (
    <View style={taille}>
      <Image source={CADRES[c.rarete]} style={StyleSheet.absoluteFill} contentFit="fill" />
      <View style={[styles.zone, ZONE_IMG, { borderRadius: 7 * k, padding: c.rando ? 0 : 4 * k }]}>
        <Image source={img} style={styles.plein} contentFit={c.rando ? 'cover' : 'contain'} />
      </View>
      {nombre > 1 && (
        <View style={[styles.badge, { top: 5.5 * k, right: 9 * k, borderRadius: 8 * k, paddingHorizontal: 5 * k, backgroundColor: alpha(col, 0.3) }]}>
          <Text weight="bold" style={{ fontSize: 9 * k, lineHeight: 13 * k, color: colors.text }}>
            x{nombre}
          </Text>
        </View>
      )}
      <View style={[styles.zone, ZONE_NOM, styles.centre, { paddingHorizontal: 3 * k }]}>
        <Text weight="bold" numberOfLines={2} style={{ fontSize: 9.5 * k, lineHeight: 11.5 * k, textAlign: 'center' }}>
          {c.nom}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 7.5 * k, lineHeight: 10 * k, color: col, textAlign: 'center', ...fonts.semibold }}>
          {RARETES[c.rarete]} · {c.sous}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { position: 'absolute', overflow: 'hidden' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  plein: { width: '100%', height: '100%' },
  terne: { opacity: 0.45 },
  badge: { position: 'absolute', paddingVertical: 1 },
});
