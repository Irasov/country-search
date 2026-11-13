import { h } from './dom.js';
import { describeCountry, failureMessage, formatList, formatNumber, orDash, } from './format.js';
function renderFlag(country, className) {
    if (country.flagUrl === null) {
        return h('div', { class: `${className} flag--empty`, 'aria-hidden': 'true' });
    }
    return h('img', {
        class: className,
        src: country.flagUrl,
        alt: `Флаг: ${country.name}`,
        loading: 'lazy',
    });
}
function renderCard(country, onSelect) {
    const card = h('button', { type: 'button', class: 'card' }, renderFlag(country, 'flag'), h('div', { class: 'card__body' }, h('h2', {}, country.name), h('p', {}, `Столица: ${orDash(country.capital)}`), h('p', {}, `Регион: ${orDash(country.region)}`), h('p', {}, `Население: ${formatNumber(country.population)}`)));
    card.addEventListener('click', () => onSelect(country));
    return h('li', {}, card);
}
export function renderState(state, actions) {
    switch (state.status) {
        case 'idle':
            return h('p', { class: 'status' }, 'Начните вводить название страны.');
        case 'loading':
            return h('div', { class: 'status loading', role: 'status' }, h('span', { class: 'spinner', 'aria-hidden': 'true' }), 'Загрузка…');
        case 'empty':
            return h('p', { class: 'status' }, `По запросу «${state.query}» ничего не найдено.`);
        case 'error': {
            const retry = h('button', { type: 'button' }, 'Повторить');
            retry.addEventListener('click', actions.onRetry);
            return h('div', { class: 'error', role: 'alert' }, h('p', {}, failureMessage(state.failure)), retry);
        }
        case 'results':
            return h('ul', { class: 'cards' }, ...state.countries.map((country) => renderCard(country, actions.onSelect)));
    }
}
export function renderDetails(country, onClose) {
    const close = h('button', { type: 'button', class: 'details__close', 'aria-label': 'Закрыть' }, '×');
    close.addEventListener('click', onClose);
    const rows = [
        ['Площадь', formatNumber(country.area, ' км²')],
        ['Население', formatNumber(country.population)],
        ['Границы', formatList(country.borders)],
        ['Языки', formatList(country.languages)],
        ['Валюта', formatList(country.currencies)],
    ];
    const list = h('dl', { class: 'details__list' });
    for (const [term, value] of rows) {
        list.append(h('dt', {}, term), h('dd', {}, value));
    }
    return [
        close,
        renderFlag(country, 'flag flag--large'),
        h('h2', {}, country.name),
        h('p', {}, describeCountry(country)),
        list,
    ];
}
