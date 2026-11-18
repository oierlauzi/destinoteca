import {
  cellGrid,
  DotMatrix,
  DotTransition,
  h,
  octagonFlap,
  telenorma5x7,
  telenormaCp437,
  type OctagonFlapLook,
} from '../../hardware';

/**
 * The text lines of PAGE Ibérica's electromagnetic signs of the 1990s: rows of
 * separate 5x7 flip-dot character modules by Telenorma, which the label calls
 * 100 mm modules.
 *
 * The platform sign carries one line of 16 characters (the unit labelled
 * PI-T100-M); the concourse boards of the same family stack two to four lines
 * of 20. Both are this function with different numbers.
 *
 * The modules are those measured on the recovered PI-T100-M, in the units of
 * the platform sign's drawing: see dimensions.ts.
 */
import { CELL_COLS, CELL_GAP, CELL_ROWS, FLAP_PITCH as PITCH, FLAP_PITCH_Y as PITCH_Y, OPENING_MARGIN as MARGIN, OPENING_MARGIN_Y as MARGIN_Y, MODULE_INSET as INSET, MODULE_INSET_Y as INSET_Y } from './dimensions';

export { CELL_COLS, CELL_ROWS, CELL_STEP, CELL_WIDTH, CELL_GAP, LINE_HEIGHT, lineWidth } from './dimensions';
const FLAP = 4.3 / 11;

export const FLIP_DOT_UNLIT = '#26261e';

export interface FlipDotLinesSpec {
  lines: number;
  cells: number;
  x: number;
  y: number;
  /** Clear space between two lines of text. */
  lineGap?: number;
}

export function flipDotLines(spec: FlipDotLinesSpec): DotMatrix<OctagonFlapLook> {
  return new DotMatrix<OctagonFlapLook>({
    modules: cellGrid({
      lines: spec.lines,
      cells: spec.cells,
      cols: CELL_COLS,
      rows: CELL_ROWS,
      pitch: PITCH,
      pitchY: PITCH_Y,
      cellGap: CELL_GAP,
      lineGap: spec.lineGap ?? CELL_GAP * 3,
      x: spec.x,
      y: spec.y,
    }),
    cols: CELL_COLS,
    rows: CELL_ROWS,
    pitch: PITCH,
    pitchY: PITCH_Y,
    skin: octagonFlap({ size: FLAP, corner: 0.5 }),
    // The character's opening in the steel sheet of the face, and the module
    // behind it, a little smaller.
    backing: (module, width, height) => [
      h('rect', { x: module.x - MARGIN, y: module.y - MARGIN_Y, width: width + MARGIN * 2, height: height + MARGIN_Y * 2, fill: '#000000' }),
      h('rect', {
        x: module.x - MARGIN + INSET,
        y: module.y - MARGIN_Y + INSET_Y,
        width: width + (MARGIN - INSET) * 2,
        height: height + (MARGIN_Y - INSET_Y) * 2,
        fill: '#292929',
      }),
    ],
  });
}

export const flipDotFont = telenorma5x7;
/** The code page that goes with the font. Not standard CP437: see its file. */
export const flipDotCharset = telenormaCp437;

// How these signs rewrite their text. The controller redraws only the
// characters that changed (established from the firmware in
// renfe-flipdot-re, docs/5-the-panel.md), one after another from left to
// right, and within a character the flaps turn in a wave from the top-left
// corner. A whole line of 16 takes one second (15 steps between characters
// plus the wave across the last one); a minute ticking over takes a blink.
const CELL_MS = 62;
const DOT_MS = 7;

/**
 * The transition with which a sign of this family goes from one text to the
 * next. Each line is a unit with its own controller (the platform sign's line
 * is labelled MAESTRA, master), so on a board of several lines they all
 * change at once, each at its own pace.
 */
export function flipDotSweep(lines: number, cells: number): DotTransition {
  return new DotTransition(lines * cells, CELL_COLS, CELL_ROWS, (turn, col, row) => turn * CELL_MS + (col + row) * DOT_MS, {
    differential: true,
    queue: (module) => Math.floor(module / cells),
  });
}
