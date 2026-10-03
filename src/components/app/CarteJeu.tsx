import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { COACH_IMAGES, EXERCICE_IMAGES } from '@/data';
import { carte, RARETES, type CarteId } from '@/lib/jeu';
import { alpha, colors, fonts, ui } from '@/theme';

/** Étoiles de rareté : 1 à 4. */
function Etoiles({ n, couleur, taille }: { n: number; couleur: string; taille: number }) {
  return (
    <View style={styles.etoiles}>
      {Array.from({ length: n }, (_, k) => (
        <Icon key={k} name="star" size={taille} color={couleur} fill={couleur} />
      ))}
    </View>
  );
}

/**
 * Carte récompense : illustration de l'exercice (ou mascotte du coach), nom, groupe musculaire, rareté.
 * `largeur` fixe la taille (format 5:7) ; `cachee` : silhouette d'une carte pas encore trouvée ; `dos` : face cachée.
 */
export function CarteJeu({ id, largeur, cachee = false, dos = false, nombre = 0 }: { id: CarteId; largeur: number; cachee?: boolean; dos?: boolean; nombre?: number }) {
  const c = carte(id);
  const h = Math.round((largeur * 7) / 5);
  const col = ui.rarete[c.rarete];
  const k = largeur / 110;
  if (dos) {
    return (
      <View style={[styles.carte, { width: largeur, height: h, borderRadius: 14 * k, backgroundColor: ui.carteDos, borderColor: colors.pink }]}>
        <LinearGradient colors={[alpha(colors.pink, 0.35), alpha(colors.pink, 0)]} style={StyleSheet.absoluteFill} />
        <View style={styles.centre}>
          <Text weight="bold" style={{ fontSize: 30 * k, lineHeight: 36 * k, color: colors.pink, letterSpacing: -1 * k }}>
            NÉA
          </Text>
          <Text style={{ fontSize: 7 * k, lineHeight: 10 * k, color: colors.textSecondary, letterSpacing: 1 * k }}>RÉCOMPENSE</Text>
        </View>
      </View>
    );
  }
  if (cachee) {
    return (
      <View style={[styles.carte, { width: largeur, height: h, borderRadius: 14 * k, backgroundColor: ui.carteFond[0], borderColor: colors.border }]}>
        <View style={styles.centre}>
          <Text weight="bold" style={{ fontSize: 34 * k, lineHeight: 40 * k, color: colors.textSecondary }}>
            ?
          </Text>
        </View>
        <View style={[styles.pied, { padding: 7 * k }]}>
          <Etoiles n={c.rarete + 1} couleur={alpha(col, 0.5)} taille={8 * k} />
        </View>
      </View>
    );
  }
  const img = c.coach ? COACH_IMAGES[c.coach].corps : EXERCICE_IMAGES[c.ex!];
  return (
    <View style={[styles.carte, { width: largeur, height: h, borderRadius: 14 * k, backgroundColor: ui.carteFond[c.rarete], borderColor: col }]}>
      <LinearGradient colors={[alpha(col, c.rarete >= 2 ? 0.35 : 0.18), alpha(col, 0)]} style={StyleSheet.absoluteFill} />
      <View style={[styles.haut, { paddingHorizontal: 7 * k, paddingTop: 6 * k }]}>
        <Etoiles n={c.rarete + 1} couleur={col} taille={8 * k} />
        {nombre > 1 && (
          <View style={[styles.badge, { borderRadius: 8 * k, paddingHorizontal: 5 * k, backgroundColor: alpha(col, 0.25) }]}>
            <Text weight="bold" style={{ fontSize: 9 * k, lineHeight: 13 * k, color: col }}>
              x{nombre}
            </Text>
          </View>
        )}
      </View>
      <Image source={img} style={styles.img} contentFit="contain" />
      <View style={[styles.pied, { padding: 7 * k, paddingTop: 4 * k }]}>
        <Text weight="bold" numberOfLines={2} style={{ fontSize: 10.5 * k, lineHeight: 13 * k }}>
          {c.nom}
        </Text>
        <Text numberOfLines={1} style={{ fontSize: 8.5 * k, lineHeight: 11 * k, color: col, ...fonts.semibold }}>
          {RARETES[c.rarete]} · {c.sous}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { overflow: 'hidden', borderWidth: 1.5 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  haut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  etoiles: { flexDirection: 'row', gap: 1 },
  badge: { paddingVertical: 1 },
  img: { flex: 1, marginHorizontal: '6%' },
  pied: {},
});
