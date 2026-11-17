/**
 * Where everything goes on a Solari split-flap board, in units where a
 * character flap is 7 wide and 10 tall. From photographs of Renfe's boards
 * of the 1970s and 1980s, set square.
 *
 * A row is a sequence of fields: a wide flap with a word (the train), twelve
 * character flaps (a place), a time (a flap of two digits for the hour, a
 * printed dot, a flap for each digit of the minutes), the platform on a flap
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
const FIELD_GAP = 3.2;
export const ROW_PITCH = FLAP.height + 2.8;
export const MINUTE_DOT = 2.2;

const charsWidth = (count: number): number => count * FLAP.width + (count - 1) * FLAP_GAP;

const WIDTHS: Record<FieldKind, (key: string) => number> = {
  // The train's word is about three and a half characters wide, "por" a little wider.
  word: (key) => (key === 'p' ? charsWidth(5) : charsWidth(3.4)),
  place: () => charsWidth(12),
  time: () => charsWidth(2) + MINUTE_DOT + 2 * FLAP.width + FLAP_GAP,
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
export const DEFAULT_ROWS: Record<Variant, number> = { largo: 8, cercanias: 9 };

const FRAME = { side: 6, title: 13, bottom: 7 };
const INNER = { side: 5, legends: 9, bottom: 4 };

export interface Layout {
  width: number;
  height: number;
  frame: typeof FRAME;
  panel: { x: number; y: number; width: number; height: number };
  fields: Field[];
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
    legendY: panelY + 6,
    rowY: (row) => rowsTop + row * ROW_PITCH,
  };
}
