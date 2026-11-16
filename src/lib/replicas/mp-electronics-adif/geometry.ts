import { MP_ADVANCE } from '../../hardware';
import type { Column } from './labels';

/**
 * Where everything goes on one board, in units of the distance between two
 * LEDs. Measured on a photograph of a board at Barcelona Sants taken nearly
 * straight on, set square: a character advances 8 LEDs, a line of
 * characters is 13 LEDs tall, and each field of a row is a panel of its own.
 */
export const PANEL_ROWS = 13;
export const ROWS = 7;

/** Characters of each field, from the longest texts photographed. */
export const CELLS: Record<Column, number> = {
  time: 5, // 10:45
  place: 18, // MADRID PTA. ATOCHA
  train: 13, // A 03073/34073
  platform: 4, // the number stands at the right: "  14"
  remarks: 14, // ESTIMADO 15:41
};
export const COLUMNS: Column[] = ['time', 'place', 'train', 'platform', 'remarks'];

const SIDE = 11;
const GAP = 3;
export const HEADER = 27;
/** From the bottom of the header to the first row: three lines of column legends, or two. */
const LEGENDS_3 = 40;
const LEGENDS_2 = 22;
const ROW_PITCH = PANEL_ROWS + 4;
const WIDE_GAP = 4;
const BOTTOM = 11;
/** Between boards hung next to or above one another. */
export const BOARD_GAP = 10;

export const panelCols = (column: Column): number => CELLS[column] * MP_ADVANCE;

/** Left edge of each field's panels. */
export const FIELD_X = {} as Record<Column, number>;
{
  let x = SIDE;
  for (const column of COLUMNS) {
    FIELD_X[column] = x;
    x += panelCols(column) + GAP;
  }
}

export const BOARD_WIDTH = FIELD_X.remarks + panelCols('remarks') + SIDE;

/**
 * The vertical layout of a board, which depends on how many lines of legends
 * it prints: boards with a regional language have a taller band above the
 * rows (Barcelona Sants) than those with Spanish and English only (Madrid).
 */
export interface Layout {
  rowsTop: number;
  rowY(row: number): number;
  wide: { x: number; y: number; cols: number };
  height: number;
}

export function layout(threeLines: boolean): Layout {
  const rowsTop = HEADER + (threeLines ? LEGENDS_3 : LEGENDS_2);
  const rowY = (row: number): number => rowsTop + row * ROW_PITCH;
  // From the place field to the end of the remarks, in whole characters.
  const wide = {
    x: FIELD_X.place,
    y: rowY(ROWS - 1) + PANEL_ROWS + WIDE_GAP,
    cols: Math.floor((FIELD_X.remarks + panelCols('remarks') - FIELD_X.place) / MP_ADVANCE) * MP_ADVANCE,
  };
  return { rowsTop, rowY, wide, height: wide.y + PANEL_ROWS + BOTTOM };
}

/** Several boards, `across` side by side and `down` one above another. */
export function stackSize(across: number, down: number, threeLines: boolean): { width: number; height: number } {
  const { height } = layout(threeLines);
  return {
    width: across * BOARD_WIDTH + (across - 1) * BOARD_GAP,
    height: down * height + (down - 1) * BOARD_GAP,
  };
}
