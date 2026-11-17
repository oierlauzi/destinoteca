/**
 * Where everything goes on a Solari split-flap board, in units where a
 * character flap is 7 wide and 10 tall. From photographs of Renfe's boards
 * of the 1970s and 1980s, set square.
 *
 * A row is a sequence of fields: a wide flap with a word (the train), twelve
 * character flaps (a place), a time (a flap with the two digits of the hour
 * and a printed dot, a flap for each digit of the minutes), the platform on a flap
 * of two characters, and two lamps.
 */
export type Variant = 'largo' | 'cercanias';
export type FieldKind = 'word' | 'place' | 'time' | 'platform' | 'lamps';

export interface Field {
  key: string;
  kind: FieldKind;
  /** The printed legend over the column. */
  legend: string;
  x: number;
  width: number;
}

export const FLAP = { width: 7, height: 10 };
/** Between two flaps of the same field. */
export const FLAP_GAP = 0.8;
/** Between two columns: about a character flap. */
const FIELD_GAP = FLAP.width;
export const ROW_PITCH = FLAP.height + 2.8;
/** The hour flap: its two digits as far apart as the minutes', from its left edge, and the dot printed after them. */
export const HOUR_FLAP = 15;

const charsWidth = (count: number): number => count * FLAP.width + (count - 1) * FLAP_GAP;

const WIDTHS: Record<FieldKind, (key: string) => number> = {
  // The train's word is about six characters wide, "por" eight.
  word: (key) => (key === 'p' ? charsWidth(8) : charsWidth(6)),
  place: () => charsWidth(12),
  time: () => HOUR_FLAP + FLAP_GAP + charsWidth(2),
  platform: () => charsWidth(2),
  lamps: () => 6,
};

/** Each variant's columns, as photographed. Keys are those of the hand-typed form. */
const COLUMNS: Record<Variant, [string, FieldKind, string][]> = {
  largo: [
    ['t', 'word', 'tren'],
    ['d', 'place', 'destino'],
    ['p', 'word', 'por'],
    ['h', 'time', 'salida'],
    ['v', 'platform', 'vía'],
    ['l', 'lamps', ''],
  ],
  cercanias: [
    ['t', 'word', 'tren'],
    ['o', 'place', 'procedencia'],
    ['a', 'time', 'llegada'],
    ['d', 'place', 'destino'],
    ['s', 'time', 'salida'],
    ['v', 'platform', 'vía'],
    ['l', 'lamps', ''],
  ],
};

export const TITLES: Record<Variant, string> = { largo: 'SALIDAS LARGO RECORRIDO', cercanias: 'CERCANIAS' };
/** Every board photographed has eight rows. */
export const DEFAULT_ROWS: Record<Variant, number> = { largo: 8, cercanias: 8 };

const FRAME = { side: 6, title: 13, bottom: 7 };
const INNER = { side: 5, legends: 13.5, bottom: 4 };
/** The legends' size: "tren" takes about two fifths of its column. */
export const LEGEND_SIZE = 10.5;

/** Between boards hung next to or above one another. */
export const BOARD_GAP = 8;

export interface Layout {
  width: number;
  height: number;
  frame: typeof FRAME;
  panel: { x: number; y: number; width: number; height: number };
  fields: Field[];
  rows: number;
  legendY: number;
  rowY(row: number): number;
}

export function layout(variant: Variant, rows: number): Layout {
  let x = FRAME.side + INNER.side;
  const fields = COLUMNS[variant].map(([key, kind, legend]) => {
    const field = { key, kind, legend, x, width: WIDTHS[kind](key) };
    x += field.width + (kind === 'platform' ? 2 : FIELD_GAP);
    return field;
  });
  const panelX = FRAME.side;
  const panelY = FRAME.title;
  const panelWidth = x - FIELD_GAP + INNER.side - panelX + 1;
  const rowsTop = panelY + INNER.legends;
  const panelHeight = INNER.legends + rows * ROW_PITCH - (ROW_PITCH - FLAP.height) + INNER.bottom;
  return {
    width: panelX + panelWidth + FRAME.side,
    height: panelY + panelHeight + FRAME.bottom,
    frame: FRAME,
    panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
    fields,
    rows,
    legendY: panelY + 9.6,
    rowY: (row) => rowsTop + row * ROW_PITCH,
  };
}

/** Where board `index` of a stack `across` wide goes. */
export function boardOrigin(variant: Variant, across: number, index: number): { x: number; y: number } {
  const { width, height } = layout(variant, DEFAULT_ROWS[variant]);
  return { x: (index % across) * (width + BOARD_GAP), y: Math.floor(index / across) * (height + BOARD_GAP) };
}

/** Several boards, `across` side by side and `down` one above another. */
export function stackSize(variant: Variant, across: number, down: number): { width: number; height: number } {
  const { width, height } = layout(variant, DEFAULT_ROWS[variant]);
  return { width: across * width + (across - 1) * BOARD_GAP, height: down * height + (down - 1) * BOARD_GAP };
}
