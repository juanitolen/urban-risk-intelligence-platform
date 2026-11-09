import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { radius, space, springs, useTheme } from '../theme/tokens';
import { Glass } from './Glass';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';

const PAD = 4;

/** Controle segmentado de vidro com a mesma pílula deslizante da tab bar. */
export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const segW = width ? (width - PAD * 2) / options.length : 0;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const x = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    if (!segW) return;
    if (first.current || reduced) { x.setValue(index * segW); first.current = false; }
    else Animated.spring(x, { toValue: index * segW, ...springs.pill }).start();
  }, [index, segW, reduced, x]);

  return (
    <Glass rounded={radius.pill} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.wrap} accessibilityRole="tablist" accessibilityLabel={label}>
        {segW > 0 && (
          <Animated.View pointerEvents="none"
            style={[styles.pill, { width: segW, backgroundColor: c.accent, transform: [{ translateX: x }] }]} />
        )}
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="tab"
              accessibilityState={{ selected: active }} style={styles.item}>
              <Text variant="label" color={active ? c.onAccent : c.foreground}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Glass>
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
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="radio"
            accessibilityState={{ checked: active }} accessibilityLabel={o.label}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
            <Glass rounded={radius.pill} fill={active ? c.accent : undefined} borderColor={active ? c.accent : undefined}
              contentStyle={styles.chip}>
              <Text variant="label" color={active ? c.onAccent : c.foreground}>{o.label}</Text>
            </Glass>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', padding: PAD },
  pill: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: radius.pill },
  item: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: { minHeight: 44, paddingHorizontal: space.md, justifyContent: 'center' },
});
