import type { RawCountry } from '../../src/types.js';

// Форма взята из документации countries.dev (/docs/api/name).
// После curl замените значения на реальные ответы.
export const israel: RawCountry = {
  name: 'Israel',
  alpha2Code: 'IL',
  alpha3Code: 'ISR',
  capital: 'Jerusalem',
  region: 'Asia',
  subregion: 'Western Asia',
  population: 9216900,
  area: 20770,
  borders: ['EGY', 'JOR', 'LBN', 'SYR'],
  currencies: [{ code: 'ILS', name: 'Israeli new shekel', symbol: '₪' }],
  languages: [
    { iso639_1: 'he', iso639_2: 'heb', name: 'Hebrew', nativeName: 'עברית' },
  ],
  flag: '🇮🇱',
  flags: {
    svg: 'https://countries.dev/flags/il.svg',
    png: 'https://countries.dev/flags/il.png',
  },
};

export const usa: RawCountry = {
  name: 'United States of America',
  alpha2Code: 'US',
  alpha3Code: 'USA',
  capital: 'Washington, D.C.',
  region: 'Americas',
  subregion: 'North America',
  population: 329484123,
  area: 9372610,
  borders: ['CAN', 'MEX'],
  currencies: [{ code: 'USD', name: 'United States dollar', symbol: '$' }],
  languages: [{ iso639_1: 'en', name: 'English' }],
  flag: 'https://countries.dev/flags/us.svg',
};

export const sparse: RawCountry = { name: 'Nowhere' };
