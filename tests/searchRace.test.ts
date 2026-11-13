import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchController } from '../src/searchController.js';
import { searchCountries } from '../src/searchCountries.js';
import { controlledFetch } from './helpers/fetchMocks.js';
import { flush } from './helpers/controllerHelpers.js';

const DEBOUNCE_MS = 300;

const spain = { name: 'Spain', alpha3Code: 'ESP' };
const stale = { name: 'Stale result', alpha3Code: 'OLD' };

function setup() {
  const { fetchMock, requests } = controlledFetch();
  vi.stubGlobal('fetch', fetchMock);
  const controller = createSearchController({
    search: searchCountries,
    debounceMs: DEBOUNCE_MS,
  });
  return { controller, requests };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('гонка устаревших ответов', () => {
  it('ответ на ранний запрос, пришедший позже, не перезаписывает результат', async () => {
    const { controller, requests } = setup();

    controller.input('sp');
    vi.advanceTimersByTime(DEBOUNCE_MS);
    controller.input('spain');
    vi.advanceTimersByTime(DEBOUNCE_MS);
    expect(requests).toHaveLength(2);
    const [early, late] = requests;
    expect(early?.url).toMatch(/\/name\/sp$/);
    expect(late?.url).toMatch(/\/name\/spain$/);

    // Порядок ответов инвертирован: сначала поздний запрос, потом ранний.
    late?.respond(Response.json([spain]));
    await vi.waitFor(() =>
      expect(controller.getState().status).toBe('results'),
    );
    early?.respond(Response.json([stale]));
    await flush();

    expect(early?.signal.aborted).toBe(true);
    expect(controller.getState()).toMatchObject({
      status: 'results',
      query: 'spain',
      countries: [{ name: 'Spain' }],
    });
  });

  it('ранний запрос отменяется сразу на вводе, пока debounce ещё ждёт', async () => {
    const { controller, requests } = setup();

    controller.input('sp');
    vi.advanceTimersByTime(DEBOUNCE_MS);
    const [early] = requests;

    controller.input('spain'); // debounce нового запроса ещё не истёк

    expect(early?.signal.aborted).toBe(true);
    expect(requests).toHaveLength(1);

    early?.respond(Response.json([stale]));
    await flush();

    expect(controller.getState()).toEqual({
      status: 'loading',
      query: 'spain',
    });
  });

  it('настоящий сбой актуального запроса показывается как ошибка', async () => {
    const { controller, requests } = setup();

    controller.input('spain');
    vi.advanceTimersByTime(DEBOUNCE_MS);
    requests[0]?.respond(new Response('boom', { status: 500 }));

    await vi.waitFor(() =>
      expect(controller.getState()).toEqual({
        status: 'error',
        query: 'spain',
        failure: { kind: 'http', status: 500 },
      }),
    );
  });
});
