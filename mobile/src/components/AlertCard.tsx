import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import type { Alert } from '../api/types';
import { formatValue, relativeTime, SEVERITY_LABEL } from '../logic/format';
import { motion, space, useTheme } from '../theme/tokens';
import { ConfidenceMeter, RiskIcon, SeverityBadge, SourceChips } from './Badges';
import { Card } from './Card';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';

export function AlertCard({ alert, now, compact }: { alert: Alert; now: number; compact?: boolean }) {
  const { c, severity } = useTheme();
  const reduced = useReducedMotion();
  // Entrada curta (fade + 8px) só quando o card aparece — não a cada atualização.
  const enter = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: motion.base, useNativeDriver: true }).start();
  }, [enter]);

  const critical = alert.severity === 'CRITICAL';
  const label = `${alert.title}. Severidade ${SEVERITY_LABEL[alert.severity]}. ${formatValue(alert.latestValue, alert.unit)}. `
    + `Prioridade ${Math.round(alert.priorityScore)} de 100. Atualizado ${relativeTime(alert.updatedAt, now)}.`;

  return (
    <Animated.View style={{ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      <Pressable
        onPress={() => router.push({ pathname: '/alert/[id]', params: { id: String(alert.id) } })}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Abre os detalhes do alerta"
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        <Card style={[critical && { borderColor: severity.CRITICAL.bg, borderWidth: 2 }]}>
          <View style={styles.head}>
            <RiskIcon type={alert.riskType} />
            <View style={styles.titleCol}>
              <Text variant="heading" numberOfLines={2}>{alert.title}</Text>
              <Text variant="caption" muted>
                {formatValue(alert.latestValue, alert.unit)} · atualizado {relativeTime(alert.updatedAt, now)}
              </Text>
            </View>
            <View style={styles.score} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Text variant="title" color={c.foreground}>{Math.round(alert.priorityScore)}</Text>
              <Text variant="caption" muted>prioridade</Text>
            </View>
          </View>
          <View style={styles.row}>
            <SeverityBadge severity={alert.severity} />
            <SourceChips sources={alert.sources} />
          </View>
          {!compact && <ConfidenceMeter value={alert.confidence} />}
          {!compact && alert.factors[0] && (
            <View style={styles.factor}>
              <Ionicons name="analytics" size={16} color={c.mutedForeground} />
              <Text variant="caption" muted numberOfLines={2} style={{ flex: 1 }}>
                {alert.factors.slice(0, 2).join(' · ')}
              </Text>
            </View>
          )}
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  titleCol: { flex: 1, gap: 2 },
  score: { alignItems: 'flex-end' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  factor: { flexDirection: 'row', gap: space.xs, alignItems: 'flex-start' },
});
