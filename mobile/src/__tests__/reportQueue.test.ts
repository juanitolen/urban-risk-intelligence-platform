import type { CommunityReport } from '../api/types';
import { enqueue, flushQueue, MAX_QUEUE } from '../logic/reportQueue';

const report: CommunityReport = { riskType: 'FLOOD', level: 'HIGH', latitude: -23.5, longitude: -46.6 };
const networkError = new Error('network');
const isNetwork = (e: unknown) => e === networkError;

describe('fila de relatos offline', () => {
  it('limita o tamanho da fila', () => {
    let q = enqueue([], report, 0, 'a');
    for (let i = 0; i < MAX_QUEUE + 5; i++) q = enqueue(q, report, i, `id${i}`);
    expect(q).toHaveLength(MAX_QUEUE);
  });

  it('envia tudo quando o servidor volta', async () => {
    const q = enqueue(enqueue([], report, 0, 'a'), report, 1, 'b');
    const send = jest.fn().mockResolvedValue({});
    const { remaining, sent } = await flushQueue(q, send, isNetwork);
    expect(sent).toBe(2);
    expect(remaining).toEqual([]);
  });

  it('para no primeiro erro de rede e mantém os pendentes', async () => {
    const q = enqueue(enqueue([], report, 0, 'a'), report, 1, 'b');
    const send = jest.fn().mockRejectedValue(networkError);
    const { remaining, sent } = await flushQueue(q, send, isNetwork);
    expect(sent).toBe(0);
    expect(remaining).toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('descarta relato rejeitado pela validação do servidor', async () => {
    const q = enqueue([], report, 0, 'a');
    const { remaining } = await flushQueue(q, jest.fn().mockRejectedValue(new Error('400')), isNetwork);
    expect(remaining).toEqual([]);
  });
});
