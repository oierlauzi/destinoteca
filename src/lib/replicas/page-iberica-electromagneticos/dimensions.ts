/**
 * Sizes shared by every sign of the family, in millimetres of the reference
 * drawing of the platform sign. Plain numbers with no imports, so that a
 * replica's definition can work out its size without loading any drawing code.
 */
export const CELL_COLS = 5;
export const CELL_ROWS = 7;

// The reference drawing has 16 characters 7.98 wide with gaps of 1.46. The
// gaps look slightly too narrow next to photographs, so they are widened by a
// fifth, and the characters made just small enough for the 16 to keep the
// drawing's span: the platform sign's frame keeps its proportions.
const DRAWN = { cell: 7.9834499, gap: 1.4552071, cells: 16 };
const GAP_RATIO = (DRAWN.gap / DRAWN.cell) * 1.2;
const DRAWN_SPAN = DRAWN.cells * DRAWN.cell + (DRAWN.cells - 1) * DRAWN.gap;
/** Width of one character module. The same modules on every sign of the family. */
export const CELL_WIDTH = DRAWN_SPAN / (DRAWN.cells + (DRAWN.cells - 1) * GAP_RATIO);
export const CELL_GAP = CELL_WIDTH * GAP_RATIO;
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
/** Where the baseline of "min." falls, as a fraction of the line's height down from its top. */
export const MIN_BASELINE = 7.775527 / 11.181376;
/** Rough width of the "min." legend, for centring. */
export const MIN_WIDTH = 8.4;
