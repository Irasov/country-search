import { describe, it, expect } from 'vitest';
import { classifyError } from '../src/classifyError.js';
import { HttpError } from '../src/errors.js';

describe('classifyError', () => {
  describe('отмена', () => {
    it('AbortError распознаётся как cancelled', () => {
      const error = new DOMException('aborted', 'AbortError');

      expect(classifyError(error)).toEqual({ kind: 'cancelled' });
    });

    it('причина реального controller.abort() это cancelled', () => {
      const controller = new AbortController();
      controller.abort();

      expect(classifyError(controller.signal.reason)).toEqual({
        kind: 'cancelled',
      });
    });

    it('обычный Error с name "AbortError" тоже cancelled', () => {
      const error = Object.assign(new Error('x'), { name: 'AbortError' });

      expect(classifyError(error)).toEqual({ kind: 'cancelled' });
    });
  });

  describe('таймаут', () => {
    it('TimeoutError распознаётся как timeout', () => {
      const error = new DOMException('timed out', 'TimeoutError');

      expect(classifyError(error)).toEqual({ kind: 'timeout' });
    });

    it('причина реального AbortSignal.timeout() это timeout', async () => {
      const signal = AbortSignal.timeout(5);
      await new Promise((resolve) =>
        signal.addEventListener('abort', resolve, { once: true }),
      );

      expect(classifyError(signal.reason)).toEqual({ kind: 'timeout' });
    });

    it('timeout и cancelled это разные результаты', () => {
      const timeout = classifyError(new DOMException('', 'TimeoutError'));
      const cancelled = classifyError(new DOMException('', 'AbortError'));

      expect(timeout).not.toEqual(cancelled);
    });
  });

  describe('HTTP-ошибки', () => {
    it('HttpError сохраняет статус', () => {
      expect(classifyError(new HttpError(503))).toEqual({
        kind: 'http',
        status: 503,
      });
    });
  });

  describe('сеть и прочее', () => {
    it('TypeError от fetch это network', () => {
      expect(classifyError(new TypeError('Failed to fetch'))).toEqual({
        kind: 'network',
      });
    });

    it('SyntaxError (битый JSON) это unknown', () => {
      expect(classifyError(new SyntaxError('Unexpected token'))).toEqual({
        kind: 'unknown',
      });
    });

    it.each([['строка'], [42], [null], [undefined], [{}]])(
      'значение, не являющееся Error (%s), это unknown',
      (value) => {
        expect(classifyError(value)).toEqual({ kind: 'unknown' });
      },
    );
  });
});
