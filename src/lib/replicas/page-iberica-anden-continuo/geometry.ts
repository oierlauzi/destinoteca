import { PLATFORM_LED_WIDTH } from '../page-iberica-electromagneticos/dimensions';

/**
 * The enclosure is the earlier platform sign's, so its outline and LED row
 * keep that sign's drawing (renfe-flipdot-re, web-replica/reference.svg).
 * The continuous matrix and the header are placed from photographs taken at
 * Alcalá de Henares. The matrix is as wide as the LED row under it, by the
 * maintainer's reckoning, and right over it. Its 96 columns are a guess:
 * about the earlier modules' dot pitch over that width.
 */
export const WIDTH = 190.87605;
export const HEIGHT = 81.160835;
const ORIGIN = { x: 4.3614364, y: 4.8301482 };
export const at = (x: number, y: number) => ({ x: x - ORIGIN.x, y: y - ORIGIN.y });

export const COLS = 96;
export const ROWS = 7;
export const PANEL = { ...at(12.080421, 11.557226), width: 176.00145, height: 67.75975 };
/** The LED row, as on the earlier sign: centred in the panel. */
export const LED_WIDTH = PLATFORM_LED_WIDTH;
export const LED = { x: PANEL.x + (PANEL.width - LED_WIDTH) / 2, y: at(0, 60.55167).y };
/** The matrix's flaps span the LED row's width. */
export const PITCH = LED_WIDTH / COLS;
export const MATRIX = { x: LED.x, y: at(0, 39.877911).y };
/** Rules above and below the matrix, where the earlier sign has them. */
export const RULES = [at(0, 35.448382).y, at(0, 56.89837).y];
