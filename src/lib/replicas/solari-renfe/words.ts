import { FLAP } from './geometry';

/**
 * How a train's word is lettered on its wide flap. The photographs are not
 * consistent, so the words they show are set as seen:
 *
 * - `tall`: one line from the top of the flap to its foot, squeezed to the
 *   flap's width (TALGO, RAPIDO, ELECTROTREN, RAP. ARAGON);
 * - `wide`: one line in the letters of the place flaps, as large as the
 *   flap's height or width allows (INTERURBANO);
 * - `left`: two lines, each half the flap tall, against its left
 *   (TALGO PENDULAR);
 * - `block`: two lines, the first centred on the second, the pair against
 *   the flap's left (TALGO EXTREMADURA).
 *
 * Any other text is set on one line in the letters of the place flaps, as
 * large as the flap's height or width allows, whichever is tighter.
 */
export type WordStyle = 'tall' | 'wide' | 'left' | 'block';

export const SEEN_STYLES: Record<string, WordStyle> = {
  TALGO: 'tall',
  RAPIDO: 'tall',
  ELECTROTREN: 'tall',
  'RAP. ARAGON': 'tall',
  INTERURBANO: 'wide',
  'TALGO PENDULAR': 'left',
  'TALGO EXTREMADURA': 'block',
};

/** Advance widths of Helvetica's capitals, in thousandths of the size (Arial and Liberation Sans share them). */
const ADVANCE: Record<string, number> = {
  A: 667, B: 667, C: 722, D: 722, E: 667, F: 611, G: 778, H: 722, I: 278, J: 500, K: 667, L: 556, M: 833,
  N: 722, Ñ: 722, O: 778, P: 667, Q: 778, R: 722, S: 667, T: 611, U: 722, V: 667, W: 944, X: 667, Y: 667, Z: 611,
  ' ': 278, '.': 278, ',': 278, '-': 333, '/': 278, "'": 191,
};
const advance = (text: string): number => Array.from(text).reduce((sum, ch) => sum + (ADVANCE[ch] ?? 556), 0) / 1000;

/** Capitals are this much of the size tall. */
const CAP = 0.716;
/** The letters of the place flaps, narrower than the font's. */
export const LETTER_SQUEEZE = 0.66;
export const LETTER_SIZE = 12;
/** From the flap's top and foot to the lettering, and from its sides. */
export const LETTER_MARGIN = 0.7;
const SIDE = 0.6;
/** Between two lines, which the flap's split runs through. */
const LINE_GAP = 1;

export interface WordLine {
  text: string;
  /** From the flap's left edge; `anchor` says which end or the middle. */
  x: number;
  anchor: 'start' | 'middle';
  /** From the flap's top. */
  baseline: number;
  size: number;
  /** The width the line is set to. */
  width: number;
}

export function styleOf(text: string): WordStyle {
  return SEEN_STYLES[text] ?? 'wide';
}

/** Two lines, cut at the space nearest the middle. */
function split(text: string): [string, string] {
  const spaces = Array.from(text.matchAll(/ /g), (m) => m.index!);
  if (!spaces.length) return [text, ''];
  const at = spaces.reduce((best, i) => (Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2) ? i : best));
  return [text.slice(0, at), text.slice(at + 1)];
}

export function wordLines(text: string, flapWidth: number): WordLine[] {
  const value = text.trim();
  if (!value) return [];
  const room = flapWidth - 2 * SIDE;
  const style = styleOf(value);
  const natural = (line: string, size: number): number => advance(line) * size * LETTER_SQUEEZE;
  if (style === 'tall') {
    const size = LETTER_SIZE;
    return [{ text: value, x: flapWidth / 2, anchor: 'middle', baseline: FLAP.height - LETTER_MARGIN, size, width: Math.min(room, natural(value, size)) }];
  }
  if (style === 'wide') {
    const size = Math.min(LETTER_SIZE, room / (advance(value) * LETTER_SQUEEZE));
    return [{ text: value, x: flapWidth / 2, anchor: 'middle', baseline: (FLAP.height + CAP * size) / 2, size, width: Math.min(room, natural(value, size)) }];
  }
  const cap = (FLAP.height - 2 * LETTER_MARGIN - LINE_GAP) / 2;
  const size = cap / CAP;
  const lines = split(value).filter(Boolean);
  const widths = lines.map((line) => Math.min(room, natural(line, size)));
  const block = Math.max(...widths);
  return lines.map((line, i) => ({
    text: line,
    x: style === 'block' ? SIDE + block / 2 : SIDE,
    anchor: style === 'block' ? 'middle' : 'start',
    baseline: LETTER_MARGIN + cap + i * (cap + LINE_GAP),
    size,
    width: widths[i]!,
  }));
}
