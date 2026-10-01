import { StyleSheet, View } from "react-native";

import { Button, Icon, Text } from "@/components/ui";
import {
  montreDisponible,
  ouvrirSurMontre,
  useEstSurMontre,
  type ChoixMontre,
} from "@/store/liaisonMontre";
import { colors, ui } from "@/theme";

/**
 * « Ouvrir sur la montre » (hors prototype, maquette de l'utilisateur) : la séance devient « Ma séance » sur l'Apple Watch.
 * Affiché seulement si une montre avec NÉA est jumelée ; « Séance sélectionnée » une fois envoyée.
 */
export function BoutonMontre({
  choix,
  style,
}: {
  choix: ChoixMontre;
  style?: object;
}) {
  const envoyee = useEstSurMontre(choix);
  if (!montreDisponible()) return null;
  return (
    <View style={style}>
      {envoyee && (
        <View style={styles.choisie}>
          <View style={styles.coche}>
            <Icon
              name="check"
              size={14}
              strokeWidth={3}
              color={colors.onPrimary}
            />
          </View>
          <Text weight="semibold" style={styles.txt}>
            Séance sélectionnée sur ta montre
          </Text>
        </View>
      )}
      <Button
        label={envoyee ? "Rouvrir sur la montre" : "Ouvrir sur la montre"}
        icon="montre"
        variant="dark"
        onPress={() => ouvrirSurMontre(choix)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  choisie: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: ui.selFond,
    marginBottom: 8,
  },
  coche: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  txt: { fontSize: 14, lineHeight: 18 },
});
