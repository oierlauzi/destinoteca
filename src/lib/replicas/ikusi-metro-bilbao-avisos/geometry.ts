import { CELL, INSET, LIP, MODULE, rowLayout, type Box, type RowLayout } from '../ikusi/modules';
import { PLATE } from '../ikusi-metro-bilbao/navilens';

/*
 * One board, at the scale of Ikusi's modules (../ikusi/modules.ts). Three
 * rows of 35 characters, 2.24 pitches apart, with one blank module at each
 * end of a row, in a black box about 1.3 pitches wider than the window on
 * each side, 1.2 deeper above it and 1.4 below, where Ikusi's logo is
 * printed under the end of the last row: about 40 pitches wide and 9 tall.
 * The proportions are measured on photographs taken from below, so they are
 * rougher than those of the platform signs. Only the proportions come from
 * photographs; no board has been measured.
 */

export const CHARS = 35;
export const ROWS = 3;
export const FILLERS = 1;
export const ROW_PITCH = 2.24 * CELL;
const RAIL = MODULE.height + 2 * LIP;
const SIDE = 1.3 * CELL;
const ABOVE = 1.2 * CELL;
const BELOW = 1.4 * CELL;
export const BOX = { width: (CHARS + 2 * FILLERS) * CELL + 2 * SIDE, height: ABOVE + (ROWS - 1) * ROW_PITCH + RAIL + BELOW };
/** Ikusi's logo, about 1.6 pitches wide. */
export const LOGO_HEIGHT = 0.6 * CELL;
/** Between the box and the NaviLens plate, about a third of a pitch. */
const PLATE_GAP = 2;

export type PlateSide = '' | 'left' | 'right';

export interface Layout {
  width: number;
  height: number;
  box: Box;
  window: Box;
  rows: RowLayout[];
  plate?: { x: number; y: number };
}

export function layout(plate: PlateSide): Layout {
  const extra = plate ? PLATE + PLATE_GAP : 0;
  const boxX = plate === 'left' ? extra : 0;
  const box = { x: boxX, y: 0, ...BOX };
  const window = { x: boxX + SIDE, y: ABOVE, width: (CHARS + 2 * FILLERS) * CELL, height: (ROWS - 1) * ROW_PITCH + RAIL };
  const rows = Array.from({ length: ROWS }, (_, i) => rowLayout(window.x + FILLERS * CELL, window.y + i * ROW_PITCH + LIP + INSET.y, CHARS, FILLERS));
  const plateY = (BOX.height - PLATE) / 2;
  return {
    width: BOX.width + extra,
    height: BOX.height,
    box,
    window,
    rows,
    plate: plate === 'left' ? { x: 0, y: plateY } : plate === 'right' ? { x: BOX.width + PLATE_GAP, y: plateY } : undefined,
  };
}

/** The logo's top-left corner, for a logo `width` wide: under the right end of the window. */
export function logoAt(l: Layout, width: number): { x: number; y: number } {
  const below = l.window.y + l.window.height;
  return { x: l.window.x + l.window.width - CELL - width, y: (below + l.box.height - LOGO_HEIGHT) / 2 };
}

export const sizeOf = (plate: PlateSide): { width: number; height: number } => {
  const { width, height } = layout(plate);
  return { width, height };
};
