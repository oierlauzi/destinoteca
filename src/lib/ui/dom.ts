/** Small helpers for building DOM by hand. Text always goes in as text, never as markup. */

type Child = Node | string | null | undefined | false;

export interface Props {
  class?: string;
  text?: string;
  /** Any attribute. `undefined` and `false` leave it out; `true` sets it empty. */
  attrs?: Record<string, string | number | boolean | undefined>;
  on?: Partial<{ [K in keyof HTMLElementEventMap]: (event: HTMLElementEventMap[K]) => void }>;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Props = {}, children: Child[] = []): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [name, value] of Object.entries(props.attrs ?? {})) {
    if (value === undefined || value === false) continue;
    node.setAttribute(name, value === true ? '' : String(value));
  }
  for (const [name, handler] of Object.entries(props.on ?? {})) {
    node.addEventListener(name, handler as EventListener);
  }
  for (const child of children) if (child) node.append(child);
  return node;
}

let counter = 0;

/** An id unique on the page, for tying labels to controls. */
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

/** Runs `fn` once things have been quiet for `ms`. For text typed a letter at a time. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Puts text where the caret is in a field, and leaves the caret after it. */
export function insertAtCursor(input: HTMLInputElement, text: string): void {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? input.value.length;
  const limit = input.maxLength > 0 ? input.maxLength : Infinity;
  const next = input.value.slice(0, start) + text + input.value.slice(end);
  if (Array.from(next).length > limit) return;
  input.value = next;
  const caret = start + text.length;
  input.setSelectionRange(caret, caret);
  input.focus();
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Copies text, or selects it for the visitor to copy where the clipboard is out of reach. */
export async function copyText(text: string, fallback?: HTMLTextAreaElement | HTMLInputElement): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    fallback?.select();
    return false;
  }
}

/** Offers a file made in the page for download. */
export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = el('a', { attrs: { href: url, download: filename } });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
