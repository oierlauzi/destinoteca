import { PITCH, ROWS } from '../page-iberica-electromagneticos/atocha';
import { LED_HEIGHT } from '../page-iberica-electromagneticos/parts';

/**
 * PAGE Ibérica's board on the gangway over the tracks of Atocha Cercanías:
 * two faces side by side in one grey frame, each with a printed header and
 * five flip-dot lines lit by LEDs, and one red LED row of seven dots under
 * both. Measured on photographs, in dots of the lines, which are taken to
 * have the pitch of the station's other signs; set square.
 *
 * A line has the platform at its left (right-aligned at column 15), the
 * destination from column 24, and the minutes ("2min") right-aligned two
 * columns before its end.
 */
export const COLS = 126;
export { PITCH, ROWS };
export const LINES = 5;
export const FACES = 2;

/** The platform ends here; the destination starts here; the minutes end here. */
export const PLATFORM_RIGHT = 15;
export const DESTINATION_LEFT = 24;
export const MINUTES_RIGHT = COLS - 3;

const p = PITCH;
/** Black either side of the lines. */
const SIDE = 3.5 * p;
/** From the top of a face to its first line's section; each line's section. */
export const HEADER = 15 * p;
export const LINE = 15 * p;
const BOTTOM = 1.5 * p;

export const FACE = { width: COLS * p + 2 * SIDE, height: HEADER + LINES * LINE + BOTTOM };
/** Grey frame, the same all round and between the faces. */
export const FRAME = 10;
/** The black housing of the LED row, under the frame. */
const LED_BAND = LED_HEIGHT + 8;

export const WIDTH = FACES * FACE.width + (FACES + 1) * FRAME;
export const GREY_HEIGHT = FACE.height + 2 * FRAME;
export const HEIGHT = GREY_HEIGHT + LED_BAND;

/** Top-left corner of each face. */
export const faceAt = (face: number): { x: number; y: number } => ({ x: FRAME + face * (FACE.width + FRAME), y: FRAME });

/** Top-left corner of the first dot's square of a line. */
export function lineAt(face: number, line: number): { x: number; y: number } {
  const { x, y } = faceAt(face);
  return { x: x + SIDE, y: y + HEADER + line * LINE + (LINE - ROWS * p) / 2 };
}

/** Where a face's column `col` falls, for the legends over the lines. */
export const colX = (face: number, col: number): number => faceAt(face).x + SIDE + col * p;

/** The LED row, across both faces, centred in its band. */
export const LED = { x: FRAME, y: GREY_HEIGHT + (LED_BAND - LED_HEIGHT) / 2, width: WIDTH - 2 * FRAME, band: { y: GREY_HEIGHT, height: LED_BAND } };
