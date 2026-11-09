import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  cache: 'urbanrisk.cache.v1',
  settings: 'urbanrisk.settings.v1',
  queue: 'urbanrisk.reportQueue.v1',
  deviceId: 'urbanrisk.deviceId.v1',
} as const;

export async function load<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function save(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* armazenamento indisponível: o app segue funcionando só em memória */
  }
}

export function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Identificador anônimo do aparelho (não é IMEI nem conta). O servidor só guarda o hash. */
export async function deviceId(): Promise<string> {
  const existing = await load<string>(KEYS.deviceId);
  if (existing) return existing;
  const id = `anon-${randomId()}`;
  await save(KEYS.deviceId, id);
  return id;
}
