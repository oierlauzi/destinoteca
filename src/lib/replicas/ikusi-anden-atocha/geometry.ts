import { IKUSI_COLS, IKUSI_ROWS, lcdSize, type LcdModule } from '../../hardware';

/*
 * One unit, in centimetres. The proportions are measured in the photographs
 * of the two-platform boxes of Atocha Cercanías in units of one character's
 * pitch, and scaled to a guessed real size: about 120 cm wide and 53 cm
 * tall, with characters about 8.5 cm tall. No unit has been measured. In a box, the two
 * units are about three characters apart, with a filler between them.
 */

/** From one character to the next. */
export const CELL = 6.9;

/** The logo, about 9 cm wide, on the sheet's margin under the end of the red strip. */
export const LOGO_HEIGHT = 3.2;

/** The dots: 7 × 11 on each glass, nearly touching. */
export const DOTS = { pitch: 0.74, dot: 0.7, pad: 0.2 };
export const GLASS = lcdSize({ cols: IKUSI_COLS, rows: IKUSI_ROWS }, DOTS);

/** Characters in the destination line, and in the time. */
export const LINE = 12;
export const TIME = 5;

/*
 * Each row of characters is a rail with modules clipped onto it, one per
 * character, as on Ikusi's airport boards: a block of dark plastic one
 * character's pitch wide with the glass set in it. Each end of a row is
 * made up with two blank modules of the same width.
 */
/**
 * A module's height; its width is the pitch, less the seam between two
 * modules. Above and below the glass it has a ledge with a groove along it.
 */
export const MODULE = { height: 12, seam: 0.16 };
/** The rail, showing above and below the modules. */
export const LIP = 0.6;
/** Blank modules at each end of a row. */
export const FILLERS = 2;
/** Where the glass sits in its module. */
export const INSET = { x: (CELL - GLASS.width) / 2, y: (MODULE.height - GLASS.height) / 2 };

/** The sheet's margin around the openings, the same on every side. */
export const BEZEL = 5;
/** The full rows, and the margin at each end. */
export const WIDTH = (LINE + 2 * FILLERS) * CELL + 2 * BEZEL;
/** The module of the destination's first character: the full rows are centred, so it is the same on both sides. */
const LINE_START = BEZEL + FILLERS * CELL;
/** The glass of the destination's first character. */
export const LINE_X = LINE_START + INSET.x;
/** The tops of the glasses of each row: the top row's rail starts at the margin. */
export const TOP_Y = BEZEL + LIP + INSET.y;
export const LINE_Y = TOP_Y + 2.2 * CELL;
/** The red strip, under the destination line and as wide as its glasses. */
export const STRIP = { x: LINE_X, y: TOP_Y + 4.55 * CELL, height: 1.0 * CELL, width: (LINE - 1) * CELL + GLASS.width };
/** Around the red strip, inside its opening. */
const STRIP_MARGIN = 2.1;
/** The unit's height: the rows, and the same margin under the red strip's opening as everywhere else. */
export const HEIGHT = STRIP.y + STRIP.height + STRIP_MARGIN + BEZEL;

export type Side = 'left' | 'right';

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RowLayout {
  /** The rail, which fills the row's opening in the sheet. */
  rail: Box;
  /** The modules on it, by their left edge: blank ones at the ends. */
  modules: { x: number; blank: boolean }[];
  moduleY: number;
  /** The glasses of the character modules. */
  glasses: LcdModule[];
}

function layout(firstChar: number, glassY: number, chars: number): RowLayout {
  const first = firstChar - FILLERS * CELL;
  const total = chars + 2 * FILLERS;
  const moduleY = glassY - INSET.y;
  return {
    rail: { x: first, y: moduleY - LIP, width: total * CELL, height: MODULE.height + 2 * LIP },
    modules: Array.from({ length: total }, (_, i) => ({ x: first + i * CELL, blank: i < FILLERS || i >= FILLERS + chars })),
    moduleY,
    glasses: Array.from({ length: chars }, (_, i) => ({ x: firstChar + INSET.x + i * CELL, y: glassY })),
  };
}

/**
 * The time is at the outer end of the top row, over the start or the end of
 * the destination. A unit hung on the left of its pole has it at the left,
 * and the printed «VIA» towards the pole; the one on the right is its mirror
 * image, but writes the same way.
 */
export const timeRow = (side: Side): RowLayout => layout(LINE_START + (side === 'left' ? 0 : (LINE - TIME) * CELL), TOP_Y, TIME);
export const lineRow = (): RowLayout => layout(LINE_START, LINE_Y, LINE);
export const timeModules = (side: Side): LcdModule[] => timeRow(side).glasses;
export const lineModules = (): LcdModule[] => lineRow().glasses;

/** The printed «VIA n», from its left end to its right: past the destination line on the pole's side. */
export function labelSpan(side: Side): { from: number; to: number } {
  // On the sheet, a little past the end of the top row's opening.
  const from = BEZEL + (TIME + 2 * FILLERS) * CELL + 4.15;
  const left = { from, to: from + 5.3 * CELL };
  return side === 'left' ? left : { from: WIDTH - left.to, to: WIDTH - left.from };
}

/** Between the two units of a two-platform box. */
export const FILLER = 3 * CELL;

/**
 * The three openings in the front sheet, one per row. The two of characters
 * are filled by their rails; «VIA» is printed on the sheet beside the top
 * one. The red strip's runs from end to end, larger than the strip.
 */
export function openings(side: Side): { time: Box; line: Box; strip: Box } {
  const line = lineRow().rail;
  return {
    time: timeRow(side).rail,
    line,
    strip: { x: line.x, y: STRIP.y - STRIP_MARGIN, width: line.width, height: STRIP.height + 2 * STRIP_MARGIN },
  };
}

/** The logo's top-left corner: on the sheet under the red strip's opening, starting just past the end of the strip. */
export function logoAt(side: Side): { x: number; y: number } {
  const strip = openings(side).strip;
  const below = strip.y + strip.height;
  return { x: STRIP.x + STRIP.width + 1.2, y: (below + HEIGHT - LOGO_HEIGHT) / 2 };
}
