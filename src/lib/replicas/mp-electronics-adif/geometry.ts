import { MP_ADVANCE } from '../../hardware';
import type { Column } from './labels';

/**
 * Where everything goes on one board, in units of the distance between two
 * LEDs. Measured on a photograph of an arrivals board taken straight on, set
 * square: a character advances 8 LEDs, a row of characters is 11 LEDs tall
 * (the capitals fill it), and each field of a row is a panel of its own.
 */
export const PANEL_ROWS = 11;
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
/** From the bottom of the header to the first row, where the column legends are printed, with two lines or three. */
const LEGENDS = 38;
const ROW_PITCH = PANEL_ROWS + 5;
const WIDE_GAP = 9;
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

/** The vertical layout of a board. The band of legends is as tall with two lines as with three. */
export interface Layout {
  rowsTop: number;
  rowY(row: number): number;
  wide: { x: number; y: number; cols: number };
  height: number;
}

export function layout(): Layout {
  const rowsTop = HEADER + LEGENDS;
  const rowY = (row: number): number => rowsTop + row * ROW_PITCH;
  // From just before the place field, 46 characters long: it stops short of the end of the remarks.
  const wide = {
    x: FIELD_X.place - 4,
    y: rowY(ROWS - 1) + PANEL_ROWS + WIDE_GAP,
    cols: 46 * MP_ADVANCE,
  };
  return { rowsTop, rowY, wide, height: wide.y + PANEL_ROWS + BOTTOM };
}

/** Several boards, `across` side by side and `down` one above another. */
export function stackSize(across: number, down: number): { width: number; height: number } {
  const { height } = layout();
  return {
    width: across * BOARD_WIDTH + (across - 1) * BOARD_GAP,
    height: down * height + (down - 1) * BOARD_GAP,
  };
}
