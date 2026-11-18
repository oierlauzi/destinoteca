import { CELL, INSET, LIP, MODULE, rowLayout, type Box, type RowLayout } from '../ikusi/modules';

/*
 * One board, in centimetres, from its top-left corner. The proportions are
 * measured on frontal photographs in units of one character's pitch: a row
 * is 2.24 pitches from the next, the header about 7.6 deep, the frame a
 * little under one pitch wide. The character modules are taken to be those
 * of Ikusi's platform signs of Atocha Cercanías (../ikusi/modules.ts), so the
 * whole board is scaled to their guessed pitch of 6.9 cm: a board of 51
 * characters a row comes out about 4 m wide. No board has been measured.
 */

/** The frame round the front, on the sides and the top. */
export const FRAME = 0.85 * CELL;
/** The frame's band along the bottom, which carries the makers' logo. */
export const FRAME_BOTTOM = 1.05 * CELL;
/** The front panel between the frame and the ends of the rows. */
export const SIDE = 0.35 * CELL;
/** Under the last row, before the frame. */
export const UNDER = 0.25 * CELL;
/** The printed header, from the frame to the first row. */
export const HEADER = 7.6 * CELL;
/** From one row's rail to the next. */
export const ROW_PITCH = 2.24 * CELL;
/** The rail of a row: its modules and the lips above and below them. */
export const RAIL_HEIGHT = MODULE.height + 2 * LIP;
/** The corners of the rounded board, and of the others. */
export const CORNER = { rounded: 1.2 * CELL, square: 0.25 };

/** The clock of the boards that have one: five modules half as large again as those of the rows. */
export const CLOCK = { scale: 1.5, chars: 5, fillers: 1 };

/** The makers' logo in the bottom band, about 18 cm wide. */
export const LOGO_HEIGHT = 0.86 * CELL;

/** The three sizes the pictogram and the title have been printed in, as the pictogram's side. */
export const PICTO_SIZES = { grande: 4.2 * CELL, mediano: 3.1 * CELL, pequeno: 2.65 * CELL } as const;
export type PictoSize = keyof typeof PICTO_SIZES;

export interface BoardShape {
  rows: number;
  /** Character modules in each row, the blank ones at the ends apart. */
  cells: number;
}

export const MIN_ROWS = 2;
export const MAX_ROWS = 16;
export const MIN_CELLS = 30;
export const MAX_CELLS = 64;

const clampInt = (value: unknown, min: number, max: number, fallback: number): number => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

export const shapeOf = (options: { rows?: unknown; cells?: unknown }): BoardShape => ({
  rows: clampInt(options.rows, MIN_ROWS, MAX_ROWS, 12),
  cells: clampInt(options.cells, MIN_CELLS, MAX_CELLS, 51),
});

/** The first module of every row, the blank ones before it included. */
const RAIL_X = FRAME + SIDE;

export function boardSize({ rows, cells }: BoardShape): { width: number; height: number } {
  return {
    width: 2 * RAIL_X + (cells + 4) * CELL,
    height: FRAME + HEADER + (rows - 1) * ROW_PITCH + RAIL_HEIGHT + UNDER + FRAME_BOTTOM,
  };
}

/** The rail of row `i`, counted from 0. */
export function boardRow(i: number, cells: number): RowLayout {
  const top = FRAME + HEADER + i * ROW_PITCH;
  return rowLayout(RAIL_X + 2 * CELL, top + LIP + INSET.y, cells);
}

/** The left edge of the glass of character `cell` in any row. */
export const glassX = (cell: number): number => RAIL_X + 2 * CELL + INSET.x + cell * CELL;

/** The front panel, inside the frame. */
export function panel(shape: BoardShape): Box {
  const { width, height } = boardSize(shape);
  return { x: FRAME, y: FRAME, width: width - 2 * FRAME, height: height - FRAME - FRAME_BOTTOM };
}

/** The top of the first row's rail, where the header ends. */
export const HEADER_BOTTOM = FRAME + HEADER;

/**
 * The clock's window at the top left of the header, over the first
 * column's legend, and its row of large modules, drawn at the origin and
 * placed with `transform`.
 */
export function clockLayout(): { window: Box; row: RowLayout; transform: string } {
  const row = rowLayout(0, LIP + INSET.y, CLOCK.chars, CLOCK.fillers);
  const x = RAIL_X + 0.6 * CELL;
  const y = FRAME + 0.55 * CELL;
  return {
    window: { x, y, width: row.rail.width * CLOCK.scale, height: row.rail.height * CLOCK.scale },
    row,
    // The row is laid out from its rail's top-left corner at the origin.
    transform: `translate(${x - row.rail.x * CLOCK.scale},${y}) scale(${CLOCK.scale})`,
  };
}
