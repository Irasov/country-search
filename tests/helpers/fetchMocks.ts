import { vi } from 'vitest';

export const respondWith = (response: Response) =>
  vi.fn<typeof fetch>(() => Promise.resolve(response));

// Никогда не резолвится сам, но, как настоящий fetch,
// отклоняется причиной сигнала (AbortError / TimeoutError).
export const hangingFetch = () =>
  vi.fn<typeof fetch>(
    (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        const signal = init?.signal;
        if (!signal) return;
        if (signal.aborted) {
          reject(signal.reason);
          return;
        }
        signal.addEventListener('abort', () => reject(signal.reason), {
          once: true,
        });
      }),
  );

export async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected promise to reject, but it resolved');
}

export interface PendingRequest {
  url: string;
  signal: AbortSignal;
  respond(response: Response): void;
}

export function controlledFetch() {
  const requests: PendingRequest[] = [];
  const fetchMock = vi.fn<typeof fetch>(
    (input, init) =>
      new Promise<Response>((resolve, reject) => {
        const signal = init?.signal;
        if (!signal) {
          reject(new Error('fetch called without signal'));
          return;
        }
        if (signal.aborted) {
          reject(signal.reason);
          return;
        }
        signal.addEventListener('abort', () => reject(signal.reason), {
          once: true,
        });
        requests.push({ url: String(input), signal, respond: resolve });
      }),
  );
  return { fetchMock, requests };
}
