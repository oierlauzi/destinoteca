import { fromRows, type ProportionalFont } from './proportional';

/**
 * The light, proportional 7-dot typeface of the PAGE Ibérica signs of Atocha
 * Cercanías, whose flip-dot line is one continuous matrix lit by LEDs: strokes
 * one dot thick, most capitals 5 wide, one blank column between letters. It
 * has lowercase for "min", whose letters stand on the baseline and reach row
 * 2, like the upper dot of the colon.
 *
 * No ROM of these signs has been read. The glyphs are taken dot by dot from
 * photographs, where the photographs show them; the rest are drawn in the
 * same style and are marked as reconstructions below. Corrections from better
 * photographs are welcome.
 */
const SEEN: Record<string, string[]> = {
  // "SIN SERVICIO 04:35", platform access display (Europa Press).
  S: ['.###.', '#...#', '#....', '.###.', '....#', '#...#', '.###.'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  E: ['####', '#...', '#...', '###.', '#...', '#...', '####'],
  R: ['####.', '#...#', '#...#', '####.', '#..#.', '#...#', '#...#'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '0': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '4': ['#....', '#....', '#..#.', '#..#.', '#####', '...#.', '...#.'],
  ':': ['.', '.', '#', '.', '.', '.', '#'],
  '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  // "P.PIO-VILLAL 7 min", platform display (Twitter).
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  '-': ['...', '...', '...', '###', '...', '...', '...'],
  L: ['#...', '#...', '#...', '#...', '#...', '#...', '####'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  '7': ['#####', '....#', '....#', '...#.', '..#..', '..#..', '..#..'],
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  i: ['#', '.', '#', '#', '#', '#', '#'],
  n: ['....', '....', '###.', '#..#', '#..#', '#..#', '#..#'],
  // "MOST/EL SOTO" (Telemadrid) and "GUADALAJARA" (Twitter), at a lower resolution.
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  G: ['.###.', '#...#', '#....', '#..##', '#...#', '#...#', '.####'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
};

/** Not seen in any photograph yet: drawn to match. */
const RECONSTRUCTED: Record<string, string[]> = {
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  F: ['####', '#...', '#...', '###.', '#...', '#...', '#...'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  // No room above a 7-dot capital for a tilde: it takes the top row, over a shortened N.
  Ñ: ['.###.', '.....', '#...#', '##..#', '#.#.#', '#..##', '#...#'],
  '1': ['.#.', '##.', '.#.', '.#.', '.#.', '.#.', '###'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'],
  '(': ['.#', '#.', '#.', '#.', '#.', '#.', '.#'],
  ')': ['#.', '.#', '.#', '.#', '.#', '.#', '#.'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
};

const GLYPHS = new Map<string, number[]>();
for (const [char, rows] of Object.entries({ ...RECONSTRUCTED, ...SEEN })) GLYPHS.set(char, fromRows(rows));

/** Which characters come from photographs, for the record. */
export const THIN_SEEN_IN_PHOTOGRAPHS: readonly string[] = Object.keys(SEEN);

const LOWERCASE = new Set(['m', 'i', 'n']);

export const pageIbericaThin7: ProportionalFont = {
  id: 'page-iberica-thin-7',
  rows: 7,
  spacing: 1,
  // Between "SIN" and "SERVICIO" there are three blank columns.
  space: 1,
  glyph: (char) => GLYPHS.get(char),
  // Capitals only, accents dropped; the tilde of Ñ is kept.
  fold: (text) =>
    text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-̂̄-ͯ]/g, '')
      .normalize('NFC'),
};

/**
 * The same typeface as written by the controller itself, for its own words
 * ("min"): lowercase is kept where the font has it.
 */
export const pageIbericaThin7Own: ProportionalFont = {
  ...pageIbericaThin7,
  fold: (text) => Array.from(text, (char) => (LOWERCASE.has(char) ? char : pageIbericaThin7.fold(char))).join(''),
};
