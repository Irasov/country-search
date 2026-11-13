export function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(props)) {
        if (value !== undefined)
            element.setAttribute(name, value);
    }
    element.append(...children); // строки становятся текстовыми узлами, а не HTML
    return element;
}
