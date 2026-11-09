import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useLiveData } from '../../state/LiveData';
import { font, useTheme } from '../../theme/tokens';

export default function TabsLayout() {
  const { c } = useTheme();
  const { alerts } = useLiveData();
  const urgent = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.mutedForeground,
        tabBarStyle: { backgroundColor: c.card, borderTopColor: c.border, minHeight: 60 },
        tabBarLabelStyle: { fontFamily: font.bold, fontSize: 12 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Painel', tabBarIcon: ({ color, size }) => <Ionicons name="speedometer" size={size} color={color as string} /> }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Eventos',
          tabBarBadge: urgent > 0 ? urgent : undefined,
          tabBarAccessibilityLabel: urgent > 0 ? `Eventos, ${urgent} alertas urgentes` : 'Eventos',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color as string} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{ title: 'Relatar', tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" size={size} color={color as string} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Ajustes', tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color as string} /> }}
      />
    </Tabs>
  );
}
