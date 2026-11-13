import { HttpError } from './errors.js';
import { mapCountryResponse } from './mapCountryResponse.js';
const API_URL = 'https://countries.dev';
export const DEFAULT_TIMEOUT_MS = 8000;
export async function searchCountries(query, signal, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    const combinedSignal = AbortSignal.any([
        signal,
        AbortSignal.timeout(timeoutMs),
    ]);
    const response = await fetch(`${API_URL}/name/${encodeURIComponent(query)}`, {
        signal: combinedSignal,
    });
    // 404 означает "совпадений нет": это не ошибка
    if (response.status === 404)
        return [];
    if (!response.ok)
        throw new HttpError(response.status);
    const raw = (await response.json());
    return mapCountryResponse(raw);
}
