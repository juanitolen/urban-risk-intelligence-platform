import type { RiskType, Severity, SourceType } from '../api/types';

export const RISK_LABEL: Record<RiskType, string> = {
  FLOOD: 'Alagamento',
  HEAT_ISLAND: 'Calor extremo',
  SERVICE_OUTAGE: 'Falta de serviço',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  LOW: 'Baixo',
  MODERATE: 'Moderado',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
};

export const SOURCE_LABEL: Record<SourceType, string> = {
  SENSOR: 'Sensor',
  PUBLIC_DATASET: 'Base pública',
  COMMUNITY: 'Comunidade',
};

/** Orientação curta e prática para o morador, por tipo de risco. */
export const RESIDENT_ADVICE: Record<RiskType, string> = {
  FLOOD: 'Evite a área. Não atravesse ruas alagadas a pé ou de carro.',
  HEAT_ISLAND: 'Beba água, procure sombra e evite esforço entre 11h e 16h.',
  SERVICE_OUTAGE: 'Guarde água, desligue aparelhos da tomada e acompanhe as atualizações.',
};

export function confidenceLabel(c: number): string {
  if (c >= 0.8) return 'Alta';
  if (c >= 0.55) return 'Média';
  return 'Baixa';
}

export function percent(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function formatValue(value: number, unit: string): string {
  if (unit === 'min') {
    if (value >= 60) {
      const h = Math.floor(value / 60);
      const m = Math.round(value % 60);
      return m ? `${h} h ${m} min` : `${h} h`;
    }
    return `${Math.round(value)} min`;
  }
  return `${value.toFixed(unit === '°C' ? 1 : 0)} ${unit}`;
}

/** "agora", "há 12 s", "há 3 min", "há 2 h". */
export function relativeTime(fromMs: number | string | null | undefined, nowMs: number = Date.now()): string {
  if (fromMs == null) return '—';
  const t = typeof fromMs === 'string' ? Date.parse(fromMs) : fromMs;
  const s = Math.max(0, Math.round((nowMs - t) / 1000));
  if (s < 5) return 'agora';
  if (s < 60) return `há ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  return `há ${h} h`;
}

export function clockTime(ms: number | string): string {
  const d = new Date(typeof ms === 'string' ? Date.parse(ms) : ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
