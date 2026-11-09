import { connectionReducer, initialConnection, nextDelay, type ConnectionState } from '../logic/connection';

const run = (events: Parameters<typeof connectionReducer>[1][], start: ConnectionState = initialConnection) =>
  events.reduce(connectionReducer, start);

describe('connectionReducer', () => {
  it('fica online após a primeira resposta', () => {
    const s = run([{ type: 'success', at: 1000, latencyMs: 80 }]);
    expect(s.status).toBe('online');
    expect(s.latencyMs).toBe(80);
    expect(s.justReconnected).toBe(false);
  });

  it('uma falha isolada só marca instável; duas seguidas marcam desconectado', () => {
    const online = run([{ type: 'success', at: 0, latencyMs: 10 }]);
    const one = connectionReducer(online, { type: 'failure', at: 5000 });
    expect(one.status).toBe('unstable');
    const two = connectionReducer(one, { type: 'failure', at: 7000 });
    expect(two.status).toBe('offline');
    expect(two.offlineSince).toBe(7000);
  });

  it('avisa "reconectado" só quando volta de uma queda real', () => {
    const blip = run([
      { type: 'success', at: 0, latencyMs: 10 },
      { type: 'failure', at: 1 },
      { type: 'success', at: 2, latencyMs: 10 },
    ]);
    expect(blip.justReconnected).toBe(false);

    const back = run([
      { type: 'success', at: 0, latencyMs: 10 },
      { type: 'failure', at: 1 },
      { type: 'failure', at: 2 },
      { type: 'success', at: 3, latencyMs: 10 },
    ]);
    expect(back.status).toBe('online');
    expect(back.justReconnected).toBe(true);
    expect(back.offlineSince).toBeNull();
    expect(connectionReducer(back, { type: 'ackReconnected' }).justReconnected).toBe(false);
  });

  it('aparelho sem internet vai direto para desconectado', () => {
    const s = run([{ type: 'success', at: 0, latencyMs: 10 }, { type: 'device', online: false, at: 9 }]);
    expect(s.status).toBe('offline');
    expect(s.deviceOffline).toBe(true);
  });
});

describe('nextDelay', () => {
  it('usa o intervalo normal sem falhas e backoff exponencial limitado com falhas', () => {
    expect(nextDelay(0)).toBe(5000);
    expect(nextDelay(1)).toBe(2000);
    expect(nextDelay(3)).toBe(8000);
    expect(nextDelay(10)).toBe(30000);
  });
});
