import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import type { RiskType, Severity, SourceType } from '../api/types';
import { confidenceLabel, percent, RISK_LABEL, SEVERITY_LABEL, SOURCE_LABEL } from '../logic/format';
import { radius, RISK_ICON, SEVERITY_ICON, space, useTheme } from '../theme/tokens';
import { Text } from './Text';

export function SeverityBadge({ severity, large }: { severity: Severity; large?: boolean }) {
  const { severity: sev } = useTheme();
  const { fg, bg } = sev[severity];
  return (
    <View
      style={[styles.badge, { backgroundColor: bg }, large && styles.large]}
      accessible
      accessibilityLabel={`Severidade ${SEVERITY_LABEL[severity]}`}
    >
      <Ionicons name={SEVERITY_ICON[severity]} size={large ? 18 : 14} color={fg} />
      <Text variant="label" color={fg}>{SEVERITY_LABEL[severity]}</Text>
    </View>
  );
}

export function RiskIcon({ type, size = 22 }: { type: RiskType; size?: number }) {
  const { c } = useTheme();
  return (
    <View
      style={[styles.riskIcon, { backgroundColor: c.muted, width: size + 18, height: size + 18 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name={RISK_ICON[type]} size={size} color={c.accent} />
    </View>
  );
}

export function RiskLabel({ type }: { type: RiskType }) {
  return <Text variant="label" muted>{RISK_LABEL[type]}</Text>;
}

const SOURCE_ICON: Record<SourceType, 'hardware-chip' | 'server' | 'people'> = {
  SENSOR: 'hardware-chip',
  PUBLIC_DATASET: 'server',
  COMMUNITY: 'people',
};

export function SourceChips({ sources }: { sources: SourceType[] }) {
  const { c } = useTheme();
  return (
    <View style={styles.chips} accessible accessibilityLabel={`Origem: ${sources.map((s) => SOURCE_LABEL[s]).join(', ')}`}>
      {sources.map((s) => (
        <View key={s} style={[styles.chip, { borderColor: c.borderStrong }]}>
          <Ionicons name={SOURCE_ICON[s]} size={14} color={c.mutedForeground} />
          <Text variant="caption" muted>{SOURCE_LABEL[s]}</Text>
        </View>
      ))}
    </View>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const { c } = useTheme();
  const color = value >= 0.8 ? c.success : value >= 0.55 ? c.warning : c.danger;
  return (
    <View
      style={styles.meter}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Confiança ${confidenceLabel(value)}, ${percent(value)}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <View style={styles.meterHead}>
        <Text variant="caption" muted>Confiança</Text>
        <Text variant="label">{confidenceLabel(value)} · {percent(value)}</Text>
      </View>
      <View style={[styles.track, { backgroundColor: c.muted }]}>
        <View style={[styles.fill, { width: `${Math.round(value * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  large: { paddingHorizontal: 12, paddingVertical: 6 },
  riskIcon: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  meter: { gap: 4 },
  meterHead: { flexDirection: 'row', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
