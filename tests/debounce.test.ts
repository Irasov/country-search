import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../src/debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('вызывает fn один раз по истечении delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('не вызывает fn раньше, чем пройдёт delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(299);

    expect(fn).not.toHaveBeenCalled();
  });

  it('сбрасывает таймер при повторном вызове до истечения delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200); // с первого вызова прошло 400, со второго 200

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('серия быстрых вызовов приводит к одному вызову fn', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    for (let i = 0; i < 10; i++) {
      debounced();
      vi.advanceTimersByTime(50);
    }
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('передаёт в fn аргументы последнего вызова', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('s');
    debounced('sp');
    debounced('spain');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('spain');
  });

  it('вызовы, разделённые паузой больше delay, срабатывают по отдельности', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 300);

    debounced('a');
    vi.advanceTimersByTime(300);
    debounced('b');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'a');
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });

  it('независимые debounce-функции не делят общий таймер', () => {
    const fnA = vi.fn();
    const fnB = vi.fn();
    const a = debounce(fnA, 300);
    const b = debounce(fnB, 300);

    a();
    b();
    vi.advanceTimersByTime(300);

    expect(fnA).toHaveBeenCalledTimes(1);
    expect(fnB).toHaveBeenCalledTimes(1);
  });
});
