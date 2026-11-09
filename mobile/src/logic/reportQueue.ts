import type { CommunityReport } from '../api/types';

export interface QueuedReport {
  localId: string;
  createdAt: number;
  attempts: number;
  report: CommunityReport;
}

export const MAX_QUEUE = 20;
export const MAX_ATTEMPTS = 8;

export function enqueue(queue: QueuedReport[], report: CommunityReport, now: number, localId: string): QueuedReport[] {
  return [...queue, { localId, createdAt: now, attempts: 0, report }].slice(-MAX_QUEUE);
}

/**
 * Envia os relatos pendentes em ordem. Para no primeiro erro de rede (o servidor ainda está fora);
 * descarta relatos rejeitados pela validação (4xx) ou que já tentaram demais.
 */
export async function flushQueue(
  queue: QueuedReport[],
  send: (r: CommunityReport) => Promise<unknown>,
  isNetworkError: (e: unknown) => boolean,
): Promise<{ remaining: QueuedReport[]; sent: number }> {
  const remaining = [...queue];
  let sent = 0;
  while (remaining.length > 0) {
    const item = remaining[0];
    try {
      await send(item.report);
      remaining.shift();
      sent++;
    } catch (e) {
      if (isNetworkError(e)) {
        item.attempts++;
        if (item.attempts >= MAX_ATTEMPTS) remaining.shift();
        break;
      }
      remaining.shift();
    }
  }
  return { remaining, sent };
}
