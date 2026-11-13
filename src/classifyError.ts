export type Failure =
  | { kind: 'cancelled' }
  | { kind: 'timeout' }
  | { kind: 'http'; status: number }
  | { kind: 'network' }
  | { kind: 'unknown' };

export function classifyError(_error: unknown): Failure {
  throw new Error('classifyError: not implemented');
}
