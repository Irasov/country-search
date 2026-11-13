import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchCountries } from '../src/searchCountries.js';
import { HttpError } from '../src/errors.js';
import { israel } from './fixtures/countries.js';
import {
  hangingFetch,
  respondWith,
  rejectionOf,
} from './helpers/fetchMocks.js';

const notFound = () =>
  new Response('Country not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchCountries', () => {
  describe('запрос', () => {
    it('отправляет один GET на /name/{query}', async () => {
      const fetchMock = respondWith(Response.json([israel]));
      vi.stubGlobal('fetch', fetchMock);

      await searchCountries('israel', new AbortController().signal);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        'https://countries.dev/name/israel',
      );
    });

    it('экранирует запрос в URL', async () => {
      const fetchMock = respondWith(Response.json([]));
      vi.stubGlobal('fetch', fetchMock);

      await searchCountries('new zealand/../x', new AbortController().signal);

      expect(fetchMock.mock.calls[0]?.[0]).toBe(
        'https://countries.dev/name/new%20zealand%2F..%2Fx',
      );
    });

    it('передаёт в fetch сигнал', async () => {
      const fetchMock = respondWith(Response.json([]));
      vi.stubGlobal('fetch', fetchMock);

      await searchCountries('a', new AbortController().signal);

      expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('успешный ответ', () => {
    it('возвращает страны, прогнанные через mapCountryResponse', async () => {
      vi.stubGlobal('fetch', respondWith(Response.json([israel])));

      const result = await searchCountries('isr', new AbortController().signal);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'ISR', name: 'Israel' });
    });
  });

  describe('404: нет совпадений', () => {
    it('возвращает пустой массив, а не ошибку', async () => {
      vi.stubGlobal('fetch', respondWith(notFound()));

      const result = await searchCountries(
        'zzzz',
        new AbortController().signal,
      );

      expect(result).toEqual([]);
    });
  });

  describe('HTTP-ошибки', () => {
    it.each([400, 429, 500, 503])(
      'бросает HttpError для статуса %i',
      async (status) => {
        vi.stubGlobal('fetch', respondWith(new Response('boom', { status })));

        const error = await rejectionOf(
          searchCountries('a', new AbortController().signal),
        );

        expect(error).toBeInstanceOf(HttpError);
        expect(error).toBeInstanceOf(Error);
        expect((error as HttpError).status).toBe(status);
        expect((error as HttpError).name).toBe('HttpError');
      },
    );

    it('не превращает сетевой сбой в HttpError', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn<typeof fetch>(() =>
          Promise.reject(new TypeError('Failed to fetch')),
        ),
      );

      const error = await rejectionOf(
        searchCountries('a', new AbortController().signal),
      );

      expect(error).toBeInstanceOf(TypeError);
      expect(error).not.toBeInstanceOf(HttpError);
    });
  });

  describe('отмена', () => {
    it('отклоняется с AbortError, когда вызывающий делает abort()', async () => {
      vi.stubGlobal('fetch', hangingFetch());
      const controller = new AbortController();

      const pending = rejectionOf(searchCountries('sp', controller.signal));
      controller.abort();
      const error = await pending;

      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe('AbortError');
    });

    it('отклоняется сразу, если сигнал уже отменён', async () => {
      vi.stubGlobal('fetch', hangingFetch());
      const controller = new AbortController();
      controller.abort();

      const error = await rejectionOf(searchCountries('sp', controller.signal));

      expect((error as DOMException).name).toBe('AbortError');
    });
  });

  describe('таймаут', () => {
    it('отклоняется с TimeoutError, если ответа нет дольше timeoutMs', async () => {
      vi.stubGlobal('fetch', hangingFetch());

      const error = await rejectionOf(
        searchCountries('sp', new AbortController().signal, { timeoutMs: 10 }),
      );

      expect(error).toBeInstanceOf(DOMException);
      expect((error as DOMException).name).toBe('TimeoutError');
    });

    it('отмена вызывающего до таймаута остаётся AbortError, а не TimeoutError', async () => {
      vi.stubGlobal('fetch', hangingFetch());
      const controller = new AbortController();

      const pending = rejectionOf(
        searchCountries('sp', controller.signal, { timeoutMs: 5000 }),
      );
      controller.abort();
      const error = await pending;

      expect((error as DOMException).name).toBe('AbortError');
    });
  });
});
