import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
  useFonts,
} from '@expo-google-fonts/atkinson-hyperlegible';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LiveDataProvider } from '../state/LiveData';
import { onNotificationTap } from '../state/notifications';
import { font, useTheme } from '../theme/tokens';

export default function RootLayout() {
  const [loaded] = useFonts({ AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold });
  const { c, scheme } = useTheme();

  useEffect(() => onNotificationTap((id) => router.push({ pathname: '/alert/[id]', params: { id: String(id) } })), []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.background }}>
        <ActivityIndicator color={c.accent} accessibilityLabel="Carregando" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LiveDataProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bgGradient[0] },
            headerShadowVisible: false,
            headerTintColor: c.foreground,
            headerTitleStyle: { fontFamily: font.bold },
            contentStyle: { backgroundColor: c.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="alert/[id]" options={{ title: 'Detalhe do alerta', headerBackTitle: 'Voltar' }} />
        </Stack>
      </LiveDataProvider>
    </SafeAreaProvider>
  );
}
