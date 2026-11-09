import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { relativeTime } from '../logic/format';
import { useLiveData, useNow } from '../state/LiveData';
import { space, useTheme } from '../theme/tokens';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';

/** "Ao vivo · atualizado há 3 s · 84 ms" — o indicador de tempo de atualização. */
export function LiveIndicator() {
  const { connection, savedAt } = useLiveData();
  const { c } = useTheme();
  const now = useNow();
  const reduced = useReducedMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  const live = connection.status === 'online';

  useEffect(() => {
    if (!live || reduced) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [live, reduced, pulse]);

  const color = live ? c.success : connection.status === 'offline' ? c.danger : c.warning;
  const label = live ? 'Ao vivo' : connection.status === 'offline' ? 'Desconectado' : connection.status === 'connecting' ? 'Conectando' : 'Instável';
  const updated = relativeTime(connection.lastSuccessAt ?? savedAt, now);

  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}. Atualizado ${updated}.`}>
      <Animated.View style={[styles.dot, { backgroundColor: color, opacity: pulse }]} />
      <Text variant="label" color={color}>{label}</Text>
      <Text variant="caption" muted>
        · atualizado {updated}
        {live && connection.latencyMs != null ? ` · ${connection.latencyMs} ms` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
