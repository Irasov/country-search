import { vi } from 'vitest';
import type { SearchFn } from '../../src/searchController.js';
import type { CountryCard } from '../../src/types.js';

export interface PendingCall {
  query: string;
  signal: AbortSignal;
  resolve(countries: CountryCard[]): void;
  reject(error: unknown): void;
}

// Поиск, которым управляет тест. Как настоящий fetch,
// отклоняется причиной сигнала, если на нём вызван abort().
export function createFakeSearch() {
  const calls: PendingCall[] = [];
  const search = vi.fn<SearchFn>(
    (query, signal) =>
      new Promise<CountryCard[]>((resolve, reject) => {
        if (signal.aborted) {
          reject(signal.reason);
          return;
        }
        signal.addEventListener('abort', () => reject(signal.reason), {
          once: true,
        });
        calls.push({ query, signal, resolve, reject });
      }),
  );
  return { search, calls };
}

// Пропускает цепочку микрозадач, не трогая fake timers.
export async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

export const card = (name: string): CountryCard => ({
  id: name.toUpperCase(),
  name,
  flagUrl: null,
  capital: null,
  region: null,
  subregion: null,
  population: null,
  area: null,
  languages: [],
  currencies: [],
  borders: [],
});
