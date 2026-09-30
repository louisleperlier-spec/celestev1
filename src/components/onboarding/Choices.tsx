import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, SelectableCard, Text, type IconName } from '@/components/ui';
import { alpha, colors, fonts, ui } from '@/theme';

/** Pastille de sélection à droite d'une carte : cercle vide, ou rose plein coché. */
export function Coche({ on, size = 26 }: { on: boolean; size?: number }) {
  return (
    <View style={[s.coche, { width: size, height: size, borderRadius: size / 2 }, on && s.cocheOn]}>
      {on && <Icon name="check" size={size * 0.55} strokeWidth={3} color={colors.text} />}
    </View>
  );
}

/** Case à cocher carrée (santé, confirmations). */
export function CheckBox({ on }: { on: boolean }) {
  return <View style={[s.cbx, on && s.cbxOn]}>{on && <Icon name="check" size={15} strokeWidth={3} color={colors.text} />}</View>;
}

/** Pastille d'icône d'une carte (fond rosé quand la carte est choisie). */
function Tuile({ on, children }: { on: boolean; children: ReactNode }) {
  return <View style={[s.tuile, on && s.tuileOn]}>{children}</View>;
}

/** Trois barres de niveau, `n` remplies. */
export function BarresNiveau({ n, on }: { n: number; on: boolean }) {
  return (
    <View style={s.barres}>
      {[10, 15, 20].map((h, i) => (
        <View key={h} style={[s.barre, { height: h, backgroundColor: i < n ? (on ? colors.pink : colors.text) : alpha(colors.text, 0.25) }]} />
      ))}
    </View>
  );
}

/** Objectif à cocher : icône, libellé, pastille. */
export function GoalRow({ icon, label, on, onPress }: { icon: IconName; label: string; on: boolean; onPress: () => void }) {
  return (
    <SelectableCard multi selected={on} onPress={onPress} style={s.goal} accessibilityLabel={label}>
      <Icon name={icon} size={22} color={on ? colors.pink : ui.icon} />
      <Text weight="medium" style={s.goalLabel}>
        {label}
      </Text>
      <Coche on={on} size={24} />
    </SelectableCard>
  );
}

/** Grand choix unique : pastille d'icône, titre, description, pastille de sélection. */
export function BigChoice({
  icon,
  visuel,
  title,
  desc,
  on,
  onPress,
}: {
  icon?: IconName;
  /** Dessin à la place de l'icône (barres de niveau). */
  visuel?: ReactNode;
  title: string;
  desc: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <SelectableCard selected={on} onPress={onPress} style={s.big2} accessibilityLabel={title}>
      <Tuile on={on}>{visuel ?? (icon && <Icon name={icon} size={22} color={on ? colors.pink : colors.text} />)}</Tuile>
      <View style={s.flex}>
        <Text weight="semibold" style={s.big2Title}>
          {title}
        </Text>
        <Text style={s.big2Desc}>{desc}</Text>
      </View>
      <Coche on={on} />
    </SelectableCard>
  );
}

/** Nombres côte à côte dans un seul bloc (séances par semaine) : le choisi en rose plein. */
export function NombresSegmentes<T extends number>({ valeurs, value, onChange }: { valeurs: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={s.nombres} accessibilityRole="radiogroup">
      {valeurs.map((v, i) => {
        const on = v === value;
        return (
          <Pressable
            key={v}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            accessibilityLabel={String(v)}
            onPress={() => onChange(v)}
            style={[s.nombre, i > 0 && s.nombreSep, on && s.nombreOn]}
          >
            <Text weight="semibold" style={[s.nombreTxt, on && s.nombreTxtOn]}>
              {v}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Petit choix en grille : icône, libellé, pastille (durée, matériel). */
export function PetitChoix({ icon, label, on, onPress, multi }: { icon: IconName; label: string; on: boolean; onPress?: () => void; multi?: boolean }) {
  return (
    <SelectableCard multi={multi} selected={on} onPress={onPress} style={s.petit} accessibilityLabel={label}>
      <Icon name={icon} size={20} color={on ? colors.pink : colors.text} />
      <Text weight="medium" style={s.petitTxt} numberOfLines={2}>
        {label}
      </Text>
      <Coche on={on} size={22} />
    </SelectableCard>
  );
}

/** Pastille de nombre seule (réglages, nuit). */
export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress} style={[s.chip, on && s.chipOn]} accessibilityLabel={label}>
      <Text weight="semibold" style={[s.chipText, on && s.nombreTxtOn]}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Liste de cases à cocher dans une seule carte, lignes séparées. */
export function ListeCoches({ items }: { items: readonly { label: string; on: boolean; onPress: () => void }[] }) {
  return (
    <View style={s.liste}>
      {items.map((it, i) => (
        <Pressable
          key={it.label}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: it.on }}
          onPress={it.onPress}
          style={[s.ligne, i > 0 && s.ligneSep]}
        >
          <CheckBox on={it.on} />
          <Text style={s.ligneTxt}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Carte d'information : icône dans une pastille, texte (et titre). */
export function InfoCarte({ icon = 'info', titre, texte, style }: { icon?: IconName; titre?: string; texte: string; style?: object }) {
  return (
    <View style={[s.info, style]}>
      {titre ? (
        <View style={s.infoTuile}>
          <Icon name={icon} size={22} color={colors.text} />
        </View>
      ) : (
        <Icon name={icon} size={24} color={colors.textSecondary} />
      )}
      <View style={s.flex}>
        {titre ? (
          <Text weight="semibold" style={s.infoTitre}>
            {titre}
          </Text>
        ) : null}
        <Text style={titre ? s.infoSous : s.infoTxt}>{texte}</Text>
      </View>
    </View>
  );
}

/** Confirmation à cocher, sans carte. */
export function AckRow({ label, sous, on, onPress }: { label: string; sous?: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={s.ack}>
      <CheckBox on={on} />
      <View style={s.flex}>
        <Text style={s.ackText}>{label}</Text>
        {sous ? <Text style={s.ackSous}>{sous}</Text> : null}
      </View>
    </Pressable>
  );
}

/** Encadré d'avertissement. */
export function Warn({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[s.warn, style]}>{typeof children === 'string' ? <Text style={s.warnText}>{children}</Text> : children}</View>;
}

export const warnText = () => s.warnText;

const s = StyleSheet.create({
  flex: { flex: 1 },
  coche: { borderWidth: 2, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  cocheOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  cbx: { width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: colors.border2, alignItems: 'center', justifyContent: 'center' },
  cbxOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  tuile: { width: 48, height: 48, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  tuileOn: { backgroundColor: alpha(colors.pink, 0.16) },
  barres: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barre: { width: 5, borderRadius: 1.5 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 10 },
  goalLabel: { flex: 1, fontSize: 16, lineHeight: 21 },
  big2: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 12 },
  big2Title: { fontSize: 18, lineHeight: 23 },
  big2Desc: { fontSize: 15, lineHeight: 20, color: colors.textSecondary, marginTop: 2 },
  nombres: { flexDirection: 'row', height: 64, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' },
  nombre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nombreSep: { borderLeftWidth: 1, borderLeftColor: colors.border },
  nombreOn: { backgroundColor: colors.pink, borderRadius: 12, borderLeftWidth: 0 },
  nombreTxt: { fontSize: 20, lineHeight: 25 },
  nombreTxtOn: { color: colors.onPrimary },
  petit: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 60, paddingHorizontal: 12 },
  petitTxt: { flex: 1, fontSize: 15, lineHeight: 19 },
  chip: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  chipOn: { backgroundColor: colors.pink, borderColor: colors.pink },
  chipText: { fontSize: 15, lineHeight: 19 },
  liste: { borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  ligneSep: { borderTopWidth: 1, borderTopColor: colors.border },
  ligneTxt: { flex: 1, fontSize: 15.5, lineHeight: 21 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.surface },
  infoTuile: { width: 48, height: 48, borderRadius: 12, backgroundColor: ui.dark, alignItems: 'center', justifyContent: 'center' },
  infoTitre: { fontSize: 17, lineHeight: 22 },
  infoSous: { fontSize: 14, lineHeight: 19, color: colors.textSecondary, marginTop: 2 },
  infoTxt: { fontSize: 15.5, lineHeight: 21, color: colors.textSecondary },
  ack: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 18, paddingHorizontal: 4 },
  ackText: { fontSize: 15.5, lineHeight: 21, color: ui.text3 },
  ackSous: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 3 },
  warn: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: ui.warnBg, borderWidth: 1, borderColor: ui.warnBorder },
  warnText: { fontSize: 14, lineHeight: 19, color: ui.warnText, ...fonts.regular },
});
