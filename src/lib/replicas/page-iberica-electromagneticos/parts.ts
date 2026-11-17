import {
  DotMatrix,
  encodeCells,
  garble,
  glyphState,
  h,
  hashText,
  marqueeWindow,
  roundLed,
  textColumns,
  withStuckDots,
  type DotState,
  type OctagonFlapLook,
  type RoundLedLook,
  type VNode,
} from '../../hardware';
import type { ParamSchema } from '../../params';
import { LED_HEIGHT, LINE_HEIGHT, MIN_BASELINE } from './dimensions';
import { CELL_COLS, CELL_ROWS, FLIP_DOT_UNLIT, flipDotCharset, flipDotFont } from './flip-dot-lines';

export { LED_HEIGHT };

/**
 * What PAGE Ibérica's electromagnetic signs of the 1990s have in common,
 * beyond the flip-dot lines themselves: the legends, the red LED row under
 * the flip-dots, the faults they are known for, and the settings that go with
 * all that. The platform sign and the concourse boards are built from these.
 */

/** The colour of a lit flap, from photographs of a preserved unit. */
export const FLAP_LIME = '#aede5a';
export const LEGEND = '#f4f2e9';
/** "min." is amber whatever the colour of the flaps beside it. */
export const MIN_LEGEND = '#e2d14a';
export const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
export const HOUSING = '#121212';
export const PANEL = '#303030';

/** The appearance and the faults a sign of this family can be shown with. */
export interface FamilyOptions {
  showMinutes: boolean;
  dotColor: string;
  showOffDots: boolean;
  animate: boolean;
  ledColor: string;
  ledScroll: boolean;
  ledSpeed: number;
  ledIdle: string;
  deadOn: number;
  deadOff: number;
  deadSeed: number;
  hearts: number;
  [key: string]: unknown;
}

// URL keys are those of the original replica in renfe-flipdot-re, so that an
// embed made for it keeps working here with its query string untouched.
export const familyOptionsSchema: ParamSchema = {
  groups: [
    { id: 'look', label: 'pageib.group.look' },
    { id: 'defects', label: 'pageib.group.defects' },
  ],
  fields: [
    { key: 'showMinutes', urlKey: 'showmin', type: 'boolean', label: 'pageib.opt.showMinutes', default: true, group: 'look' },
    {
      // The default is taken from photographs of a preserved unit, whose lit flaps are a lime green
      // (hue near 88 degrees). The other two are the choices of the original replica, kept for the
      // embeds that name them; pages made with it always state their colour, so they are unaffected.
      key: 'dotColor', urlKey: 'dot', type: 'color', label: 'pageib.opt.dotColor', default: FLAP_LIME, group: 'look',
      choices: [
        { value: FLAP_LIME, label: 'pageib.color.lime' },
        { value: '#d9e04a', label: 'pageib.color.yellowGreen' },
        { value: '#e2d14a', label: 'pageib.color.amber' },
      ],
    },
    { key: 'showOffDots', urlKey: 'showoff', type: 'boolean', label: 'pageib.opt.showOffDots', default: true, group: 'look' },
    { key: 'animate', urlKey: 'anim', type: 'boolean', label: 'pageib.opt.animate', help: 'pageib.opt.animate.help', default: true, group: 'look' },
    {
      key: 'ledColor', urlKey: 'ledc', type: 'color', label: 'pageib.opt.ledColor', default: '#ff3b2e', group: 'look',
      choices: [
        { value: '#ff3b2e', label: 'pageib.color.red' },
        { value: '#ff6a1a', label: 'pageib.color.orange' },
        { value: '#ff2b55', label: 'pageib.color.pinkRed' },
      ],
    },
    { key: 'ledScroll', urlKey: 'scroll', type: 'boolean', label: 'pageib.opt.ledScroll', default: true, group: 'look' },
    { key: 'ledSpeed', urlKey: 'speed', type: 'range', label: 'pageib.opt.ledSpeed', default: 14, min: 2, max: 30, step: 1, unit: 'col/s', group: 'look' },
    { key: 'ledIdle', urlKey: 'idle', type: 'text', label: 'pageib.opt.ledIdle', help: 'pageib.opt.ledIdle.help', default: '', group: 'look', glyphs: 'telenorma-cp437' },
    // The switch of the original page: on, a few dots are stuck either way. It is a form control only;
    // what travels in a URL is still the two amounts, so embeds made before it existed are unchanged.
    { type: 'switch', key: 'deadPixels', label: 'pageib.opt.deadPixels', controls: ['deadOn', 'deadOff'], on: { deadOn: 2, deadOff: 2 }, group: 'defects' },
    { key: 'deadOn', urlKey: 'deadon', type: 'range', label: 'pageib.opt.deadOn', default: 0, min: 0, max: 20, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadOff', urlKey: 'deadoff', type: 'range', label: 'pageib.opt.deadOff', default: 0, min: 0, max: 20, step: 0.5, unit: '%', group: 'defects' },
    { key: 'hearts', type: 'range', label: 'pageib.opt.hearts', help: 'pageib.opt.hearts.help', default: 0, min: 0, max: 25, step: 1, unit: '%', group: 'defects' },
    { key: 'deadSeed', urlKey: 'deadseed', type: 'number', label: 'pageib.opt.deadSeed', default: 1, min: 0, max: 0xffffffff, group: 'defects', hidden: true, shuffle: true },
  ],
};

// --- Faults -------------------------------------------------------------------

const HEART = 0x03;

/**
 * The dots of the flip-dot lines for these characters (one string per
 * module, line after line), with the faults asked for. A heart in the middle
 * of a destination was a common sight on these signs: 0x03 is both the heart
 * of the code page and the byte that ends a message. Which cells and dots
 * fail is fixed by the seed, and for hearts by the message too.
 */
export function flipState(cells: string[], options: FamilyOptions): DotState {
  const codes = garble(encodeCells(cells, flipDotCharset), {
    fraction: options.hearts / 100,
    seed: options.deadSeed,
    salt: hashText(cells.join('')),
    replacement: HEART,
  });
  return withStuckDots(glyphState(codes, flipDotFont), CELL_COLS, CELL_ROWS, {
    on: options.deadOn / 100,
    off: options.deadOff / 100,
    seed: options.deadSeed,
  });
}

export const flipLook = (options: FamilyOptions): OctagonFlapLook => ({
  lit: options.dotColor,
  unlit: options.showOffDots ? FLIP_DOT_UNLIT : null,
});

// --- The LED row --------------------------------------------------------------

const LED_ROWS = 7;
const LED_PITCH = (LED_HEIGHT * 12) / 95;
/** Blank columns between the end of a scrolling text and its restart. */
const LED_GAP = 24;
const LED_UNLIT = '#40101a';

/**
 * An LED panel: the red row under the flip-dots, or a matrix that holds
 * several lines of text. Each line is a strip of columns that stands still
 * when it fits and runs right to left when it does not.
 */
export interface LedRow {
  matrix: DotMatrix<RoundLedLook>;
  cols: number;
  /** The top row of each line of text. A row of LEDs has one, at 0. */
  lines: number[];
  /** A text as columns, in the panel's own typeface. */
  strip(text: string): number[];
  /** Where a text that fits stands. */
  align: 'center' | 'left';
  look(options: FamilyOptions): RoundLedLook;
}

/**
 * A red LED row of the given width: seven LEDs high, `height` tall (that of
 * the platform signs unless said otherwise). None was recovered with the
 * salvaged unit; its size and pitch come from photographs.
 */
export function ledRow(x: number, y: number, width: number, height = LED_HEIGHT): LedRow {
  const pitch = height === LED_HEIGHT ? LED_PITCH : (height * 12) / 95;
  const cols = Math.floor((width - pitch) / pitch);
  const matrix = new DotMatrix<RoundLedLook>({
    modules: [{ x: x + (width - cols * pitch) / 2, y: y + (height - LED_ROWS * pitch) / 2 }],
    cols,
    rows: LED_ROWS,
    pitch,
    skin: roundLed(),
    backing: () => [h('rect', { x, y, width, height, fill: '#2c0a11', stroke: '#000000', 'stroke-width': 0.2 })],
  });
  return { matrix, cols, lines: [0], strip: ledStrip, align: 'center', look: ledLook };
}

export const ledLook = (options: FamilyOptions): RoundLedLook => ({ lit: options.ledColor, unlit: LED_UNLIT });

export const ledStrip = (text: string): number[] => textColumns(text, flipDotFont, flipDotCharset, 1);

/** The columns of one line seen through a window `cols` wide, `offset` columns into its run. */
export function ledWindow(strip: number[], cols: number, offset: number, align: LedRow['align'] = 'center'): number[] {
  if (align === 'left' && strip.length <= cols) return Array.from({ length: cols }, (_, c) => strip[c] ?? 0);
  return marqueeWindow(strip, cols, offset, LED_GAP);
}

/** The whole panel: each line's window moved down to its row. */
export function panelState(panel: LedRow, strips: number[][], offsets: number[]): DotState {
  const columns: number[] = Array.from({ length: panel.cols }, () => 0);
  panel.lines.forEach((top, i) => {
    const window = ledWindow(strips[i] ?? [], panel.cols, offsets[i] ?? 0, panel.align);
    window.forEach((byte, c) => (columns[c] = (columns[c] ?? 0) | (byte << top)));
  });
  return [columns];
}

export const ledState = (strip: number[], cols: number, offset: number): DotState => [marqueeWindow(strip, cols, offset, LED_GAP)];

// --- Legends ------------------------------------------------------------------

/** The red Cercanías roundel, centred on (cx, cy). */
export function cercaniasRoundel(cx: number, cy: number, radius: number): VNode {
  const scale = radius / 150;
  return h('g', { transform: `matrix(${scale},0,0,${scale},${cx - radius},${cy - radius})` }, [
    h('circle', { cx: 150, cy: 150, r: 150, fill: '#ef2c30' }),
    h('path', {
      d: 'm 150,100 c 27.429,0 50,22.571 50,50 0,27.429 -22.571,50 -50,50 -27.429,0 -50,-22.571 -50,-50 H 50 c 0,54.858 45.142,100 100,100 54.858,0 100,-45.142 100,-100 C 250,95.142 204.858,50 150,50 Z',
      fill: '#ffffff',
    }),
  ]);
}

/** The narrow "min." beside the end of a flip-dot line whose top is at `top`. */
export function minLegend(x: number, top: number): VNode {
  return h(
    'text',
    { transform: `translate(${x},${top + LINE_HEIGHT * MIN_BASELINE}) scale(0.81099995,1.2330457)`, fill: MIN_LEGEND, 'font-size': 5.65488 },
    ['min.'],
  );
}
