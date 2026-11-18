/**
 * The characters of Ikusi's liquid-crystal railway signs: a matrix 7 dots
 * wide and 9 tall per character, on the glasses of the platform signs of
 * Atocha Cercanías and of Metro Bilbao's platform signs and notice boards,
 * and on the LED modules that later replaced Metro Bilbao's platform
 * glasses, which draw the same letters. The glasses are as large as those
 * of Ikusi's 7 × 11 airport boards, so the dots are further apart up and
 * down than across. Heavy capitals with strokes two dots thick both ways;
 * bars at the top (rows 0 and 1), in the middle (4 and 5) and at the bottom
 * (7 and 8). Some characters have marks of their own: the S ends in a
 * single dot at each tip, the B has a foot at both ends of its stem, the N
 * a single dot at the top of one stem and the foot of the other, the 1 a
 * foot; the I, the T and the N are six dots wide.
 *
 * Read dot by dot on a frontal photograph of a Metro Bilbao platform sign
 * with LED modules (B, A, S, U, R, I, 0, 2, 7), and in shape on others, with
 * glasses and with LED (N, E, T, X, 3, 4, 5, the brackets and the asterisk
 * in Bilbao; the 1 at Atocha). That Atocha's signs have these characters
 * and not the airports' is inferred from the shapes of their letters, the
 * A's narrow top above all: their photographs do not let the dots be
 * counted. No ROM has been read: the rest are drawn on the same grid to
 * match, and listed apart. Ikusi's airport boards have characters of 7 × 11
 * (ikusi-lcd.ts).
 */
const GLYPHS: Record<string, string[]> = {
  A: ['..###..', '.#####.', '##...##', '##...##', '#######', '#######', '##...##', '##...##', '##...##'],
  B: ['#####..', '.##.##.', '.##.##.', '.####..', '.#####.', '.##..##', '.##..##', '.######', '######.'],
  C: ['.#####.', '#######', '##...##', '##.....', '##.....', '##.....', '##...##', '#######', '.#####.'],
  D: ['######.', '#######', '##...##', '##...##', '##...##', '##...##', '##...##', '#######', '######.'],
  E: ['#######', '#######', '##.....', '##.....', '######.', '######.', '##.....', '#######', '#######'],
  F: ['#######', '#######', '##.....', '##.....', '######.', '######.', '##.....', '##.....', '##.....'],
  G: ['.#####.', '#######', '##.....', '##.....', '##.####', '##.####', '##...##', '#######', '.#####.'],
  H: ['##...##', '##...##', '##...##', '##...##', '#######', '#######', '##...##', '##...##', '##...##'],
  I: ['######.', '######.', '..##...', '..##...', '..##...', '..##...', '..##...', '######.', '######.'],
  J: ['...####', '...####', '.....##', '.....##', '.....##', '.....##', '##...##', '#######', '.#####.'],
  K: ['##...##', '##..##.', '##.##..', '####...', '###....', '####...', '##.##..', '##..##.', '##...##'],
  L: ['##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '#######', '#######'],
  M: ['##...##', '###.###', '#######', '##.#.##', '##...##', '##...##', '##...##', '##...##', '##...##'],
  // Six dots wide, with a single dot at the top of the left stem and at the foot of the right one (read on a notice board).
  N: ['#...##.', '##..##.', '###.##.', '######.', '######.', '##.###.', '##.###.', '##..##.', '##...#.'],
  O: ['.#####.', '#######', '##...##', '##...##', '##...##', '##...##', '##...##', '#######', '.#####.'],
  P: ['######.', '#######', '##...##', '##...##', '#######', '######.', '##.....', '##.....', '##.....'],
  Q: ['.#####.', '#######', '##...##', '##...##', '##...##', '##.#.##', '##..##.', '#######', '.####.#'],
  // The leg starts inside the bowl and steps out to the corner.
  R: ['######.', '#######', '##...##', '##...##', '######.', '#####..', '##.###.', '##..###', '##...##'],
  // Each tip ends in one dot standing apart.
  S: ['.#####.', '#######', '##....#', '##.....', '.#####.', '.....##', '#....##', '#######', '.#####.'],
  T: ['######.', '######.', '..##...', '..##...', '..##...', '..##...', '..##...', '..##...', '..##...'],
  U: ['##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '#######', '.#####.'],
  V: ['##...##', '##...##', '##...##', '##...##', '##...##', '.##.##.', '.##.##.', '..###..', '...#...'],
  W: ['##...##', '##...##', '##...##', '##.#.##', '##.#.##', '##.#.##', '#######', '###.###', '##...##'],
  X: ['##...##', '##...##', '.##.##.', '..###..', '..###..', '..###..', '.##.##.', '##...##', '##...##'],
  Y: ['##...##', '##...##', '.##.##.', '..###..', '..##...', '..##...', '..##...', '..##...', '..##...'],
  Z: ['#######', '#######', '....###', '...###.', '..###..', '.###...', '###....', '#######', '#######'],
  Ñ: ['.###.##', '##.###.', '.......', '##...##', '###..##', '####.##', '##.####', '##..###', '##...##'],
  '0': ['.#####.', '#######', '##...##', '##...##', '##...##', '##...##', '##...##', '#######', '.#####.'],
  // With a foot, as photographed at Atocha.
  '1': ['...##..', '..###..', '.####..', '...##..', '...##..', '...##..', '...##..', '.######', '.######'],
  '2': ['.#####.', '#######', '##...##', '....###', '...###.', '..###..', '.###...', '#######', '#######'],
  '3': ['.#####.', '#######', '##...##', '.....##', '..####.', '.....##', '##...##', '#######', '.#####.'],
  '4': ['....##.', '...###.', '..####.', '.##.##.', '##..##.', '#######', '#######', '....##.', '....##.'],
  '5': ['#######', '#######', '##.....', '######.', '#######', '.....##', '##...##', '#######', '.#####.'],
  '6': ['.######', '#######', '##.....', '######.', '#######', '##...##', '##...##', '#######', '.#####.'],
  '7': ['#######', '#######', '.....##', '....###', '...###.', '..###..', '.###...', '###....', '##.....'],
  '8': ['.#####.', '#######', '##...##', '.#####.', '.#####.', '##...##', '##...##', '#######', '.#####.'],
  '9': ['.#####.', '#######', '##...##', '##...##', '#######', '.######', '.....##', '#######', '######.'],
  '(': ['...##..', '..##...', '.##....', '.##....', '.##....', '.##....', '.##....', '..##...', '...##..'],
  ')': ['..##...', '...##..', '....##.', '....##.', '....##.', '....##.', '....##.', '...##..', '..##...'],
  ':': ['.......', '.......', '..##...', '..##...', '.......', '.......', '..##...', '..##...', '.......'],
  '-': ['.......', '.......', '.......', '.......', '.#####.', '.#####.', '.......', '.......', '.......'],
  '.': ['.......', '.......', '.......', '.......', '.......', '.......', '.......', '..##...', '..##...'],
  ',': ['.......', '.......', '.......', '.......', '.......', '.......', '..##...', '..##...', '.##....'],
  '/': ['.....##', '.....##', '....##.', '....##.', '...##..', '..##...', '.##....', '##.....', '##.....'],
  '*': ['.......', '...#...', '.#.#.#.', '..###..', '#######', '..###..', '.#.#.#.', '...#...', '.......'],
  "'": ['..##...', '..##...', '..##...', '.......', '.......', '.......', '.......', '.......', '.......'],
};

export const IKUSI_7X9_COLS = 7;
export const IKUSI_7X9_ROWS = 9;

/** Read dot by dot on a frontal photograph. */
export const IKUSI_7X9_READ: readonly string[] = [...'ABSURI', ...'027'];
/** Seen in photographs, in shape if not dot by dot. */
export const IKUSI_7X9_SEEN: readonly string[] = [...IKUSI_7X9_READ, 'N', ...'ETX', ...'1345', '(', ')', '*'];
/** Drawn in the same style, for want of a photograph. */
export const IKUSI_7X9_RECONSTRUCTED: readonly string[] = Object.keys(GLYPHS).filter((char) => !IKUSI_7X9_SEEN.includes(char));

const COLUMNS = new Map<string, number[]>(
  Object.entries(GLYPHS).map(([char, rows]) => [
    char,
    Array.from({ length: IKUSI_7X9_COLS }, (_, c) => rows.reduce((byte, row, r) => (row[c] === '#' ? byte | (1 << r) : byte), 0)),
  ]),
);

/** The rows a glyph is drawn from, for tests and documentation. */
export const ikusi7x9Rows = (char: string): readonly string[] | undefined => GLYPHS[char];

const foldChar = (char: string): string => {
  if (char === 'Ñ' || char === ' ' || COLUMNS.has(char)) return char;
  const bare = char.normalize('NFD').replace(/\p{Mn}/gu, '');
  return COLUMNS.has(bare) ? bare : ' ';
};

export const ikusi7x9 = {
  id: 'ikusi-lcd-7x9',
  cols: IKUSI_7X9_COLS,
  rows: IKUSI_7X9_ROWS,
  /** One number per column, bit 0 the top dot; a blank for a character the font lacks. */
  glyph: (char: string): number[] => COLUMNS.get(char) ?? Array.from({ length: IKUSI_7X9_COLS }, () => 0),
  /** Capitals without accents but the Ñ, and a blank cell for anything it has no character for. */
  fold: (text: string): string => Array.from(text.normalize('NFC').toUpperCase(), foldChar).join(''),
};
