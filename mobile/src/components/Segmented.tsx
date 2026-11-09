import { Pressable, StyleSheet, View } from 'react-native';
import { radius, space, useTheme } from '../theme/tokens';
import { Text } from './Text';

export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { c } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: c.muted }]} accessibilityRole="tablist" accessibilityLabel={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.item, active && { backgroundColor: c.card, borderColor: c.borderStrong }]}
          >
            <Text variant="label" color={active ? c.foreground : c.mutedForeground}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function FilterChips<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.chips} accessibilityLabel={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={o.label}
            style={[styles.chip, { borderColor: active ? c.accent : c.borderStrong, backgroundColor: active ? c.accent : c.card }]}
          >
            <Text variant="label" color={active ? c.onAccent : c.foreground}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: radius.md, padding: 4, gap: 4 },
  item: { flex: 1, minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 44, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
});
