import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { ApiClient, ApiError, defaultApiUrl } from '../api/client';
import type { Alert, CommunityReport, Dashboard, Observation } from '../api/types';
import { diffAlerts, sortByPriority } from '../logic/alertDiff';
import { connectionReducer, initialConnection, nextDelay, type ConnectionState } from '../logic/connection';
import { enqueue, flushQueue, type QueuedReport } from '../logic/reportQueue';
import { notifyAlert, setupNotifications } from './notifications';
import { deviceId, KEYS, load, randomId, save } from './storage';

export type Profile = 'resident' | 'agent';

export interface Settings {
  apiUrl: string;
  profile: Profile;
  notifications: boolean;
}

interface Snapshot {
  dashboard: Dashboard | null;
  alerts: Alert[];
  observations: Observation[];
  savedAt: number | null;
}

interface LiveData extends Snapshot {
  connection: ConnectionState;
  settings: Settings;
  /** true enquanto mostramos dados salvos de antes da queda. */
  stale: boolean;
  pendingReports: number;
  refresh: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  ackReconnected: () => void;
  sendReport: (r: Omit<CommunityReport, 'reporterId'>) => Promise<'sent' | 'queued'>;
  resolveAlert: (id: number) => Promise<void>;
  client: ApiClient;
}

const Ctx = createContext<LiveData | null>(null);

const emptySnapshot: Snapshot = { dashboard: null, alerts: [], observations: [], savedAt: null };

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [connection, dispatch] = useReducer(connectionReducer, initialConnection);
  const [snapshot, setSnapshot] = useState<Snapshot>(emptySnapshot);
  const [settings, setSettings] = useState<Settings>({ apiUrl: defaultApiUrl(), profile: 'resident', notifications: true });
  const [queue, setQueue] = useState<QueuedReport[]>([]);
  const [ready, setReady] = useState(false);

  const client = useRef(new ApiClient(settings.apiUrl)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const failures = useRef(0);
  const previousAlerts = useRef<Alert[] | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const queueRef = useRef(queue);
  queueRef.current = queue;

  // Carrega cache, configurações e fila antes de começar a sincronizar (offline-first).
  useEffect(() => {
    (async () => {
      const [cache, saved, savedQueue] = await Promise.all([
        load<Snapshot>(KEYS.cache),
        load<Settings>(KEYS.settings),
        load<QueuedReport[]>(KEYS.queue),
      ]);
      if (cache) setSnapshot(cache);
      if (saved) {
        setSettings((s) => ({ ...s, ...saved }));
        client.setBaseUrl(saved.apiUrl ?? client.url);
      }
      if (savedQueue) setQueue(savedQueue);
      setReady(true);
      setupNotifications();
    })();
  }, [client]);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const { remaining } = await flushQueue(queueRef.current, (r) => client.report(r),
      (e) => e instanceof ApiError && e.network);
    setQueue(remaining);
    save(KEYS.queue, remaining);
  }, [client]);

  const tick = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const started = Date.now();
    try {
      const [dashboard, alerts, observations] = await Promise.all([
        client.dashboard(),
        client.alerts(),
        client.observations(20),
      ]);
      const now = Date.now();
      const sorted = sortByPriority(alerts.items);
      const next: Snapshot = { dashboard, alerts: sorted, observations: observations.items, savedAt: now };
      setSnapshot(next);
      save(KEYS.cache, next);
      failures.current = 0;
      dispatch({ type: 'success', at: now, latencyMs: now - started });

      const changes = diffAlerts(previousAlerts.current, sorted);
      previousAlerts.current = sorted;
      if (changes.length > 0) {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        if (settingsRef.current.notifications) changes.slice(0, 3).forEach((c) => notifyAlert(c));
      }
      flush();
    } catch {
      failures.current++;
      dispatch({ type: 'failure', at: Date.now() });
    } finally {
      inFlight.current = false;
    }
  }, [client, flush]);

  const schedule = useCallback(
    (delay: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        await tick();
        schedule(nextDelay(failures.current));
      }, delay);
    },
    [tick],
  );

  const refresh = useCallback(() => schedule(0), [schedule]);

  useEffect(() => {
    if (!ready) return;
    // Na primeira carga, os alertas que já existem no cache contam como "vistos".
    previousAlerts.current = snapshot.alerts.length ? snapshot.alerts : null;
    schedule(0);
    const net = NetInfo.addEventListener((s) => {
      const online = s.isConnected !== false;
      dispatch({ type: 'device', online, at: Date.now() });
      if (online) schedule(300);
    });
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') schedule(0);
    });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      net();
      app.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, schedule]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSettings((s) => {
        const merged = { ...s, ...patch };
        save(KEYS.settings, merged);
        if (patch.apiUrl) {
          client.setBaseUrl(patch.apiUrl);
          previousAlerts.current = null;
        }
        return merged;
      });
      if (patch.apiUrl) schedule(0);
    },
    [client, schedule],
  );

  const sendReport = useCallback(
    async (r: Omit<CommunityReport, 'reporterId'>): Promise<'sent' | 'queued'> => {
      const report = { ...r, reporterId: await deviceId() };
      try {
        await client.report(report);
        schedule(500);
        return 'sent';
      } catch (e) {
        if (e instanceof ApiError && !e.network) throw e;
        const q = enqueue(queueRef.current, report, Date.now(), randomId());
        setQueue(q);
        save(KEYS.queue, q);
        return 'queued';
      }
    },
    [client, schedule],
  );

  const resolveAlert = useCallback(
    async (id: number) => {
      await client.resolve(id);
      schedule(0);
    },
    [client, schedule],
  );

  const value = useMemo<LiveData>(
    () => ({
      ...snapshot,
      connection,
      settings,
      stale: connection.status === 'offline' || (connection.status === 'connecting' && snapshot.savedAt != null),
      pendingReports: queue.length,
      refresh,
      updateSettings,
      ackReconnected: () => dispatch({ type: 'ackReconnected' }),
      sendReport,
      resolveAlert,
      client,
    }),
    [snapshot, connection, settings, queue.length, refresh, updateSettings, sendReport, resolveAlert, client],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLiveData(): LiveData {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLiveData precisa estar dentro de <LiveDataProvider>');
  return v;
}

/** Relógio que atualiza a cada segundo, para "atualizado há X s". */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
