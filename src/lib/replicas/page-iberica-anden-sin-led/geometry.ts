import { LINE_HEIGHT } from '../page-iberica-electromagneticos/dimensions';

/*
 * The platform sign with only its flip-dot line. The videos it is known from
 * show little of the enclosure, so everything they do not contradict is taken
 * from the sign with the LED row (page-iberica-anden-electromagnetico): its
 * width, its bezel and the inner panel's corners, and where the line starts.
 * Only the height changes, to hold one line. Millimetres, like that sign.
 */

/** As wide as the sign with the LED row. */
export const WIDTH = 190.87605;
/** The inner panel's top-left corner, as on that sign. */
export const PANEL_X = 12.080421 - 4.3614364;
export const PANEL_Y = 11.557226 - 4.8301482;
export const PANEL_WIDTH = 176.00145;
/** The bezel below the panel, as on that sign. */
const BEZEL_BOTTOM = 81.160835 - PANEL_Y - 67.75975;

/** Space in the panel above the line. An estimate from the videos. */
const ABOVE = 4;
/** Room under the line for its fluorescent tube (not drawn), as on that sign. */
const TUBE_GAP = 7.4;

/** The line's top-left corner. It starts where it does on that sign. */
export const ROW_X = 24.658236 - 4.3614364;
export const ROW_Y = PANEL_Y + ABOVE;

export const PANEL_HEIGHT = ABOVE + LINE_HEIGHT + TUBE_GAP;
export const HEIGHT = PANEL_Y + PANEL_HEIGHT + BEZEL_BOTTOM;
