import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { RiskType } from '../../api/types';
import { AlertCard } from '../../components/AlertCard';
import { RiskIcon, SeverityBadge } from '../../components/Badges';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { LiveIndicator } from '../../components/LiveIndicator';
import { Screen } from '../../components/Screen';
import { Text } from '../../components/Text';
import { formatValue, percent, relativeTime, RESIDENT_ADVICE, RISK_LABEL, SOURCE_LABEL } from '../../logic/format';
import { useLiveData, useNow } from '../../state/LiveData';
import { space, useTheme } from '../../theme/tokens';

export default function Dashboard() {
  const { dashboard, alerts, observations, settings, connection } = useLiveData();
  const { c } = useTheme();
  const now = useNow();
  const top = alerts[0];
  const agent = settings.profile === 'agent';

  if (!dashboard && connection.status !== 'online') {
    return (
      <Screen title="Painel" subtitle={<LiveIndicator />}>
        <EmptyState
          icon="cloud-download"
          title={connection.status === 'offline' ? 'Não foi possível conectar' : 'Conectando ao servidor…'}
          body={`Servidor: ${settings.apiUrl}. Verifique se o backend está rodando ou ajuste o endereço em Ajustes.`}
        />
      </Screen>
    );
  }

  const critical = dashboard?.bySeverity.CRITICAL ?? 0;
  const high = dashboard?.bySeverity.HIGH ?? 0;

  return (
    <Screen title="Painel" subtitle={<LiveIndicator />}>
      {/* Resposta para "estou em risco agora?" antes de qualquer número. */}
      <Card style={[styles.status, { backgroundColor: critical > 0 ? c.dangerSurface : high > 0 ? c.warningSurface : c.successSurface, borderColor: 'transparent' }]}>
        <Ionicons name={critical > 0 ? 'warning' : high > 0 ? 'alert-circle' : 'shield-checkmark'} size={28}
          color={critical > 0 ? c.danger : high > 0 ? c.warning : c.success} />
        <View style={{ flex: 1 }}>
          <Text variant="heading">
            {critical > 0 ? `${critical} alerta(s) crítico(s) agora` : high > 0 ? `${high} alerta(s) de nível alto` : 'Nenhum alerta grave no momento'}
          </Text>
          <Text variant="caption" muted>
            {dashboard?.activeAlerts ?? 0} alerta(s) ativo(s) na cidade · ordenados por prioridade
          </Text>
        </View>
      </Card>

      {top && (
        <View style={styles.section}>
          <Text variant="label" muted accessibilityRole="header">MAIS URGENTE</Text>
          <AlertCard alert={top} now={now} />
          <Card style={{ backgroundColor: c.muted, borderColor: 'transparent' }}>
            <Text variant="bodyBold">O que fazer</Text>
            <Text>{RESIDENT_ADVICE[top.riskType]}</Text>
          </Card>
        </View>
      )}

      <View style={styles.tiles}>
        <Tile label="Alertas ativos" value={String(dashboard?.activeAlerts ?? 0)} />
        <Tile label="Confiança média" value={percent(dashboard?.averageConfidence ?? 0)} />
        <Tile label="Registros na última hora" value={String(dashboard?.observationsLastHour ?? 0)} />
        <Tile label="Último dado" value={relativeTime(dashboard?.lastObservationAt, now)} />
      </View>

      <View style={styles.section}>
        <Text variant="label" muted accessibilityRole="header">POR TIPO DE RISCO</Text>
        <Card>
          {(Object.keys(RISK_LABEL) as RiskType[]).map((t) => {
            const count = dashboard?.byRiskType[t] ?? 0;
            const worst = alerts.find((a) => a.riskType === t);
            return (
              <Pressable key={t} onPress={() => router.push('/events')} accessibilityRole="button"
                accessibilityLabel={`${RISK_LABEL[t]}: ${count} alertas ativos`}
                style={({ pressed }) => [styles.riskRow, { opacity: pressed ? 0.7 : 1 }]}>
                <RiskIcon type={t} size={18} />
                <Text variant="bodyBold" style={{ flex: 1 }}>{RISK_LABEL[t]}</Text>
                {worst && <SeverityBadge severity={worst.severity} />}
                <Text variant="heading">{count}</Text>
              </Pressable>
            );
          })}
        </Card>
      </View>

      {agent && (
        <View style={styles.section}>
          <Text variant="label" muted accessibilityRole="header">FONTES CONECTADAS</Text>
          <Card style={styles.sourceRow}>
            {dashboard && (Object.keys(dashboard.sourcesByType) as (keyof typeof SOURCE_LABEL)[]).map((s) => (
              <View key={s} style={{ flex: 1, alignItems: 'center' }}>
                <Text variant="title">{dashboard.sourcesByType[s]}</Text>
                <Text variant="caption" muted>{SOURCE_LABEL[s]}</Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={styles.section}>
        <Text variant="label" muted accessibilityRole="header">ÚLTIMOS REGISTROS RECEBIDOS</Text>
        <Card style={{ gap: 0, paddingVertical: space.sm }}>
          {observations.slice(0, agent ? 12 : 6).map((o, i) => (
            <View key={o.id} style={[styles.obs, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}
              accessible accessibilityLabel={`${RISK_LABEL[o.riskType]} em ${o.region}, ${formatValue(o.value, o.unit)}, origem ${SOURCE_LABEL[o.source.type]}, confiança ${percent(o.confidence)}, ${relativeTime(o.receivedAt, now)}`}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyBold">{RISK_LABEL[o.riskType]} · {o.region}</Text>
                <Text variant="caption" muted numberOfLines={1}>
                  {SOURCE_LABEL[o.source.type]} · {o.source.name}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="bodyBold">{formatValue(o.value, o.unit)}</Text>
                <Text variant="caption" muted>{percent(o.confidence)} · {relativeTime(o.receivedAt, now)}</Text>
              </View>
            </View>
          ))}
          {observations.length === 0 && <Text muted style={{ padding: space.md }}>Nenhum registro ainda.</Text>}
        </Card>
      </View>
    </Screen>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="title">{value}</Text>
      <Text variant="caption" muted>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  section: { gap: space.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tile: { flexBasis: '47%', flexGrow: 1, gap: 2 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  sourceRow: { flexDirection: 'row' },
  obs: { flexDirection: 'row', gap: space.md, paddingVertical: space.sm, alignItems: 'center' },
});
