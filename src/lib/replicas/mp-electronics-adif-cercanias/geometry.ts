/**
 * Where everything goes on the board, in units of the distance between two
 * LEDs. From photographs taken at Madrid Chamartín, set square: each row is
 * one strip of LEDs, seven dots high, wide enough for a platform of two
 * characters, a destination of seventeen and a time of five, one character
 * apart; characters advance six LEDs.
 */
export const ROWS = 12;
export const ROW_DOTS = 7;
export const ADVANCE = 6;
export const CELLS = { platform: 2, destination: 17, time: 5 };
/** Where each field starts, in characters. */
export const AT = { platform: 0, destination: 3, time: 21 };
export const ROW_CELLS = AT.time + CELLS.time;
export const ROW_COLS = ROW_CELLS * ADVANCE - 1;

const SIDE = 9;
export const HEADER = 15;
/** The grey band between the header and the first row, where the legends and the roundel are. */
const LEGENDS = 21;
const ROW_PITCH = ROW_DOTS + 3;
const BOTTOM = 7;

export const ROWS_X = SIDE;
export const ROWS_TOP = HEADER + LEGENDS;
export const rowY = (row: number): number => ROWS_TOP + row * ROW_PITCH;
export const SIZE = { width: SIDE * 2 + ROW_COLS, height: rowY(ROWS - 1) + ROW_DOTS + BOTTOM };
