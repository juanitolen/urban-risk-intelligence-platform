import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, FeColorMatrix, FeComposite, FeGaussianBlur, Filter, G } from 'react-native-svg';
import type { RiskType } from '../api/types';
import { useLiveData } from '../state/LiveData';
import { radius, space, springs, useTheme } from '../theme/tokens';
import { Glass } from './Glass';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';

type Action = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  run: () => void;
};

const FAB = 60;
const ITEM = 50;
const GAP = 66;
const W = 110;

/**
 * Menu gooey (metaball): os botões "escorrem" do botão principal como gotas.
 * O efeito vem de um filtro SVG (blur + matriz de alfa) aplicado às bolhas; os ícones ficam
 * por cima, fora do filtro, para continuarem nítidos. Spring com leve bounce: é uma ação rara.
 */
export function GooeyMenu() {
  const { c } = useTheme();
  const { refresh } = useLiveData();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const [p, setP] = useState(0);

  useEffect(() => {
    const id = progress.addListener(({ value }) => setP(value));
    return () => progress.removeListener(id);
  }, [progress]);

  const toggle = (next = !open) => {
    setOpen(next);
    if (reduced) progress.setValue(next ? 1 : 0);
    else Animated.spring(progress, { toValue: next ? 1 : 0, ...springs.gooey }).start();
    AccessibilityInfo.announceForAccessibility(next ? 'Menu de ações aberto' : 'Menu de ações fechado');
  };

  const report = (risk: RiskType) => () => router.navigate({ pathname: '/report', params: { risk } });
  const actions: Action[] = [
    { key: 'flood', label: 'Relatar alagamento', icon: 'water', run: report('FLOOD') },
    { key: 'heat', label: 'Relatar calor extremo', icon: 'thermometer', run: report('HEAT_ISLAND') },
    { key: 'outage', label: 'Relatar falta de serviço', icon: 'flash-off', run: report('SERVICE_OUTAGE') },
    { key: 'refresh', label: 'Atualizar agora', icon: 'refresh', run: refresh },
  ];

  const H = FAB + actions.length * GAP + 30;
  const cx = W - FAB / 2 - 10;
  const cy = H - FAB / 2 - 10;
  // Cada gota sai um pouco depois da anterior.
  const itemP = (i: number) => Math.max(0, Math.min(1.15, (p - i * 0.07) / (1 - 0.21)));
  const itemY = (i: number) => cy - itemP(i) * (i + 1) * GAP;
  const labelOpacity = Math.max(0, Math.min(1, (p - 0.55) / 0.4));
  const bottom = Math.max(insets.bottom, space.md) + 76 + space.md;

  return (
    <>
      {(open || p > 0.01) && (
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim, opacity: Math.min(1, p) }]}
          onPress={() => toggle(false)}
          accessibilityRole="button"
          accessibilityLabel="Fechar menu de ações"
        />
      )}
      <View pointerEvents="box-none" style={[styles.anchor, { bottom: bottom - 10, width: W, height: H }]}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <Filter id="goo" x="-50%" y="-50%" width="200%" height="200%">
              <FeGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
              <FeColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo" />
              <FeComposite in="SourceGraphic" in2="goo" operator="atop" />
            </Filter>
          </Defs>
          <G filter="url(#goo)">
            {actions.map((a, i) => (
              <Circle key={a.key} cx={cx} cy={itemY(i)} r={(ITEM / 2) * (0.6 + 0.4 * Math.min(1, itemP(i)))} fill={c.accent} />
            ))}
            <Circle cx={cx} cy={cy} r={FAB / 2} fill={c.accent} />
          </G>
        </Svg>

        {actions.map((a, i) => (
          <View key={a.key} pointerEvents={open ? 'box-none' : 'none'}
            style={[styles.itemRow, { top: itemY(i) - ITEM / 2, right: W - cx - ITEM / 2, opacity: Math.min(1, itemP(i)) }]}>
            <View style={{ opacity: labelOpacity }} pointerEvents="none">
              <Glass rounded={radius.pill} strong contentStyle={styles.label}>
                <Text variant="label" numberOfLines={1}>{a.label}</Text>
              </Glass>
            </View>
            <Pressable
              onPress={() => { toggle(false); a.run(); }}
              accessibilityRole="button"
              accessibilityLabel={a.label}
              accessibilityElementsHidden={!open}
              importantForAccessibility={open ? 'yes' : 'no-hide-descendants'}
              style={({ pressed }) => [styles.item, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name={a.icon} size={22} color={c.onAccent} />
            </Pressable>
          </View>
        ))}

        <Pressable
          onPress={() => toggle()}
          accessibilityRole="button"
          accessibilityLabel={open ? 'Fechar menu de ações' : 'Abrir menu de ações'}
          accessibilityState={{ expanded: open }}
          style={[styles.fab, { left: cx - FAB / 2, top: cy - FAB / 2 }]}
        >
          <View style={{ transform: [{ rotate: `${Math.min(1, p) * 45}deg` }] }}>
            <Ionicons name="add" size={32} color={c.onAccent} />
          </View>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', right: space.sm },
  fab: { position: 'absolute', width: FAB, height: FAB, borderRadius: FAB / 2, alignItems: 'center', justifyContent: 'center' },
  itemRow: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: space.sm },
  item: { width: ITEM, height: ITEM, borderRadius: ITEM / 2, alignItems: 'center', justifyContent: 'center' },
  label: { paddingHorizontal: space.md, paddingVertical: 6 },
});
