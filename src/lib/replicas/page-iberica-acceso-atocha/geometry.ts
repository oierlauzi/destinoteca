import { COLS, layout, PITCH, rowAt } from '../page-iberica-electromagneticos/atocha';
import { LED_HEIGHT } from '../page-iberica-electromagneticos/parts';

/**
 * Below the header, a section for the flip-dot line and one for the red LED
 * row, each with the line centred: the proportions of a photograph of the
 * display of platform 7 (Europa Press), set square.
 */
export const LAYOUT = layout([24, 24]);
export const WIDTH = LAYOUT.width;
export const HEIGHT = LAYOUT.height;

/** Top-left corner of the square of the first dot. */
export const ROW = rowAt(LAYOUT, 0);

/**
 * The red LED row of the earlier PAGE Ibérica signs (same LEDs, pitch and
 * height), as wide as the flip-dot line and centred in its section.
 */
const ledTop = LAYOUT.sections[1]!;
const ledBottom = LAYOUT.sections[2]!;
export const LED = { x: ROW.x, y: (ledTop + ledBottom - LED_HEIGHT) / 2, width: COLS * PITCH };
