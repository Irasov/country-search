import { h } from './dom.js';
import { renderDetails, renderState, type ViewActions } from './render.js';
import { createSearchController } from './searchController.js';
import { searchCountries } from './searchCountries.js';

const controller = createSearchController({ search: searchCountries });

const input = h('input', {
  type: 'search',
  placeholder: 'Например, spain',
  autocomplete: 'off',
  'aria-label': 'Название страны',
});
const results = h('section', { 'aria-live': 'polite' });
const dialog = h('dialog', { class: 'details' });

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close(); // клик по подложке
});

const actions: ViewActions = {
  onRetry: () => controller.retry(),
  onSelect: (country) => {
    dialog.replaceChildren(...renderDetails(country, () => dialog.close()));
    dialog.showModal();
  },
};

const render = (): void => {
  results.replaceChildren(renderState(controller.getState(), actions));
};

input.addEventListener('input', () => controller.input(input.value));
controller.subscribe(render);

document.body.append(
  h('main', {}, h('h1', {}, 'Country Search'), input, results),
  dialog,
);
render();
