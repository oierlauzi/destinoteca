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
  /**
   * The characters' openings in the steel sheet of the face (the height on
   * the face). The modules behind are a few millimetres smaller.
   */
  charWidth: 8,
  charHeight: 11,
  /** On the face, under the openings and over them. */
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
 * Five flaps across and seven down fit an opening 8 cm wide and 11 cm tall,
 * with the same margin around them both ways, at a pitch of 1.5 cm: a sixth
 * of it at each edge. Worked out from the measurements, not measured; the
 * modules being a little smaller than their openings leaves room for that.
 */
const PITCH_CM = 1.5;
const MARGIN_CM = (M.charWidth - CELL_COLS * PITCH_CM) / 2;
/** How much smaller than its opening a module is, all round. A guess at "a few millimetres". */
const MODULE_INSET_CM = 0.15;

/** Distance between the centres of neighbouring flaps, across. */
export const FLAP_PITCH = PITCH_CM * CM;
/** Distance between the centres of neighbouring rows of flaps, as seen from the front. */
export const FLAP_PITCH_Y = PITCH_CM * FACE;
/** From the flaps of a character to the edges of its opening in the steel sheet, across and down. */
export const OPENING_MARGIN = MARGIN_CM * CM;
export const OPENING_MARGIN_Y = MARGIN_CM * FACE;
/** From the edges of an opening to the module behind it, across and down. */
export const MODULE_INSET = MODULE_INSET_CM * CM;
export const MODULE_INSET_Y = MODULE_INSET_CM * FACE;
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

/**
 * From each end of a line unit to its reflector: 4 cm on the PI-T100-M. The
 * reflector covers the tube and its sockets.
 */
const REFLECTOR_INSET_CM = (M.width - M.tubeLength - 2 * M.socket) / 2;

/**
 * Width of a line unit built around a tube `tube` cm long: the reflector over
 * tube and sockets, and the same 4 cm beyond it at each end as on the
 * PI-T100-M. For its 150 cm tube that is the 161 cm measured.
 */
export const unitWidth = (tube: number): number => (tube + 2 * M.socket + 2 * REFLECTOR_INSET_CM) * CM;
/**
 * From a line unit's left end to its first flap, with the characters
 * centred in the unit: 9 cm to the opening on the PI-T100-M, at both ends.
 */
export const dotsInUnit = (cells: number, tube: number): number => (unitWidth(tube) - lineWidth(cells)) / 2;
/** The PI-T100-M's width, from its tube. */
export const PI_T100_M_WIDTH = unitWidth(M.tubeLength);
export const ROW_HEIGHT = M.height * CM;
/** From a line unit's top to its first row of flaps. */
export const DOTS_TOP = M.above * FACE + OPENING_MARGIN_Y;
/** From the bottom of a line's flaps to the bottom of its unit. */
export const ROW_BELOW_DOTS = M.below * FACE + OPENING_MARGIN_Y;

/** Height of the LED row. */
export const LED_HEIGHT = 11.181376;
/** From the end of a line's flaps to "min.": it starts at the edge of the last opening. */
export const MIN_GAP = OPENING_MARGIN;
/** The "min." legend fills the room at the end of the line. */
export const MIN_WIDTH = M.minWidth * CM;
/** Height of the "i" of "min.", as seen from the front. */
export const MIN_HEIGHT = M.minHeight * FACE;

/** The tube's reflector, a separate piece in front of the face, so taken as it is. */
export const REFLECTOR_HEIGHT = M.reflector * CM;
export const TUBE_RADIUS = (M.tube / 2) * CM;
export const SOCKET_WIDTH = M.socket * CM;
export const REFLECTOR_INSET = REFLECTOR_INSET_CM * CM;
