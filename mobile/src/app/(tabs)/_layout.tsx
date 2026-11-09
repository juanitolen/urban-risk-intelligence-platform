import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { GlassTabBar } from '../../components/GlassTabBar';
import { GooeyMenu } from '../../components/GooeyMenu';
import { useLiveData } from '../../state/LiveData';

export default function TabsLayout() {
  const { alerts } = useLiveData();
  const urgent = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <GlassTabBar {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Painel' }} />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Eventos',
            tabBarBadge: urgent > 0 ? urgent : undefined,
            tabBarAccessibilityLabel: urgent > 0 ? `Eventos, ${urgent} alertas urgentes` : 'Eventos',
          }}
        />
        <Tabs.Screen name="report" options={{ title: 'Relatar' }} />
        <Tabs.Screen name="settings" options={{ title: 'Ajustes' }} />
      </Tabs>
      <GooeyMenu />
    </View>
  );
}
