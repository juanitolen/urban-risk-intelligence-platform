import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { AlertChange } from '../logic/alertDiff';
import { formatValue, RESIDENT_ADVICE, SEVERITY_LABEL } from '../logic/format';

const CHANNEL = 'alerts';
const isWeb = Platform.OS === 'web';

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function setupNotifications(): Promise<boolean> {
  if (isWeb) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: 'Alertas de risco',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#B91C1C',
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function notifyAlert({ alert, kind }: AlertChange): Promise<void> {
  if (isWeb) return;
  const prefix = kind === 'new' ? 'Novo alerta' : 'Alerta piorou';
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${prefix} · ${SEVERITY_LABEL[alert.severity]}: ${alert.title}`,
        body: `${formatValue(alert.latestValue, alert.unit)} agora. ${RESIDENT_ADVICE[alert.riskType]}`,
        data: { alertId: alert.id },
      },
      trigger: Platform.OS === 'android' ? { channelId: CHANNEL } : null,
    });
  } catch {
    /* sem permissão: o alerta continua visível dentro do app */
  }
}

/** Abre o detalhe do alerta quando a pessoa toca na notificação. */
export function onNotificationTap(handler: (alertId: number) => void): () => void {
  if (isWeb) return () => {};
  const sub = Notifications.addNotificationResponseReceivedListener((res) => {
    const id = res.notification.request.content.data?.alertId;
    if (typeof id === 'number') handler(id);
  });
  return () => sub.remove();
}
