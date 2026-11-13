import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from '../src/mapCountryResponse.js';
import type { RawCountry } from '../src/types.js';
import { israel, usa, sparse } from './fixtures/countries.js';

describe('mapCountryResponse', () => {
  it('возвращает пустой массив для пустого ответа', () => {
    expect(mapCountryResponse([])).toEqual([]);
  });

  it('мапит основные поля страны', () => {
    const [card] = mapCountryResponse([israel]);

    expect(card).toMatchObject({
      id: 'ISR',
      name: 'Israel',
      capital: 'Jerusalem',
      region: 'Asia',
      subregion: 'Western Asia',
      population: 9216900,
      area: 20770,
      borders: ['EGY', 'JOR', 'LBN', 'SYR'],
    });
  });

  it('сохраняет количество и порядок стран', () => {
    const cards = mapCountryResponse([israel, usa]);

    expect(cards.map((c) => c.name)).toEqual([
      'Israel',
      'United States of America',
    ]);
  });

  it('превращает языки в массив названий', () => {
    const [card] = mapCountryResponse([israel]);

    expect(card?.languages).toEqual(['Hebrew']);
  });

  it('форматирует валюту как "название (символ)"', () => {
    const [card] = mapCountryResponse([israel]);

    expect(card?.currencies).toEqual(['Israeli new shekel (₪)']);
  });

  it('оставляет только название валюты, если символа нет', () => {
    const raw: RawCountry = {
      name: 'X',
      currencies: [{ code: 'XXX', name: 'Test coin' }],
    };

    expect(mapCountryResponse([raw])[0]?.currencies).toEqual(['Test coin']);
  });

  it('предпочитает flags.svg для флага', () => {
    const [card] = mapCountryResponse([israel]);

    expect(card?.flagUrl).toBe('https://countries.dev/flags/il.svg');
  });

  it('использует flags.png, если нет svg', () => {
    const raw: RawCountry = {
      name: 'X',
      flags: { png: 'https://countries.dev/flags/x.png' },
    };

    expect(mapCountryResponse([raw])[0]?.flagUrl).toBe(
      'https://countries.dev/flags/x.png',
    );
  });

  it('использует flag, если это URL', () => {
    const [card] = mapCountryResponse([usa]);

    expect(card?.flagUrl).toBe('https://countries.dev/flags/us.svg');
  });

  it('возвращает null вместо флага, если есть только эмодзи', () => {
    const raw: RawCountry = { name: 'X', flag: '🇮🇱' };

    expect(mapCountryResponse([raw])[0]?.flagUrl).toBeNull();
  });

  it('подставляет null для отсутствующих необязательных полей', () => {
    const [card] = mapCountryResponse([sparse]);

    expect(card).toEqual({
      id: 'Nowhere',
      name: 'Nowhere',
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
  });

  it('считает пустую или пробельную столицу отсутствующей', () => {
    const raw: RawCountry = { name: 'X', capital: '  ' };

    expect(mapCountryResponse([raw])[0]?.capital).toBeNull();
  });

  it('использует alpha2Code как id, если нет alpha3Code', () => {
    const raw: RawCountry = { name: 'X', alpha2Code: 'XX' };

    expect(mapCountryResponse([raw])[0]?.id).toBe('XX');
  });

  it('не мутирует входные данные', () => {
    const input = [structuredClone(israel)];
    const snapshot = structuredClone(input);

    mapCountryResponse(input);

    expect(input).toEqual(snapshot);
  });

  it('не делит массивы между входом и результатом', () => {
    const input = structuredClone(israel);
    const [card] = mapCountryResponse([input]);

    card?.borders.push('XXX');

    expect(input.borders).toEqual(['EGY', 'JOR', 'LBN', 'SYR']);
  });
});
