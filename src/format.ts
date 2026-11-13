import type { Failure } from './classifyError.js';
import type { CountryCard } from './types.js';

export const EMPTY = '—';

const numberFormat = new Intl.NumberFormat('ru-RU');

export const orDash = (value: string | null): string => value ?? EMPTY;

export const formatNumber = (value: number | null, unit = ''): string =>
  value === null ? EMPTY : `${numberFormat.format(value)}${unit}`;

export const formatList = (items: string[]): string =>
  items.length > 0 ? items.join(', ') : EMPTY;

export function failureMessage(failure: Failure): string {
  switch (failure.kind) {
    case 'timeout':
      return 'Сервер слишком долго не отвечает.';
    case 'http':
      return `Сервер вернул ошибку ${failure.status}.`;
    case 'network':
      return 'Нет соединения с сетью.';
    case 'cancelled':
    case 'unknown':
      return 'Что-то пошло не так.';
  }
}

export function describeCountry(country: CountryCard): string {
  const parts: string[] = [];

  if (country.region !== null) {
    const subregion =
      country.subregion !== null ? ` (${country.subregion})` : '';
    parts.push(
      `${country.name} находится в регионе ${country.region}${subregion}.`,
    );
  } else {
    parts.push(`${country.name}.`);
  }
  if (country.capital !== null) parts.push(`Столица: ${country.capital}.`);
  if (country.population !== null) {
    parts.push(`Население: ${formatNumber(country.population)}.`);
  }
  return parts.join(' ');
}
