import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import type { Alert } from '../api/types';
import { formatValue, SEVERITY_LABEL } from '../logic/format';
import { radius, useTheme } from '../theme/tokens';

const SAO_PAULO = { latitude: -23.56, longitude: -46.63, latitudeDelta: 0.35, longitudeDelta: 0.35 };
const RADIUS_M = { LOW: 400, MODERATE: 700, HIGH: 1000, CRITICAL: 1400 } as const;

export function EventsMap({ alerts }: { alerts: Alert[] }) {
  const { severity } = useTheme();
  return (
    <View style={styles.wrap} accessibilityLabel={`Mapa com ${alerts.length} alertas ativos. A lista ao lado tem o mesmo conteúdo.`}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={SAO_PAULO} showsUserLocation={false} toolbarEnabled={false}>
        {alerts.map((a) => (
          <Circle
            key={`c-${a.id}`}
            center={{ latitude: a.latitude, longitude: a.longitude }}
            radius={RADIUS_M[a.severity]}
            fillColor={`${severity[a.severity === 'CRITICAL' ? 'CRITICAL' : a.severity].fg}33`}
            strokeColor={severity[a.severity].fg}
            strokeWidth={1}
          />
        ))}
        {alerts.map((a) => (
          <Marker
            key={a.id}
            coordinate={{ latitude: a.latitude, longitude: a.longitude }}
            title={`${SEVERITY_LABEL[a.severity]} · ${a.title}`}
            description={`${formatValue(a.latestValue, a.unit)} · prioridade ${Math.round(a.priorityScore)} · toque para detalhes`}
            pinColor={a.severity === 'CRITICAL' ? 'red' : a.severity === 'HIGH' ? 'orange' : a.severity === 'MODERATE' ? 'yellow' : 'green'}
            onCalloutPress={() => router.push({ pathname: '/alert/[id]', params: { id: String(a.id) } })}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 360, borderRadius: radius.lg, overflow: 'hidden' },
});
