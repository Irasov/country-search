import type { CountryCard, RawCountry, RawCurrency } from './types.js';

const isHttpUrl = (value: string | undefined): value is string =>
  value !== undefined && /^https?:\/\//.test(value);

const nonEmpty = (value: string | undefined): string | null =>
  value !== undefined && value.trim() !== '' ? value : null;

const formatCurrency = ({ name, symbol }: RawCurrency): string =>
  symbol ? `${name} (${symbol})` : name;

function pickFlagUrl(raw: RawCountry): string | null {
  const candidates = [raw.flags?.svg, raw.flags?.png, raw.flag];
  return candidates.find(isHttpUrl) ?? null;
}

function mapCountry(raw: RawCountry): CountryCard {
  return {
    id: raw.alpha3Code ?? raw.alpha2Code ?? raw.name,
    name: raw.name,
    flagUrl: pickFlagUrl(raw),
    capital: nonEmpty(raw.capital),
    region: nonEmpty(raw.region),
    subregion: nonEmpty(raw.subregion),
    population: raw.population ?? null,
    area: raw.area ?? null,
    languages: (raw.languages ?? []).map((language) => language.name),
    currencies: (raw.currencies ?? []).map(formatCurrency),
    borders: [...(raw.borders ?? [])],
  };
}

export function mapCountryResponse(raw: RawCountry[]): CountryCard[] {
  return raw.map(mapCountry);
}
