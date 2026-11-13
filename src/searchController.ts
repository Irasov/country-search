import type { Failure } from './classifyError.js';
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

export function createSearchController(
  _options: SearchControllerOptions,
): SearchController {
  throw new Error('createSearchController: not implemented');
}
