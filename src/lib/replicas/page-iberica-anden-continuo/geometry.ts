/**
 * The enclosure is the earlier platform sign's, so its outline and LED row
 * keep that sign's drawing (renfe-flipdot-re, web-replica/reference.svg).
 * The continuous matrix and the header are placed from photographs taken at
 * Alcalá de Henares; the matrix is taken to have the earlier modules' dot
 * pitch over the earlier line's width, which gives 96 columns.
 */
export const WIDTH = 190.87605;
export const HEIGHT = 81.160835;
const ORIGIN = { x: 4.3614364, y: 4.8301482 };
export const at = (x: number, y: number) => ({ x: x - ORIGIN.x, y: y - ORIGIN.y });

export const COLS = 96;
export const ROWS = 7;
/** Same span as the earlier line of 16 modules. */
const SPAN = 16 * 7.9834499 + 15 * 1.4552071;
export const PITCH = SPAN / COLS;
export const MATRIX = at(24.658236, 39.877911);
export const LED = at(20.358263, 60.55167);
export const LED_WIDTH = 158.50243;
export const PANEL = { ...at(12.080421, 11.557226), width: 176.00145, height: 67.75975 };
/** Rules above and below the matrix, where the earlier sign has them. */
export const RULES = [at(0, 35.448382).y, at(0, 56.89837).y];
