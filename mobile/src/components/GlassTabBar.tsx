import Ionicons from '@expo/vector-icons/Ionicons';
import type { BottomTabBarProps } from 'expo-router/build/layouts/Tabs';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { font, radius, space, springs, useTheme } from '../theme/tokens';
import { Glass } from './Glass';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';

const ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  index: 'speedometer',
  events: 'map',
  report: 'megaphone',
  settings: 'settings',
};

const PAD = 6;

/**
 * Tab bar de vidro flutuante com "sliding pill": uma pílula sólida desliza até a aba ativa.
 * Spring sem overshoot (navegação é uma ação frequente), instantâneo com "reduzir movimento".
 */
export function GlassTabBar({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const tabW = width > 0 ? (width - PAD * 2) / count : 0;
  const x = useRef(new Animated.Value(0)).current;
  const first = useRef(true);

  useEffect(() => {
    if (!tabW) return;
    const to = state.index * tabW;
    if (first.current || reduced) {
      x.setValue(to);
      first.current = false;
    } else {
      Animated.spring(x, { toValue: to, ...springs.pill }).start();
    }
  }, [state.index, tabW, reduced, x]);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, space.md) }]}>
      <Glass rounded={radius.pill} strong intensity={60} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={styles.row} accessibilityRole="tablist">
          {tabW > 0 && (
            <Animated.View
              style={[styles.pill, { width: tabW, backgroundColor: c.accent, transform: [{ translateX: x }] }]}
              pointerEvents="none"
            />
          )}
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = index === state.index;
            const label = options.title ?? route.name;
            const color = focused ? c.onAccent : c.mutedForeground;
            const badge = options.tabBarBadge;
            const onPress = () => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            };
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                style={styles.tab}
              >
                <View>
                  <Ionicons name={ICONS[route.name] ?? 'ellipse'} size={22} color={color} />
                  {badge != null && (
                    <View style={[styles.badge, { backgroundColor: c.danger, borderColor: focused ? c.accent : c.card }]}>
                      <Text variant="caption" color="#FFFFFF" style={styles.badgeText}>{String(badge)}</Text>
                    </View>
                  )}
                </View>
                <Text variant="label" color={color} style={styles.label} numberOfLines={1}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.lg, right: space.lg },
  row: { flexDirection: 'row', padding: PAD },
  pill: { position: 'absolute', top: PAD, bottom: PAD, left: PAD, borderRadius: radius.pill },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: font.bold, fontSize: 12, lineHeight: 16 },
  badge: { position: 'absolute', top: -6, right: -12, minWidth: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { fontSize: 11, lineHeight: 14, fontFamily: font.bold },
});
