import { BOLD, CHARS, REGULAR } from './helvetica-metrics';

/*
 * How wide a line is set in the stack the replicas name for printed text
 * (Helvetica, Arial, Liberation Sans: one set of widths). No kerning, as
 * neither SVG renderers nor the signs' own lettering apply it reliably.
 */
const index = new Map(Array.from(CHARS, (ch, i) => [ch, i]));

/** An unlisted character counts as a digit's width, the commonest in the font. */
const FALLBACK = 556;

/** The advance width of `text` set at `size`, regular or bold. */
export function helveticaWidth(text: string, size: number, bold = false): number {
  const table = bold ? BOLD : REGULAR;
  let sum = 0;
  for (const ch of text) {
    const i = index.get(ch);
    sum += i === undefined ? FALLBACK : (table[i] ?? FALLBACK);
  }
  return (sum * size) / 1000;
}
