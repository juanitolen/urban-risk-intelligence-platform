import type { Alert, Severity } from '../api/types';

export const SEVERITY_RANK: Record<Severity, number> = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };

export interface AlertChange {
  alert: Alert;
  kind: 'new' | 'escalated';
}

/**
 * Compara a lista anterior com a nova e devolve o que merece notificação:
 * alertas novos ou que subiram de severidade, a partir de {@code minSeverity}.
 * Na primeira carga (previous == null) não notifica nada, para não disparar uma rajada.
 */
export function diffAlerts(previous: Alert[] | null, next: Alert[], minSeverity: Severity = 'HIGH'): AlertChange[] {
  if (previous == null) return [];
  const before = new Map(previous.map((a) => [a.id, a]));
  const min = SEVERITY_RANK[minSeverity];
  const changes: AlertChange[] = [];
  for (const a of next) {
    if (SEVERITY_RANK[a.severity] < min) continue;
    const old = before.get(a.id);
    if (!old) changes.push({ alert: a, kind: 'new' });
    else if (SEVERITY_RANK[a.severity] > SEVERITY_RANK[old.severity]) changes.push({ alert: a, kind: 'escalated' });
  }
  return changes.sort((x, y) => y.alert.priorityScore - x.alert.priorityScore);
}

/** Ordem da lista: prioridade (desc) e, em empate, atualização mais recente. */
export function sortByPriority(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) => b.priorityScore - a.priorityScore || Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
}
