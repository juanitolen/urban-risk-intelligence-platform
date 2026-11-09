import type { Alert } from '../api/types';
import { diffAlerts, sortByPriority } from '../logic/alertDiff';

const alert = (id: number, severity: Alert['severity'], priorityScore: number, updatedAt = '2026-11-09T12:00:00Z'): Alert => ({
  id, severity, priorityScore, updatedAt, riskType: 'FLOOD', title: `A${id}`, region: 'Sé', latitude: 0, longitude: 0,
  confidence: 0.9, latestValue: 50, peakValue: 50, unit: 'cm', observationCount: 1, sources: ['SENSOR'], factors: [],
  status: 'ACTIVE', createdAt: '2026-11-09T12:00:00Z',
});

describe('diffAlerts', () => {
  it('não notifica nada na primeira carga', () => {
    expect(diffAlerts(null, [alert(1, 'CRITICAL', 90)])).toEqual([]);
  });

  it('notifica alertas novos de nível alto ou crítico, ignorando os baixos', () => {
    const changes = diffAlerts([], [alert(1, 'CRITICAL', 90), alert(2, 'LOW', 20), alert(3, 'HIGH', 60)]);
    expect(changes.map((c) => [c.alert.id, c.kind])).toEqual([[1, 'new'], [3, 'new']]);
  });

  it('notifica quando um alerta existente piora de severidade', () => {
    const changes = diffAlerts([alert(1, 'MODERATE', 40)], [alert(1, 'HIGH', 60)]);
    expect(changes).toHaveLength(1);
    expect(changes[0].kind).toBe('escalated');
  });

  it('não repete notificação para o mesmo alerta sem piora', () => {
    expect(diffAlerts([alert(1, 'HIGH', 60)], [alert(1, 'HIGH', 64)])).toEqual([]);
  });
});

describe('sortByPriority', () => {
  it('ordena por prioridade e desempata pelo mais recente', () => {
    const sorted = sortByPriority([
      alert(1, 'LOW', 30), alert(2, 'HIGH', 70, '2026-11-09T12:00:00Z'), alert(3, 'HIGH', 70, '2026-11-09T12:05:00Z'),
    ]);
    expect(sorted.map((a) => a.id)).toEqual([3, 2, 1]);
  });
});
