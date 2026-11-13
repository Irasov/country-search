import { HttpError } from './errors.js';

export type Failure =
  | { kind: 'cancelled' }
  | { kind: 'timeout' }
  | { kind: 'http'; status: number }
  | { kind: 'network' }
  | { kind: 'unknown' };

const hasName = (error: unknown, name: string): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  error.name === name;

export function classifyError(error: unknown): Failure {
  if (error instanceof HttpError) return { kind: 'http', status: error.status };
  if (hasName(error, 'AbortError')) return { kind: 'cancelled' };
  if (hasName(error, 'TimeoutError')) return { kind: 'timeout' };
  if (error instanceof TypeError) return { kind: 'network' };
  return { kind: 'unknown' };
}
