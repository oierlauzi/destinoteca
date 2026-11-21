import type { PanelSpec } from '../../hardware';

/*
 * One unit, at the scale of the panel's own dots: a dot's pitch is 1.
 *
 * The proportions are measured in the photograph of La Cartuja, the one taken
 * most nearly head on, in units of the panel's own parts. What can be counted
 * there is the grid: five cells across and three down, the top row of cells a
 * quarter taller than the two below it; the glass is about 4.2 times as wide
 * as it is tall and the frame around it about 3.5; the frame's margin is the
 * same on all four sides; and inside each cell the part that writes takes
 * about half its height on the lower rows, leaving a margin above and below
 * of a slightly different shade. No unit has been measured: there are no
 * sizes here, only proportions.
 *
 * How many dots a cell holds does not follow from any photograph. It is
 * reconstructed from the characters that fit one: seven of the small face
 * («CORDOBA» fills a cell), six of the large one («00:00» and a blank).
 */

export const CELLS = 5;
/** Dots across one cell, the groove included. */
export const CELL_WIDTH = 57;
/** Dots down each row of cells: the top one is taller. */
export const ROW_HEIGHTS = [25, 20, 20] as const;
/** Dots the part of a cell that writes is tall, per row: exactly its face, which fills it. */
export const WRITE_HEIGHTS = [13, 7, 7] as const;

/** The band of groove around the whole grid, wider than the ones between the cells. */
export const GLASS_PAD = 2.5;

export const PITCH = 1;
/** The characters read thick: the dots nearly touch. */
export const DOT = 0.9;
export const GROOVE = 1;

export const PANEL: PanelSpec = {
  cells: CELLS,
  rowHeights: [...ROW_HEIGHTS],
  cellWidth: CELL_WIDTH,
  writeHeights: [...WRITE_HEIGHTS],
  pitch: PITCH,
  dot: DOT,
  groove: GROOVE,
  pad: GLASS_PAD,
};

export const GLASS_WIDTH = CELLS * CELL_WIDTH + 2 * GLASS_PAD;
export const GLASS_HEIGHT = ROW_HEIGHTS.reduce((a, b) => a + b, 0) + 2 * GLASS_PAD;

/** The frame around the glass, the same on all four sides. */
export const BEZEL = 9;
/** The frame's rounded corners. */
export const RADIUS = 7;

/** The display's own box. */
export const BOARD_WIDTH = GLASS_WIDTH + 2 * BEZEL;
export const HEIGHT = GLASS_HEIGHT + 2 * BEZEL;

/*
 * The clock hangs in a box of its own, bolted to the display's: as tall as
 * it, a little wider than it is tall, with the same frame and the same
 * margin, its own box touching the display's. Measured in the photograph of
 * La Cartuja, where the two are 486 and 160 wide and both 136 tall.
 */
export const CLOCK_HEIGHT = HEIGHT;
export const CLOCK_WIDTH = Math.round(HEIGHT * 1.18 * 10) / 10;
/** The two boxes touch: their frames are bolted side by side. */
export const GAP = 0;

export const WIDTH = BOARD_WIDTH + GAP + CLOCK_WIDTH;

/** The glass's top-left corner, inside the frame. */
export const PANEL_AT = { x: BEZEL + GLASS_PAD, y: BEZEL + GLASS_PAD };

/** The maker's mark on the frame, under the right end of the glass. */
export const MARK_HEIGHT = 2.6;
export const MARK_RIGHT = BOARD_WIDTH - BEZEL;
