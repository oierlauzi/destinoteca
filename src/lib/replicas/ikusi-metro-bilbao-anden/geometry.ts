import { CELL, GLASS, INSET, LIP, MODULE, rowLayout, type Box, type RowLayout } from '../ikusi/modules';
import { PLATE } from '../ikusi-metro-bilbao/navilens';

/*
 * One sign, at the scale of Ikusi's modules (../ikusi/modules.ts). The
 * proportions are measured on a frontal photograph in units of one
 * character's pitch: the box is about 25 pitches wide and 7 tall.
 * Two rows of 19 characters, 2.24 pitches apart as on Ikusi's airport
 * boards, with one blank module at each end of a row; above the rows the
 * box is twice as deep as below them. The opening in the front shows only
 * the glasses, with more room above them than below, and what lies
 * between the two rows, behind a pane of glass; the rails above the first
 * row and the groove below the second stay hidden behind the front. The front has a black bezel, deeper
 * at the top than at the sides and the foot. The clock is about as wide as
 * the box is tall, and hangs beside it, three quarters of a pitch away.
 * Both hang from a horizontal tube on posts: two on the box, each about 3.3
 * pitches in from its end, one on the clock. How the tube is held to the
 * station varies, so it is drawn only as long as the sign. Only the
 * proportions come from photographs; no sign has been measured.
 */

export const CHARS = 19;
export const ROWS = 2;
/** Blank modules at each end of a row. */
export const FILLERS = 1;
export const ROW_PITCH = 2.24 * CELL;
const RAIL = MODULE.height + 2 * LIP;

/** The box's margin round the window, at the sides, above and below. */
const SIDE = 1.95 * CELL;
const ABOVE = 2.0 * CELL;
export const BOX = { width: (CHARS + 2 * FILLERS) * CELL + 2 * SIDE, height: 7.0 * CELL };

/** From the glasses to the opening's edge: above, short of the top of the modules; below, short of their groove. */
export const OPENING_MARGIN = { top: 1.65, bottom: 0.7 };

/** The bezel round the front: its depth at the top, and at the sides and the foot; the box's outer corners. */
export const BEZEL = { top: 0.38 * CELL, side: 0.29 * CELL, corner: 0.29 * CELL };

/** The clock's diameter, and the gap between it and the box. */
export const CLOCK = { diameter: 48, gap: 5 };

/**
 * The tube the sign hangs from, about a pitch thick, its underside 1.34
 * pitches above the box; the posts, about 0.7 of a pitch wide, stand on
 * plates bolted to the box. The clock's post is narrower.
 */
export const BEAM = { thickness: 0.96 * CELL, gap: 1.34 * CELL, post: 0.7 * CELL, inset: 3.3 * CELL, plate: 1.6 * CELL, clockPost: 0.55 * CELL };
/** The NaviLens plate, from the top of the box. */
const PLATE_TOP = 1.5;

export type Side = 'left' | 'right';

export interface Layout {
  width: number;
  height: number;
  /** The tube, from end to end of the sign. */
  beam: Box;
  /** The posts down from the tube: to the box, and to the clock. */
  posts: Box[];
  box: Box;
  /** Where the rails run: what the opening shows is part of it. */
  window: Box;
  /** The opening in the front, behind its pane of glass. */
  opening: Box;
  rows: RowLayout[];
  clock: { cx: number; cy: number; r: number };
  plate?: { x: number; y: number };
}

/**
 * The clock at one end and, if the sign has one, the NaviLens plate against
 * the other end of the box.
 */
export function layout(side: Side, navilens: boolean): Layout {
  const plate = navilens ? PLATE : 0;
  const width = CLOCK.diameter + CLOCK.gap + BOX.width + plate;
  // The box and the clock share a middle; the taller of the two hangs the tube's gap below it.
  const below = BEAM.thickness + BEAM.gap;
  const middle = below + Math.max(BOX.height, CLOCK.diameter) / 2;
  const height = 2 * middle - below;
  const top = middle - BOX.height / 2;
  const boxX = side === 'left' ? CLOCK.diameter + CLOCK.gap : plate;
  const box = { x: boxX, y: top, ...BOX };
  const window = { x: boxX + SIDE, y: top + ABOVE, width: (CHARS + 2 * FILLERS) * CELL, height: ROW_PITCH + RAIL };
  const rows = Array.from({ length: ROWS }, (_, i) => rowLayout(window.x + FILLERS * CELL, window.y + i * ROW_PITCH + LIP + INSET.y, CHARS, FILLERS));
  const openTop = rows[0]!.glasses[0]!.y - OPENING_MARGIN.top;
  const openBottom = rows[ROWS - 1]!.glasses[0]!.y + GLASS.height + OPENING_MARGIN.bottom;
  const opening = { x: window.x, y: openTop, width: window.width, height: openBottom - openTop };
  const clockX = side === 'left' ? CLOCK.diameter / 2 : boxX + BOX.width + CLOCK.gap + CLOCK.diameter / 2;
  const clockTop = middle - CLOCK.diameter / 2;
  const post = (x: number, w: number, bottom: number): Box => ({ x: x - w / 2, y: BEAM.thickness / 2, width: w, height: bottom - BEAM.thickness / 2 });
  return {
    width,
    height,
    beam: { x: 0, y: 0, width, height: BEAM.thickness },
    posts: [post(boxX + BEAM.inset, BEAM.post, top), post(boxX + BOX.width - BEAM.inset, BEAM.post, top), post(clockX, BEAM.clockPost, clockTop + 1)],
    box,
    window,
    opening,
    rows,
    clock: { cx: clockX, cy: middle, r: CLOCK.diameter / 2 },
    plate: navilens ? { x: side === 'left' ? boxX + BOX.width : 0, y: top + PLATE_TOP } : undefined,
  };
}

export const sizeOf = (side: Side, navilens: boolean): { width: number; height: number } => {
  const { width, height } = layout(side, navilens);
  return { width, height };
};
