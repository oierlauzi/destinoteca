import { CELL, INSET, LIP, MODULE, rowLayout, type Box, type RowLayout } from '../ikusi/modules';

/*
 * One sign, at the scale of Ikusi's modules (../ikusi/modules.ts). The
 * proportions are measured on a photograph of Atxuri's platform signs, in
 * units of one character's pitch: the box is about 31 pitches wide and 6.6
 * tall. One row of 21 characters with two blank modules at each end, its
 * window 3.6 pitches below the top of the box and 1.1 above its foot; at the
 * left, the printed plate with the platform's number fills the height of the
 * box. Above the row, the legends of the time and the destination are
 * printed over the first module of each, under a thin yellow line. Only the
 * proportions come from photographs; no sign has been measured.
 */

const P = CELL;

/** Characters in the row: the time in the first five, a blank, and the destination in the rest. */
export const CHARS = 21;
export const TIME = 5;
export const TEXT_AT = TIME + 1;
export const TEXT = CHARS - TEXT_AT;
export const FILLERS = 2;

const RAIL = MODULE.height + 2 * LIP;
const LEFT = 4.9 * P;
const RIGHT = 1.2 * P;
const ABOVE = 3.6 * P;
const BELOW = 1.1 * P;

export const WIDTH = LEFT + (CHARS + 2 * FILLERS) * P + RIGHT;
export const HEIGHT = ABOVE + RAIL + BELOW;
/** The box's rounded corners. */
export const CORNER = 0.7 * P;

/** The window the row shows through. */
export const WINDOW: Box = { x: LEFT, y: ABOVE, width: (CHARS + 2 * FILLERS) * P, height: RAIL };

export const row = (): RowLayout => rowLayout(WINDOW.x + FILLERS * P, WINDOW.y + LIP + INSET.y, CHARS, FILLERS);

/** The left edge of the module of character `i`. */
export const moduleX = (i: number): number => WINDOW.x + (FILLERS + i) * P;

/** The printed lines' thickness, and how far in from the box's edge the plate's outline and the top line run. */
const STROKE = 0.08 * P;
const EDGE = 0.28 * P;

/**
 * The plate with the platform's number: a yellow outline, as far in from
 * the box's left end, top and foot, so that its rounded corners follow the
 * box's. Measured along the middle of the outline.
 */
export const PLATE: Box & { corner: number; stroke: number } = {
  x: EDGE,
  y: EDGE,
  width: 4.55 * P - EDGE,
  height: HEIGHT - 2 * EDGE,
  corner: CORNER - EDGE,
  stroke: STROKE,
};
/** The number's capitals, about 2.8 pitches tall. */
export const NUMBER_CAP = 2.76 * P;

/** The thin yellow line along the top, level with the plate's top, from just past the plate to over the end of the row. */
export const LINE = { x1: 5.8 * P, x2: 29.2 * P, y: EDGE, width: STROKE };

/** The legends: the Basque word on top, in white; the Spanish one under it, bold and yellow. */
export const LEGEND_CAP = 0.59 * P;
export const LEGEND_BASELINES = { eu: 1.37 * P, es: 2.78 * P };
export const LEGENDS = [
  { at: 0, eu: { text: 'Ordua', width: 2.0 * P }, es: { text: 'Hora', width: 1.78 * P } },
  { at: TEXT_AT, eu: { text: 'Norako', width: 2.36 * P }, es: { text: 'Destino', width: 2.9 * P } },
] as const;

/** Ikusi's logo, its disc about 0.7 pitches across, on the foot of the box, ending under the end of the window. */
export const LOGO_HEIGHT = 0.83 * P;
export function logoAt(width: number): { x: number; y: number } {
  const below = WINDOW.y + WINDOW.height;
  // The artwork's word ends a little short of its right edge.
  return { x: WINDOW.x + WINDOW.width - width * (403.5 / 410), y: (below + HEIGHT - LOGO_HEIGHT) / 2 };
}
