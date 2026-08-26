import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, type ColorValue } from 'react-native';

type IconSymbolProps = {
  name: SymbolViewProps['name'];
  size?: number;
  color: ColorValue;
  weight?: SymbolViewProps['weight'];
};

/** SF Symbols — jamais d'emoji dans l'UI de production (goût premium, cf. skill ui-kits). */
export function IconSymbol({ name, size = 22, color, weight = 'regular' }: IconSymbolProps) {
  return (
    <SymbolView
      name={name}
      weight={weight}
      tintColor={color}
      style={[styles.icon, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  icon: {},
});
