/**
 * Máquina de estados da conexão com o backend.
 *
 *  connecting ──ok──▶ online ──falha──▶ unstable ──falha──▶ offline
 *       ▲                 ▲                 │                  │
 *       └──────────────── └──────ok─────────┴──────ok──────────┘ (reconnected)
 *
 * Uma única falha não derruba a interface ("instável"); duas seguidas marcam "desconectado".
 * O intervalo entre tentativas cresce (backoff exponencial) para não martelar um servidor caído.
 */
export type ConnectionStatus = 'connecting' | 'online' | 'unstable' | 'offline';

export interface ConnectionState {
  status: ConnectionStatus;
  consecutiveFailures: number;
  lastSuccessAt: number | null;
  lastAttemptAt: number | null;
  /** Momento em que caiu (para mostrar "desconectado há X"). */
  offlineSince: number | null;
  latencyMs: number | null;
  /** Verdadeiro na primeira resposta boa após uma queda: o app mostra "reconectado". */
  justReconnected: boolean;
  deviceOffline: boolean;
}

export type ConnectionEvent =
  | { type: 'success'; at: number; latencyMs: number }
  | { type: 'failure'; at: number }
  | { type: 'device'; online: boolean; at: number }
  | { type: 'ackReconnected' };

export const POLL_INTERVAL_MS = 5000;
export const MAX_BACKOFF_MS = 30000;
export const OFFLINE_AFTER_FAILURES = 2;

export const initialConnection: ConnectionState = {
  status: 'connecting',
  consecutiveFailures: 0,
  lastSuccessAt: null,
  lastAttemptAt: null,
  offlineSince: null,
  latencyMs: null,
  justReconnected: false,
  deviceOffline: false,
};

export function connectionReducer(state: ConnectionState, event: ConnectionEvent): ConnectionState {
  switch (event.type) {
    case 'success': {
      return {
        ...state,
        status: 'online',
        consecutiveFailures: 0,
        lastSuccessAt: event.at,
        lastAttemptAt: event.at,
        offlineSince: null,
        latencyMs: event.latencyMs,
        justReconnected: state.status === 'offline' || state.justReconnected,
      };
    }
    case 'failure': {
      const failures = state.consecutiveFailures + 1;
      const offline = failures >= OFFLINE_AFTER_FAILURES || state.deviceOffline;
      return {
        ...state,
        status: offline ? 'offline' : 'unstable',
        consecutiveFailures: failures,
        lastAttemptAt: event.at,
        offlineSince: offline ? (state.offlineSince ?? event.at) : state.offlineSince,
        justReconnected: false,
      };
    }
    case 'device':
      if (!event.online) {
        return {
          ...state,
          deviceOffline: true,
          status: 'offline',
          offlineSince: state.offlineSince ?? event.at,
          justReconnected: false,
        };
      }
      return { ...state, deviceOffline: false };
    case 'ackReconnected':
      return { ...state, justReconnected: false };
  }
}

/** Atraso até a próxima tentativa: 5 s normal; 2, 4, 8, 16, 30 s quando há falhas. */
export function nextDelay(consecutiveFailures: number, base = POLL_INTERVAL_MS): number {
  if (consecutiveFailures <= 0) return base;
  return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** consecutiveFailures);
}
