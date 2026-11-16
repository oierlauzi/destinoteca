/**
 * A minimal description of SVG, enough to draw a display once and then get it
 * either as text (exports, build-time rendering, no DOM needed) or as live
 * elements (the page). Both come from the same tree, so they cannot drift.
 *
 * Text and attribute values are always escaped or set through the DOM, never
 * concatenated into markup: what a display shows comes from URLs.
 */
export type Attrs = Record<string, string | number | undefined>;

export interface VNode {
  tag: string;
  attrs: Attrs;
  children: (VNode | string)[];
  /** Called with the live element when the tree is turned into DOM. */
  ref?: (element: SVGElement) => void;
}

export function h(tag: string, attrs: Attrs = {}, children: (VNode | string)[] = [], ref?: VNode['ref']): VNode {
  return { tag, attrs, children, ref };
}

export const SVG_NS = 'http://www.w3.org/2000/svg';

function escape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Numbers are trimmed to five decimals: plenty for millimetres, and a third of the file size. */
export function num(value: number): string {
  return String(Math.round(value * 1e5) / 1e5);
}

function attr(value: string | number): string {
  return typeof value === 'number' ? num(value) : escape(value);
}

export function toString(node: VNode | string): string {
  if (typeof node === 'string') return escape(node);
  let out = `<${node.tag}`;
  for (const [name, value] of Object.entries(node.attrs)) {
    if (value !== undefined) out += ` ${name}="${attr(value)}"`;
  }
  if (node.children.length === 0) return `${out}/>`;
  return `${out}>${node.children.map(toString).join('')}</${node.tag}>`;
}

export function toDom(node: VNode, doc: Document): SVGElement {
  const element = doc.createElementNS(SVG_NS, node.tag) as SVGElement;
  for (const [name, value] of Object.entries(node.attrs)) {
    if (value !== undefined) element.setAttribute(name, typeof value === 'number' ? num(value) : value);
  }
  for (const child of node.children) {
    element.appendChild(typeof child === 'string' ? doc.createTextNode(child) : toDom(child, doc));
  }
  node.ref?.(element);
  return element;
}

/** A complete SVG file from a root <svg> node. */
export function toDocument(root: VNode, comment?: string): string {
  const withNs: VNode = { ...root, attrs: { xmlns: SVG_NS, ...root.attrs } };
  const note = comment ? `<!-- ${comment.replace(/--/g, '- -')} -->\n` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n${note}${toString(withNs)}\n`;
}
