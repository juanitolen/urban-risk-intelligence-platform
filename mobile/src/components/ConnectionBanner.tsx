import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from 'react-native';
import { nextDelay } from '../logic/connection';
import { clockTime } from '../logic/format';
import { useLiveData, useNow } from '../state/LiveData';
import { motion, radius, space, useTheme } from '../theme/tokens';
import { Text } from './Text';
import { useReducedMotion } from './useReducedMotion';

type Mode = 'hidden' | 'offline' | 'unstable' | 'reconnected';

/**
 * Faixa de estado da conexão, fixa no topo de todas as telas.
 * - Desconectado: diz desde quando, de quando são os dados exibidos e quando será a próxima tentativa.
 * - Reconectado: confirma e some sozinha em 3 s.
 * Anuncia as mudanças para leitores de tela.
 */
export function ConnectionBanner() {
  const { connection, savedAt, refresh, ackReconnected, pendingReports } = useLiveData();
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const now = useNow();

  const mode: Mode = connection.justReconnected
    ? 'reconnected'
    : connection.status === 'offline'
      ? 'offline'
      : connection.status === 'unstable'
        ? 'unstable'
        : 'hidden';

  // Mantém o último conteúdo durante a animação de saída.
  const [shown, setShown] = useState<Mode>(mode);
  const anim = useRef(new Animated.Value(mode === 'hidden' ? 0 : 1)).current;

  useEffect(() => {
    if (mode !== 'hidden') setShown(mode);
    Animated.timing(anim, {
      toValue: mode === 'hidden' ? 0 : 1,
      duration: reduced ? 0 : motion.base,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && mode === 'hidden') setShown('hidden');
    });
    if (mode === 'offline') AccessibilityInfo.announceForAccessibility('Sem conexão com o servidor. Mostrando os últimos dados salvos.');
    if (mode === 'reconnected') AccessibilityInfo.announceForAccessibility('Conexão restabelecida. Dados atualizados.');
  }, [mode, anim, reduced]);

  useEffect(() => {
    if (mode !== 'reconnected') return;
    const t = setTimeout(ackReconnected, 3000);
    return () => clearTimeout(t);
  }, [mode, ackReconnected]);

  if (shown === 'hidden') return null;

  const retryAt = (connection.lastAttemptAt ?? now) + nextDelay(connection.consecutiveFailures);
  const retryIn = Math.max(0, Math.ceil((retryAt - now) / 1000));

  const look = {
    offline: { bg: c.dangerSurface, fg: c.danger, icon: 'cloud-offline' as const },
    unstable: { bg: c.warningSurface, fg: c.warning, icon: 'cellular' as const },
    reconnected: { bg: c.successSurface, fg: c.success, icon: 'checkmark-circle' as const },
  }[shown];

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }}
    >
      <View
        style={[styles.banner, { backgroundColor: look.bg, borderColor: look.fg }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Ionicons name={look.icon} size={22} color={look.fg} />
        <View style={styles.textCol}>
          {shown === 'offline' && (
            <>
              <Text variant="bodyBold" color={look.fg}>Sem conexão com o servidor</Text>
              <Text variant="caption" color={c.foreground}>
                {savedAt ? `Mostrando dados salvos às ${clockTime(savedAt)}. ` : 'Ainda sem dados salvos. '}
                {connection.deviceOffline ? 'Seu aparelho está sem internet.' : `Nova tentativa em ${retryIn} s.`}
                {pendingReports > 0 ? ` ${pendingReports} relato(s) aguardando envio.` : ''}
              </Text>
            </>
          )}
          {shown === 'unstable' && (
            <Text variant="bodyBold" color={look.fg}>Conexão instável, tentando de novo…</Text>
          )}
          {shown === 'reconnected' && (
            <Text variant="bodyBold" color={look.fg}>Conexão restabelecida · dados atualizados</Text>
          )}
        </View>
        {shown === 'offline' && !connection.deviceOffline && (
          <Pressable
            onPress={refresh}
            accessibilityRole="button"
            accessibilityLabel="Tentar conectar agora"
            hitSlop={8}
            style={({ pressed }) => [styles.retry, { borderColor: look.fg, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text variant="label" color={look.fg}>Tentar</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginTop: space.sm,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  textCol: { flex: 1, gap: 2 },
  retry: { minHeight: 44, minWidth: 64, borderWidth: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.md },
});
