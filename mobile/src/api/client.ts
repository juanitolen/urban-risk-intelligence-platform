import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { Alert, CommunityReport, Dashboard, Observation, Page } from './types';

const REQUEST_TIMEOUT_MS = 4000;

/**
 * Descobre a URL da API:
 * 1. EXPO_PUBLIC_API_URL (se definida);
 * 2. o mesmo IP da máquina que serve o Metro (funciona no celular físico com Expo Go);
 * 3. localhost / 10.0.2.2 (emulador Android).
 */
export function defaultApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const port = (Constants.expoConfig?.extra as { apiPort?: number } | undefined)?.apiPort ?? 8080;
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];
  if (host && host !== 'localhost' && host !== '127.0.0.1') return `http://${host}:${port}`;
  return Platform.OS === 'android' ? `http://10.0.2.2:${port}` : `http://localhost:${port}`;
}

export class ApiError extends Error {
  constructor(message: string, readonly status?: number, readonly network = false) {
    super(message);
  }
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  get url() {
    return this.baseUrl;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers },
      });
      if (!res.ok) {
        let detail = `Erro ${res.status}`;
        try {
          const body = await res.json();
          detail = body.detail ?? detail;
        } catch {
          /* corpo vazio */
        }
        throw new ApiError(detail, res.status);
      }
      return (await res.json()) as T;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError('Servidor indisponível', undefined, true);
    } finally {
      clearTimeout(timer);
    }
  }

  ping() {
    return this.request<{ status: string; serverTime: string }>('/api/v1/ping');
  }
  dashboard() {
    return this.request<Dashboard>('/api/v1/dashboard');
  }
  alerts(status: 'ACTIVE' | 'RESOLVED' = 'ACTIVE') {
    return this.request<Page<Alert>>(`/api/v1/alerts?status=${status}&size=100`);
  }
  alert(id: number) {
    return this.request<Alert>(`/api/v1/alerts/${id}`);
  }
  observations(size = 20) {
    return this.request<Page<Observation>>(`/api/v1/observations?size=${size}`);
  }
  resolve(id: number) {
    return this.request<Alert>(`/api/v1/alerts/${id}/resolve`, { method: 'PATCH' });
  }
  report(report: CommunityReport) {
    return this.request<{ observationId: number; confidence: number; alert?: Alert }>(
      '/api/v1/ingest/community',
      { method: 'POST', body: JSON.stringify(report) },
    );
  }
}
