import type { ProportionalFont } from './proportional';

/**
 * The typeface of the LED boards MP Electronics made for ADIF's stations.
 *
 * Every character takes 7 columns, one blank column apart, on panels 11
 * rows tall that capitals fill from top to bottom. Vertical strokes are two
 * dots thick and horizontal ones a single dot, and the zero is slashed.
 * There is no room for a mark over a capital, so a vowel with an accent, and
 * the Ñ, are written as lowercase letters with the mark above them:
 * "CASTELLó", "CORUñA".
 *
 * No ROM has been read. Each character is drawn here as a skeleton one dot
 * thick, 6 wide and 11 tall, thickened by one dot to the right: that is how
 * the letters of the photographs are built. The L and the ó were read dot by
 * dot from a close photograph and the slashed zero from others; the rest
 * follow the same construction and may differ from the real ones in detail.
 */
const CAPITALS: Record<string, string> = {
  A: '..##../.#..#./#....#/#....#/#....#/######/#....#/#....#/#....#/#....#/#....#',
  B: '#####./#....#/#....#/#....#/#....#/#####./#....#/#....#/#....#/#....#/#####.',
  C: '.####./#....#/#...../#...../#...../#...../#...../#...../#...../#....#/.####.',
  D: '#####./#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/#####.',
  E: '######/#...../#...../#...../#...../#####./#...../#...../#...../#...../######',
  F: '######/#...../#...../#...../#...../#####./#...../#...../#...../#...../#.....',
  G: '.####./#....#/#...../#...../#...../#..###/#....#/#....#/#....#/#....#/.####.',
  H: '#....#/#....#/#....#/#....#/#....#/######/#....#/#....#/#....#/#....#/#....#',
  I: '.###../..#.../..#.../..#.../..#.../..#.../..#.../..#.../..#.../..#.../.###..',
  J: '...###/.....#/.....#/.....#/.....#/.....#/.....#/.....#/#....#/#....#/.####.',
  K: '#....#/#....#/#...#./#..#../#.#.../##..../#.#.../#..#../#...#./#....#/#....#',
  L: '#...../#...../#...../#...../#...../#...../#...../#...../#...../#...../######',
  M: '#....#/##..##/#.##.#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#',
  N: '#....#/##...#/##...#/#.#..#/#.#..#/#..#.#/#..#.#/#...##/#...##/#....#/#....#',
  O: '.####./#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/.####.',
  P: '#####./#....#/#....#/#....#/#....#/#####./#...../#...../#...../#...../#.....',
  Q: '.####./#....#/#....#/#....#/#....#/#....#/#....#/#....#/#..#.#/#...#./.###.#',
  R: '#####./#....#/#....#/#....#/#....#/#####./#.#.../#..#../#...#./#....#/#....#',
  S: '.####./#....#/#...../#...../#...../.####./.....#/.....#/.....#/#....#/.####.',
  T: '######/..#.../..#.../..#.../..#.../..#.../..#.../..#.../..#.../..#.../..#...',
  U: '#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/#....#/.####.',
  V: '#....#/#....#/#....#/#....#/#....#/#....#/#....#/.#..#./.#..#./..##../..##..',
  W: '#....#/#....#/#....#/#....#/#....#/#....#/#....#/#.##.#/#.##.#/##..##/#....#',
  X: '#....#/#....#/.#..#./.#..#./..##../..##../.#..#./.#..#./#....#/#....#/#....#',
  Y: '#....#/#....#/#....#/.#..#./.#..#./..##../..#.../..#.../..#.../..#.../..#...',
  Z: '######/.....#/....#./...#../...#../..#.../..#.../.#..../.#..../#...../######',
  // The zero is slashed, which tells it from the O.
  '0': '.####./#....#/#....#/#...##/#...##/#..#.#/#.#..#/##...#/##...#/#....#/.####.',
  '1': '..#.../.##.../#.#.../..#.../..#.../..#.../..#.../..#.../..#.../..#.../#####.',
  '2': '.####./#....#/.....#/.....#/....#./...#../..#.../.#..../#...../#...../######',
  '3': '.####./#....#/.....#/.....#/.....#/..###./.....#/.....#/.....#/#....#/.####.',
  '4': '....#./...##./..#.#./.#..#./#...#./#...#./######/....#./....#./....#./....#.',
  '5': '######/#...../#...../#...../#####./.....#/.....#/.....#/.....#/#....#/.####.',
  '6': '.####./#...../#...../#...../#####./#....#/#....#/#....#/#....#/#....#/.####.',
  '7': '######/.....#/....#./....#./...#../...#../..#.../..#.../..#.../..#.../..#...',
  '8': '.####./#....#/#....#/#....#/.####./#....#/#....#/#....#/#....#/#....#/.####.',
  '9': '.####./#....#/#....#/#....#/#....#/.#####/.....#/.....#/.....#/.....#/.####.',
  ':': '....../....../....../..#.../....../....../....../..#.../....../....../......',
  '.': '....../....../....../....../....../....../....../....../....../....../..#...',
  ',': '....../....../....../....../....../....../....../....../..#.../..#.../.#....',
  '/': '.....#/.....#/....#./....#./...#../...#../..#.../..#.../.#..../.#..../#.....',
  '-': '....../....../....../....../....../.####./....../....../....../....../......',
  "'": '..#.../..#.../....../....../....../....../....../....../....../....../......',
  '(': '...#../..#.../.#..../.#..../.#..../.#..../.#..../.#..../.#..../..#.../...#..',
  ')': '.#..../..#.../...#../...#../...#../...#../...#../...#../...#../..#.../.#....',
  '!': '..#.../..#.../..#.../..#.../..#.../..#.../..#.../..#.../....../..#.../......',
  '?': '.####./#....#/.....#/....#./...#../..#.../..#.../....../....../..#.../......',
  '·': '....../....../....../....../....../..#.../....../....../....../....../......',
};

/** Lowercase bodies, 8 rows that end on the baseline, for the accented vowels. */
const SMALL: Record<string, string> = {
  a: '.####./.....#/.....#/.#####/#....#/#....#/#...##/.###.#',
  e: '.####./#....#/#....#/######/#...../#...../#....#/.####.',
  i: '.##.../..#.../..#.../..#.../..#.../..#.../..#.../.###..',
  o: '.####./#....#/#....#/#....#/#....#/#....#/#....#/.####.',
  u: '#....#/#....#/#....#/#....#/#....#/#....#/#...##/.###.#',
  c: '.####./#....#/#...../#...../#...../#....#/.####./......',
  n: '#.###./##...#/#....#/#....#/#....#/#....#/#....#/#....#',
};

/** Marks above a small letter, two rows, drawn as they are (not thickened). */
const ACUTE = ['...###.', '..##...'];
const GRAVE = ['.###...', '...##..'];
const DIAERESIS = ['.##..##', '.##..##'];
const TILDE = ['..##..#', '.#..##.'];

const WIDTH = 7;
const ROWS = 11;
/** First row of a capital: they fill the panel. */
const CAP_TOP = 0;
/** First row of a small letter's body: three rows below the top of a capital, leaving two for its mark. */
const SMALL_TOP = CAP_TOP + 3;

type Bitmap = boolean[][];

const blank = (): Bitmap => Array.from({ length: ROWS }, () => Array.from({ length: WIDTH }, () => false));

/** A skeleton thickened one dot to the right, its top at `top`. */
function stamp(bitmap: Bitmap, skeleton: string, top: number): Bitmap {
  skeleton.split('/').forEach((row, r) => {
    for (let c = 0; c < row.length; c++) {
      if (row[c] !== '#') continue;
      bitmap[top + r]![c] = true;
      if (c + 1 < WIDTH) bitmap[top + r]![c + 1] = true;
    }
  });
  return bitmap;
}

function mark(bitmap: Bitmap, rows: string[], top: number): Bitmap {
  rows.forEach((row, r) => {
    for (let c = 0; c < row.length; c++) if (row[c] === '#') bitmap[top + r]![c] = true;
  });
  return bitmap;
}

const toColumns = (bitmap: Bitmap): number[] =>
  Array.from({ length: WIDTH }, (_, c) => bitmap.reduce((byte, row, r) => (row[c] ? byte | (1 << r) : byte), 0));

const GLYPHS = new Map<string, number[]>();
for (const [char, skeleton] of Object.entries(CAPITALS)) GLYPHS.set(char, toColumns(stamp(blank(), skeleton, CAP_TOP)));

const ACCENTED: Record<string, [string, string[]]> = {
  á: ['a', ACUTE], é: ['e', ACUTE], í: ['i', ACUTE], ó: ['o', ACUTE], ú: ['u', ACUTE],
  à: ['a', GRAVE], è: ['e', GRAVE], ò: ['o', GRAVE],
  ï: ['i', DIAERESIS], ü: ['u', DIAERESIS],
  ñ: ['n', TILDE],
};
for (const [char, [base, marks]] of Object.entries(ACCENTED)) {
  GLYPHS.set(char, toColumns(mark(stamp(blank(), SMALL[base]!, SMALL_TOP), marks, CAP_TOP)));
}
// The cedilla hangs in the last row, under a small c.
GLYPHS.set('ç', toColumns(mark(stamp(blank(), SMALL.c!, SMALL_TOP), ['...##..'], ROWS - 1)));

/** Read from photographs dot by dot, for the record; the rest are built as described above. */
export const MP_SEEN_IN_PHOTOGRAPHS: readonly string[] = ['L', 'ó', '0'];

/** Capitals with a mark, which the board writes as small letters. */
const SMALL_FORMS: Record<string, string> = {
  Á: 'á', É: 'é', Í: 'í', Ó: 'ó', Ú: 'ú', À: 'à', È: 'è', Ò: 'ò', Ï: 'ï', Ü: 'ü', Ç: 'ç', Ñ: 'ñ',
};

/**
 * Text as the board writes it: capitals, accented vowels as small letters,
 * and a blank cell for anything it has no glyph for, so that the columns
 * stay where they are.
 */
function fold(text: string): string {
  return Array.from(text.normalize('NFC').toUpperCase(), (char) => {
    const small = SMALL_FORMS[char];
    if (small) return small;
    return char === ' ' || GLYPHS.has(char) ? char : ' ';
  }).join('');
}

export const mpElectronicsAdif: ProportionalFont = {
  id: 'mp-electronics-adif',
  rows: ROWS,
  spacing: 1,
  // A space is one more character cell, so that every character advances 8 columns.
  space: WIDTH,
  glyph: (char) => GLYPHS.get(char),
  fold,
};

/** Columns a character advances, blank column included. */
export const MP_ADVANCE = WIDTH + 1;
