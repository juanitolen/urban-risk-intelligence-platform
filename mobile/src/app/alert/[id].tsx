import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { Alert } from '../../api/types';
import { ConfidenceMeter, RiskIcon, SeverityBadge, SourceChips } from '../../components/Badges';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConnectionBanner } from '../../components/ConnectionBanner';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Text';
import { clockTime, formatValue, relativeTime, RESIDENT_ADVICE } from '../../logic/format';
import { useLiveData, useNow } from '../../state/LiveData';
import { space, useTheme } from '../../theme/tokens';

export default function AlertDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alerts, client, settings, resolveAlert, connection } = useLiveData();
  const { c } = useTheme();
  const now = useNow();
  const fromList = alerts.find((a) => String(a.id) === id);
  const [fetched, setFetched] = useState<Alert | null>(null);
  const [busy, setBusy] = useState(false);

  // Se o alerta não está na lista ativa (ex.: veio de notificação e já foi resolvido), busca direto.
  useEffect(() => {
    if (!fromList && id) client.alert(Number(id)).then(setFetched).catch(() => {});
  }, [fromList, id, client]);

  const alert = fromList ?? fetched;
  if (!alert) {
    return <EmptyState icon="search" title="Alerta não encontrado" body="Ele pode ter sido encerrado ou o servidor está fora do ar." />;
  }

  const resolve = async () => {
    setBusy(true);
    try {
      await resolveAlert(alert.id);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <ConnectionBanner />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <RiskIcon type={alert.riskType} size={28} />
          <View style={{ flex: 1, gap: space.xs }}>
            <Text variant="title" accessibilityRole="header">{alert.title}</Text>
            <SeverityBadge severity={alert.severity} large />
          </View>
        </View>

        {alert.status === 'RESOLVED' && (
          <Card style={{ backgroundColor: c.successSurface, borderColor: c.success }}>
            <Text variant="bodyBold" color={c.success}>Encerrado {relativeTime(alert.resolvedAt, now)}</Text>
          </Card>
        )}

        <Card style={{ backgroundColor: c.muted, borderColor: 'transparent' }}>
          <Text variant="bodyBold">O que fazer</Text>
          <Text>{RESIDENT_ADVICE[alert.riskType]}</Text>
        </Card>

        <View style={styles.tiles}>
          <Card style={styles.tile}><Text variant="title">{formatValue(alert.latestValue, alert.unit)}</Text><Text variant="caption" muted>Agora</Text></Card>
          <Card style={styles.tile}><Text variant="title">{formatValue(alert.peakValue, alert.unit)}</Text><Text variant="caption" muted>Pico</Text></Card>
          <Card style={styles.tile}><Text variant="title">{Math.round(alert.priorityScore)}</Text><Text variant="caption" muted>Prioridade (0–100)</Text></Card>
        </View>

        <Card>
          <Text variant="bodyBold">Por que esta prioridade?</Text>
          <Text variant="caption" muted>Análise automática que combina intensidade, variação anômala, tendência, vulnerabilidade da região e confiança.</Text>
          {(settings.profile === 'agent' ? alert.factors : alert.factors.slice(0, 3)).map((f) => (
            <View key={f} style={styles.factor}>
              <Ionicons name="checkmark" size={18} color={c.accent} />
              <Text style={{ flex: 1 }}>{f}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text variant="bodyBold">Origem dos dados</Text>
          <SourceChips sources={alert.sources} />
          {alert.primarySource && <Text variant="caption" muted>Fonte principal: {alert.primarySource}</Text>}
          <Text variant="caption" muted>{alert.observationCount} registro(s) na última hora</Text>
          <ConfidenceMeter value={alert.confidence} />
        </Card>

        <Text variant="caption" muted>
          Aberto às {clockTime(alert.createdAt)} · atualizado {relativeTime(alert.updatedAt, now)}
        </Text>

        {settings.profile === 'agent' && alert.status === 'ACTIVE' && (
          <Button kind="danger" icon="checkmark-done" label="Marcar como resolvido" onPress={resolve} loading={busy}
            disabled={connection.status !== 'online'}
            accessibilityHint="Encerra o alerta para todos os usuários" />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl },
  head: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, gap: 2, padding: space.md },
  factor: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
});
