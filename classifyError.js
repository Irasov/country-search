import { HttpError } from './errors.js';
const hasName = (error, name) => typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === name;
export function classifyError(error) {
    if (error instanceof HttpError)
        return { kind: 'http', status: error.status };
    if (hasName(error, 'AbortError'))
        return { kind: 'cancelled' };
    if (hasName(error, 'TimeoutError'))
        return { kind: 'timeout' };
    if (error instanceof TypeError)
        return { kind: 'network' };
    return { kind: 'unknown' };
}
