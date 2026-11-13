type Child = Node | string;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string | undefined> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(props)) {
    if (value !== undefined) element.setAttribute(name, value);
  }
  element.append(...children); // строки становятся текстовыми узлами, а не HTML
  return element;
}
