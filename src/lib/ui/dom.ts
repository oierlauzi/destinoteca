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
export function download(filename: string, content: string | Blob, type: string): void {
  const url = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type }));
  const link = el('a', { attrs: { href: url, download: filename } });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * A standalone SVG file drawn on a canvas `width` pixels wide, at its own
 * proportions, as a PNG. What the SVG leaves transparent stays transparent.
 */
export async function svgToPng(svg: string, width = 2400): Promise<Blob> {
  const box = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(svg);
  const ratio = box ? Number(box[2]) / Number(box[1]) : 0.5;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The SVG could not be drawn'));
      image.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = Math.round(width * ratio);
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No PNG'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}
