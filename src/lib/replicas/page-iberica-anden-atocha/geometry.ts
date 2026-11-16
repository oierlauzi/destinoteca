import { layout, rowAt } from '../page-iberica-electromagneticos/atocha';

/**
 * Below the header, a section for the flip-dot line and one for the LED
 * panel: the proportions of photographs of the displays of platforms 4 and 3
 * (X), set square.
 */
export const LAYOUT = layout([22, 42]);
export const WIDTH = LAYOUT.width;
export const HEIGHT = LAYOUT.height;

/** Top-left corner of the square of the first dot. */
export const ROW = rowAt(LAYOUT, 0);

/**
 * The LED panel: 120 columns, enough for 15 characters of 7 with one blank
 * column after each, and 28 rows, two lines of 12 with 4 rows between them;
 * centred in its section.
 */
export const PANEL_COLS = 120;
export const PANEL_ROWS = 28;
export const PANEL_LINES = [0, 16];
const PANEL_PITCH = 1.21;
export const PANEL = {
  x: LAYOUT.face.x + (LAYOUT.face.width - PANEL_COLS * PANEL_PITCH) / 2,
  y: (LAYOUT.sections[1]! + LAYOUT.sections[2]! - PANEL_ROWS * PANEL_PITCH) / 2,
  pitch: PANEL_PITCH,
};
