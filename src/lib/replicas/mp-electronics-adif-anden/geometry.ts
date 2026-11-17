import { MP_ADVANCE } from '../../hardware';
import { PANEL_ROWS } from '../mp-electronics-adif/geometry';

/**
 * Where everything goes on a platform display, in units of the distance
 * between two LEDs, as on the boards. Measured on photographs of the three
 * models (Alcázar de San Juan and others), set square.
 *
 * - `plain`: the rows, then the platform number and the stripe.
 * - `clock`: the same with a round clock at the far end.
 * - `vertical`: the clock and the number side by side above the rows, the
 *   stripe down the whole side.
 */
export type Kind = 'plain' | 'clock' | 'vertical';

export { PANEL_ROWS };
/** LEDs between the time panel and the train panel: photographs show about a character's width. */
export const TIME_TRAIN_GAP = 10;
const MARGIN = 4;
const STRIPE = 9;

/** The rows: time and train side by side, then the destination and the running line as wide as both. */
export const TIME_COLS = 5 * MP_ADVANCE;
export const TRAIN_COLS = 13 * MP_ADVANCE;
export const ROWS_WIDTH = TIME_COLS + TIME_TRAIN_GAP + TRAIN_COLS;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layout {
  width: number;
  height: number;
  stripe: Box;
  /** Left edge and top of the block of rows. */
  rows: { x: number; y: number };
  /** Where the platform legend and the number go. */
  platform: { x: number; legendY: number; numberY: number; size: number; anchor: 'start' | 'middle'; stacked: boolean };
  clock?: { cx: number; cy: number; diameter: number };
  logo: { cx: number; baseline: number };
}

/** Offsets inside the block of rows. */
export const ROW_TOPS = { legend1: 6.5, time: 9, legend2: 27.5, destination: 30, line: 44 };
const ROWS_HEIGHT = ROW_TOPS.line + PANEL_ROWS;

function horizontal(clock: boolean, side: 'left' | 'right'): Layout {
  const clockWidth = clock ? 64 : 0;
  const platformWidth = 40;
  const width = MARGIN + clockWidth + (clock ? 2 : 2) + ROWS_WIDTH + 6 + platformWidth + STRIPE + MARGIN;
  const height = MARGIN + ROWS_HEIGHT + 9;
  // Right-handed: clock, rows, number, stripe. Left-handed is the mirror image.
  const flip = (x: number, w: number) => (side === 'right' ? x : width - x - w);
  const clockX = MARGIN;
  const rowsX = MARGIN + clockWidth + 2;
  const platformX = rowsX + ROWS_WIDTH + 6;
  const stripeX = width - MARGIN - STRIPE;
  return {
    width,
    height,
    stripe: { x: flip(stripeX, STRIPE), y: MARGIN, width: STRIPE, height: height - 2 * MARGIN },
    rows: { x: flip(rowsX, ROWS_WIDTH), y: MARGIN },
    platform: { x: flip(platformX, platformWidth) + platformWidth / 2, legendY: MARGIN + 8, numberY: MARGIN + ROWS_HEIGHT - 1, size: 36, anchor: 'middle', stacked: true },
    clock: clock ? { cx: flip(clockX, clockWidth) + clockWidth / 2, cy: height / 2, diameter: 58 } : undefined,
    logo: { cx: flip(rowsX, ROWS_WIDTH) + ROWS_WIDTH / 2, baseline: height - 3.2 },
  };
}

function vertical(side: 'left' | 'right'): Layout {
  const width = MARGIN + STRIPE + 4 + ROWS_WIDTH + 6;
  const top = 70;
  const height = top + ROWS_HEIGHT + 9;
  // Left-handed (as photographed): stripe, then everything else; right-handed is the mirror image.
  const flip = (x: number, w: number) => (side === 'left' ? x : width - x - w);
  const rowsX = MARGIN + STRIPE + 4;
  return {
    width,
    height,
    stripe: { x: flip(MARGIN, STRIPE), y: MARGIN, width: STRIPE, height: height - 2 * MARGIN },
    rows: { x: flip(rowsX, ROWS_WIDTH), y: top },
    platform: { x: flip(rowsX + 30, 0), legendY: MARGIN + 9, numberY: 61, size: 40, anchor: 'middle', stacked: false },
    clock: { cx: flip(width - 6 - 25, 0), cy: 36, diameter: 50 },
    logo: { cx: flip(rowsX, ROWS_WIDTH) + ROWS_WIDTH / 2, baseline: height - 3.2 },
  };
}

export function layout(kind: Kind, side: 'left' | 'right'): Layout {
  return kind === 'vertical' ? vertical(side) : horizontal(kind === 'clock', side);
}

export const sizeOf = (kind: Kind): { width: number; height: number } => {
  const { width, height } = layout(kind, 'left');
  return { width, height };
};
