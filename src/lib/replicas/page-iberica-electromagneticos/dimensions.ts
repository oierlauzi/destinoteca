/**
 * Sizes shared by every sign of the family, in millimetres of the reference
 * drawing of the platform sign. Plain numbers with no imports, so that a
 * replica's definition can work out its size without loading any drawing code.
 */
export const CELL_COLS = 5;
export const CELL_ROWS = 7;
export const CELL_WIDTH = 7.9834499;
export const CELL_GAP = 1.4552071;
/** From the start of one character module to the start of the next. */
export const CELL_STEP = CELL_WIDTH + CELL_GAP;
/** Distance between the centres of neighbouring flaps. */
export const FLAP_PITCH = CELL_WIDTH / CELL_COLS;
/** Height of a line of characters. */
export const LINE_HEIGHT = CELL_ROWS * FLAP_PITCH;
/** Width of a line of `cells` characters. */
export const lineWidth = (cells: number): number => cells * CELL_STEP - CELL_GAP;
/** Height of the LED row, the same as a flip-dot line. */
export const LED_HEIGHT = 11.181376;
/** Gap between the end of a line and the "min." beside it. */
export const MIN_GAP = 0.76992;
/** Rough width of the "min." legend, for centring. */
export const MIN_WIDTH = 8.4;
