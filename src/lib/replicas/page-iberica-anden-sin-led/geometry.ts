import { DOTS_TOP, PI_T100_M, ROW_HEIGHT, dotsInUnit } from '../page-iberica-electromagneticos/dimensions';
import { CELLS } from '../page-iberica-anden-electromagnetico/def';

/*
 * The platform sign with only its flip-dot line. The videos it is known from
 * show little of the enclosure, so everything they do not contradict is taken
 * from the sign with the LED row (page-iberica-anden-electromagnetico): its
 * width, its bezel and the inner panel's corners. The panel holds the line's
 * unit (the PI-T100-M, as measured) and nothing else, as the videos show it:
 * between its black edges, the unit's height. Millimetres, like that sign.
 */

/** As wide as the sign with the LED row. */
export const WIDTH = 190.87605;
/** The inner panel's top-left corner, as on that sign. */
export const PANEL_X = 12.080421 - 4.3614364;
export const PANEL_Y = 11.557226 - 4.8301482;
export const PANEL_WIDTH = 176.00145;
/** The panel's black edge, half of it inside the panel. */
const PANEL_EDGE = 1.5;
/** The bezel below the panel, as on that sign. */
const BEZEL_BOTTOM = 81.160835 - PANEL_Y - 67.75975;

/** The line's unit: its top-left corner. */
export const UNIT_X = PANEL_X + PANEL_EDGE;
export const UNIT_Y = PANEL_Y + PANEL_EDGE;

/** The line's top-left corner. */
export const ROW_X = UNIT_X + dotsInUnit(CELLS, PI_T100_M.tubeLength);
export const ROW_Y = UNIT_Y + DOTS_TOP;

export const PANEL_HEIGHT = ROW_HEIGHT + PANEL_EDGE * 2;
export const HEIGHT = PANEL_Y + PANEL_HEIGHT + BEZEL_BOTTOM;
