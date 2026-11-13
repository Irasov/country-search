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
