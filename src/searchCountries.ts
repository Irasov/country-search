import type { CountryCard } from './types.js';

export interface SearchOptions {
  timeoutMs?: number;
}

export async function searchCountries(
  _query: string,
  _signal: AbortSignal,
  _options: SearchOptions = {},
): Promise<CountryCard[]> {
  throw new Error('searchCountries: not implemented');
}
