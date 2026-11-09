import { StyleSheet, View } from 'react-native';
import type { Alert } from '../api/types';
import { radius, space, useTheme } from '../theme/tokens';
import { SeverityBadge } from './Badges';
import { Text } from './Text';

/**
 * No navegador o react-native-maps não está disponível: desenhamos uma grade esquemática
 * da cidade com os alertas posicionados pelas coordenadas.
 */
const BOUNDS = { minLat: -23.72, maxLat: -23.44, minLng: -46.83, maxLng: -46.40 };

export function EventsMap({ alerts }: { alerts: Alert[] }) {
  const { c } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: c.muted, borderColor: c.border }]}>
      <Text variant="caption" muted style={styles.note}>Mapa esquemático (versão web). No celular, o mapa é interativo.</Text>
      {alerts.map((a) => {
        const top = ((BOUNDS.maxLat - a.latitude) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
        const left = ((a.longitude - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
        return (
          <View key={a.id} style={[styles.pin, { top: `${top}%`, left: `${left}%` }]}>
            <SeverityBadge severity={a.severity} />
            <Text variant="caption">{a.region}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 360, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  note: { padding: space.md },
  pin: { position: 'absolute', transform: [{ translateX: -30 }, { translateY: -12 }], alignItems: 'center' },
});
