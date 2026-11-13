import { classifyError } from './classifyError.js';
import { debounce } from './debounce.js';
export const DEFAULT_DEBOUNCE_MS = 300;
export function createSearchController({ search, debounceMs = DEFAULT_DEBOUNCE_MS, }) {
    let state = { status: 'idle' };
    let latestQuery = '';
    let active;
    const listeners = new Set();
    const setState = (next) => {
        state = next;
        listeners.forEach((listener) => listener(next));
    };
    const cancelActive = () => {
        active?.abort();
        active = undefined;
    };
    async function run(query) {
        const controller = new AbortController();
        active = controller;
        try {
            const countries = await search(query, controller.signal);
            setState(countries.length === 0
                ? { status: 'empty', query }
                : { status: 'results', query, countries });
        }
        catch (error) {
            const failure = classifyError(error);
            if (failure.kind === 'cancelled')
                return; // отменили сами, не ошибка
            setState({ status: 'error', query, failure });
        }
    }
    const runLatest = debounce(() => {
        if (latestQuery !== '')
            void run(latestQuery);
    }, debounceMs);
    return {
        getState: () => state,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        input(text) {
            latestQuery = text.trim();
            cancelActive();
            if (latestQuery === '') {
                setState({ status: 'idle' });
                return;
            }
            setState({ status: 'loading', query: latestQuery });
            runLatest();
        },
        retry() {
            if (latestQuery === '')
                return;
            cancelActive();
            setState({ status: 'loading', query: latestQuery });
            void run(latestQuery);
        },
    };
}
