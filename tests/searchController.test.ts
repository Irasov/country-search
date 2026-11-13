import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchController } from '../src/searchController.js';
import { HttpError } from '../src/errors.js';
import type { Failure } from '../src/classifyError.js';
import { card, createFakeSearch, flush } from './helpers/controllerHelpers.js';

const DEBOUNCE_MS = 300;

function setup() {
  const { search, calls } = createFakeSearch();
  const controller = createSearchController({
    search,
    debounceMs: DEBOUNCE_MS,
  });
  return { controller, search, calls };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createSearchController', () => {
  describe('пустой ввод', () => {
    it('начинает в состоянии idle', () => {
      const { controller } = setup();

      expect(controller.getState()).toEqual({ status: 'idle' });
    });

    it.each([[''], ['   ']])('ввод %j не отправляет запрос', async (text) => {
      const { controller, search } = setup();

      controller.input(text);
      vi.advanceTimersByTime(DEBOUNCE_MS * 2);
      await flush();

      expect(search).not.toHaveBeenCalled();
      expect(controller.getState()).toEqual({ status: 'idle' });
    });

    it('очистка поля отменяет ещё не запущенный запрос', async () => {
      const { controller, search } = setup();

      controller.input('spain');
      vi.advanceTimersByTime(100);
      controller.input('');
      vi.advanceTimersByTime(DEBOUNCE_MS * 2);
      await flush();

      expect(search).not.toHaveBeenCalled();
      expect(controller.getState()).toEqual({ status: 'idle' });
    });

    it('очистка поля отменяет запрос в полёте и возвращает idle', async () => {
      const { controller, calls } = setup();

      controller.input('spain');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      controller.input('');
      await flush();

      expect(calls[0]?.signal.aborted).toBe(true);
      expect(controller.getState()).toEqual({ status: 'idle' });
    });
  });

  describe('debounce и загрузка', () => {
    it('показывает loading сразу, до запуска запроса', () => {
      const { controller, search } = setup();

      controller.input('spain');

      expect(controller.getState()).toEqual({
        status: 'loading',
        query: 'spain',
      });
      expect(search).not.toHaveBeenCalled();
    });

    it('вызывает search после debounce с обрезанным запросом', () => {
      const { controller, search } = setup();

      controller.input('  spain ');
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(search).toHaveBeenCalledTimes(1);
      expect(search).toHaveBeenCalledWith('spain', expect.any(AbortSignal));
    });

    it('серия вводов внутри debounce даёт один запрос с последним текстом', () => {
      const { controller, search, calls } = setup();

      controller.input('s');
      vi.advanceTimersByTime(100);
      controller.input('sp');
      vi.advanceTimersByTime(100);
      controller.input('spa');
      vi.advanceTimersByTime(DEBOUNCE_MS);

      expect(search).toHaveBeenCalledTimes(1);
      expect(calls[0]?.query).toBe('spa');
    });
  });

  describe('результаты', () => {
    it('показывает results после успешного ответа', async () => {
      const { controller, calls } = setup();

      controller.input('spain');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      calls[0]?.resolve([card('Spain')]);
      await flush();

      expect(controller.getState()).toEqual({
        status: 'results',
        query: 'spain',
        countries: [card('Spain')],
      });
    });

    it('показывает empty, если стран нет', async () => {
      const { controller, calls } = setup();

      controller.input('zzzz');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      calls[0]?.resolve([]);
      await flush();

      expect(controller.getState()).toEqual({ status: 'empty', query: 'zzzz' });
    });
  });

  describe('ошибки', () => {
    it.each<[string, unknown, Failure]>([
      ['HttpError', new HttpError(500), { kind: 'http', status: 500 }],
      ['сетевой сбой', new TypeError('Failed to fetch'), { kind: 'network' }],
      [
        'таймаут',
        new DOMException('slow', 'TimeoutError'),
        { kind: 'timeout' },
      ],
    ])('%s показывается как ошибка', async (_name, error, failure) => {
      const { controller, calls } = setup();

      controller.input('spain');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      calls[0]?.reject(error);
      await flush();

      expect(controller.getState()).toEqual({
        status: 'error',
        query: 'spain',
        failure,
      });
    });
  });

  describe('отмена', () => {
    it('отмена своего запроса новым вводом не становится ошибкой', async () => {
      const { controller, calls } = setup();

      controller.input('sp');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      controller.input('spa');
      await flush();

      expect(calls[0]?.signal.aborted).toBe(true);
      expect(controller.getState()).toEqual({
        status: 'loading',
        query: 'spa',
      });
    });

    it('отменяет предыдущий запрос на каждом вводе, не дожидаясь debounce', () => {
      const { controller, search, calls } = setup();

      controller.input('sp');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      controller.input('spa'); // debounce нового запроса ещё не истёк

      expect(calls[0]?.signal.aborted).toBe(true);
      expect(search).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry', () => {
    it('повторяет последний запрос сразу, без debounce', async () => {
      const { controller, search, calls } = setup();

      controller.input('spain');
      vi.advanceTimersByTime(DEBOUNCE_MS);
      calls[0]?.reject(new HttpError(500));
      await flush();

      controller.retry();

      expect(search).toHaveBeenCalledTimes(2);
      expect(calls[1]?.query).toBe('spain');
      expect(controller.getState()).toEqual({
        status: 'loading',
        query: 'spain',
      });

      calls[1]?.resolve([card('Spain')]);
      await flush();
      expect(controller.getState().status).toBe('results');
    });

    it('ничего не делает, если вводили пустую строку', () => {
      const { controller, search } = setup();

      controller.retry();

      expect(search).not.toHaveBeenCalled();
      expect(controller.getState()).toEqual({ status: 'idle' });
    });
  });

  describe('подписка', () => {
    it('уведомляет подписчика и перестаёт после отписки', () => {
      const { controller } = setup();
      const listener = vi.fn();

      const unsubscribe = controller.subscribe(listener);
      controller.input('spain');
      expect(listener).toHaveBeenCalledWith({
        status: 'loading',
        query: 'spain',
      });

      unsubscribe();
      listener.mockClear();
      controller.input('');

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
