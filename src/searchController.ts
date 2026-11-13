import { classifyError, type Failure } from './classifyError.js';
import { debounce } from './debounce.js';
import type { CountryCard } from './types.js';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'results'; query: string; countries: CountryCard[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; failure: Failure };

export type SearchFn = (
  query: string,
  signal: AbortSignal,
) => Promise<CountryCard[]>;

export interface SearchControllerOptions {
  search: SearchFn;
  debounceMs?: number;
}

export interface SearchController {
  getState(): SearchState;
  subscribe(listener: (state: SearchState) => void): () => void;
  input(text: string): void;
  retry(): void;
}

export const DEFAULT_DEBOUNCE_MS = 300;

export function createSearchController({
  search,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: SearchControllerOptions): SearchController {
  let state: SearchState = { status: 'idle' };
  let latestQuery = '';
  let active: AbortController | undefined;
  const listeners = new Set<(state: SearchState) => void>();

  const setState = (next: SearchState): void => {
    state = next;
    listeners.forEach((listener) => listener(next));
  };

  const cancelActive = (): void => {
    active?.abort();
    active = undefined;
  };

  async function run(query: string): Promise<void> {
    const controller = new AbortController();
    active = controller;

    try {
      const countries = await search(query, controller.signal);
      setState(
        countries.length === 0
          ? { status: 'empty', query }
          : { status: 'results', query, countries },
      );
    } catch (error) {
      const failure = classifyError(error);
      if (failure.kind === 'cancelled') return; // отменили сами, не ошибка
      setState({ status: 'error', query, failure });
    }
  }

  const runLatest = debounce(() => {
    if (latestQuery !== '') void run(latestQuery);
  }, debounceMs);

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    input(text) {
      latestQuery = text.trim();
      cancelActive();

      if (latestQuery === '') {
        setState({ status: 'idle' });
        return;
      }
      setState({ status: 'loading', query: latestQuery });
      runLatest();
    },

    retry() {
      if (latestQuery === '') return;
      cancelActive();
      setState({ status: 'loading', query: latestQuery });
      void run(latestQuery);
    },
  };
}
