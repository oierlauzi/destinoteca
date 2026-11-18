import { CELL, INSET, LIP, MODULE, rowLayout, type Box, type RowLayout } from '../ikusi/modules';
import { PLATE } from '../ikusi-metro-bilbao/navilens';

/*
 * One sign, in centimetres. The proportions are measured on a frontal
 * photograph in units of one character's pitch, and the modules are taken
 * to be Ikusi's own, as on the platform signs of Atocha Cercanías
 * (../ikusi/modules.ts), so the box comes out about 172 cm wide and 48 tall.
 * Two rows of 19 characters, 2.24 pitches apart as on Ikusi's airport
 * boards, with one blank module at each end of a row; above the rows the
 * box is twice as deep as below them. The clock is about as wide as the box
 * is tall, and hangs beside it. No sign has been measured.
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

/** The clock's diameter, and the gap between it and the box. */
export const CLOCK = { diameter: 48, gap: 5 };
/** The NaviLens plate, from the top of the box. */
const PLATE_TOP = 1.5;

export type Side = 'left' | 'right';

export interface Layout {
  width: number;
  height: number;
  box: Box;
  window: Box;
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
  const height = Math.max(BOX.height, CLOCK.diameter);
  const top = (height - BOX.height) / 2;
  const boxX = side === 'left' ? CLOCK.diameter + CLOCK.gap : plate;
  const box = { x: boxX, y: top, ...BOX };
  const window = { x: boxX + SIDE, y: top + ABOVE, width: (CHARS + 2 * FILLERS) * CELL, height: ROW_PITCH + RAIL };
  const rows = Array.from({ length: ROWS }, (_, i) => rowLayout(window.x + FILLERS * CELL, window.y + i * ROW_PITCH + LIP + INSET.y, CHARS, FILLERS));
  const clockX = side === 'left' ? CLOCK.diameter / 2 : boxX + BOX.width + CLOCK.gap + CLOCK.diameter / 2;
  return {
    width: CLOCK.diameter + CLOCK.gap + BOX.width + plate,
    height,
    box,
    window,
    rows,
    clock: { cx: clockX, cy: height / 2, r: CLOCK.diameter / 2 },
    plate: navilens ? { x: side === 'left' ? boxX + BOX.width : 0, y: top + PLATE_TOP } : undefined,
  };
}

export const sizeOf = (side: Side, navilens: boolean): { width: number; height: number } => {
  const { width, height } = layout(side, navilens);
  return { width, height };
};
