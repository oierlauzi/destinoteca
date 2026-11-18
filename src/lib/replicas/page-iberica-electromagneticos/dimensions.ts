/**
 * Sizes shared by every sign of the family, in millimetres of the reference
 * drawing of the platform sign (renfe-flipdot-re, web-replica/reference.svg).
 * Plain numbers with no imports, so that a replica's definition can work out
 * its size without loading any drawing code.
 */
export const CELL_COLS = 5;
export const CELL_ROWS = 7;

/**
 * The flip-dot line, a unit of its own labelled PI-T100-M, as measured on the
 * recovered unit, in centimetres. Its front face leans back: lengths marked
 * "on the face" are along the slant, the rest as seen from the front.
 */
export const PI_T100_M = {
  /** Without the rack ears, 3 cm at each side, which the bezel hides once the line is mounted. */
  width: 161,
  rackEar: 3,
  height: 20,
  /** The front face from top to bottom, along the slant. */
  face: 20.5,
  /** From each end of the line to the nearest character. The one at the right end is the room for "min.". */
  end: 9,
  /** From the start of one character to the start of the next. */
  pitch: 9,
  charWidth: 8,
  /** On the face. */
  charHeight: 11,
  /** On the face, under the characters and over them. */
  below: 5.5,
  above: 4,
  /** The reflector of the fluorescent tube, from the bottom of the line; it hides the lower half of the tube. */
  reflector: 2.5,
  /** The tube's diameter, roughly. */
  tube: 2.5,
  /** The tube, centred, and the twist socket at each end of it, roughly. The reflector covers both: 153 cm. */
  tubeLength: 150,
  socket: 1.5,
  /** "min.": its width, and the height of its "i" on the face. */
  minWidth: 9,
  minHeight: 5,
} as const;

const M = PI_T100_M;

/**
 * Drawing units per centimetre. The line fills the platform sign's inner
 * panel from one of its black edges to the other (176 units with 1.5 under
 * each edge): the bezel hides the rack ears, and the 20 cm of the line's
 * height then fall on the hairlines the drawing has above and below it.
 */
export const CM = (176.00145 - 3) / M.width;
/** The face leans back: seen from the front, its lengths shrink by this much. */
export const FORESHORTENING = M.height / M.face;
const FACE = CM * FORESHORTENING;

/**
 * Five flaps across and seven down fit a character 8 cm wide and 11 cm tall,
 * with the same margin around them both ways, at a pitch of 1.5 cm: a sixth
 * of it at each edge. Worked out from the measurements, not measured.
 */
const PITCH_CM = 1.5;
const MARGIN_CM = (M.charWidth - CELL_COLS * PITCH_CM) / 2;

/** Distance between the centres of neighbouring flaps, across. */
export const FLAP_PITCH = PITCH_CM * CM;
/** Distance between the centres of neighbouring rows of flaps, as seen from the front. */
export const FLAP_PITCH_Y = PITCH_CM * FACE;
/** The character module around its flaps, across and down. */
export const MODULE_MARGIN = MARGIN_CM * CM;
export const MODULE_MARGIN_Y = MARGIN_CM * FACE;
/** Width of the flaps of one character, from the first column's edge to the last one's. */
export const CELL_WIDTH = CELL_COLS * FLAP_PITCH;
/** From the start of one character to the start of the next. */
export const CELL_STEP = M.pitch * CM;
/** Between the flaps of one character and those of the next. */
export const CELL_GAP = CELL_STEP - CELL_WIDTH;
/** Height of the flaps of a line, as seen from the front. */
export const LINE_HEIGHT = CELL_ROWS * FLAP_PITCH_Y;
/** Width of the flaps of a line of `cells` characters. */
export const lineWidth = (cells: number): number => cells * CELL_STEP - CELL_GAP;

/** A line unit of `cells` characters: the PI-T100-M for 16, and the same build for other lengths. */
export const rowWidth = (cells: number): number => (2 * M.end + cells * M.pitch - (M.pitch - M.charWidth)) * CM;
export const ROW_HEIGHT = M.height * CM;
/** From a line unit's top-left corner to its first flap. */
export const ROW_DOTS = { x: M.end * CM + MODULE_MARGIN, y: M.above * FACE + MODULE_MARGIN_Y };
/** From the bottom of a line's flaps to the bottom of its unit. */
export const ROW_BELOW_DOTS = M.below * FACE + MODULE_MARGIN_Y;

/** Height of the LED row. */
export const LED_HEIGHT = 11.181376;
/** From the end of a line's flaps to "min.": it starts at the edge of the last character. */
export const MIN_GAP = MODULE_MARGIN;
/** The "min." legend fills the room at the end of the line. */
export const MIN_WIDTH = M.minWidth * CM;
/** Height of the "i" of "min.", as seen from the front. */
export const MIN_HEIGHT = M.minHeight * FACE;

/** The tube's reflector, a separate piece in front of the face, so taken as it is. */
export const REFLECTOR_HEIGHT = M.reflector * CM;
export const TUBE_RADIUS = (M.tube / 2) * CM;
export const SOCKET_WIDTH = M.socket * CM;
/**
 * From each end of a line unit to its reflector: 4 cm on the PI-T100-M. A
 * unit of another length is taken to keep it, with a tube to match; how long
 * its tube really is, is not known.
 */
export const REFLECTOR_INSET = ((M.width - M.tubeLength - 2 * M.socket) / 2) * CM;
