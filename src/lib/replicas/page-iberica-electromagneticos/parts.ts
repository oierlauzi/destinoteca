import {
  DotMatrix,
  encodeCells,
  garble,
  glyphState,
  h,
  hashText,
  marqueeWindow,
  num,
  roundLed,
  textColumns,
  withStuckDots,
  type DotState,
  type OctagonFlapLook,
  type RoundLedLook,
  type VNode,
} from '../../hardware';
import type { ParamSchema } from '../../params';
import {
  LED_HEIGHT,
  LINE_HEIGHT,
  MIN_HEIGHT,
  MIN_WIDTH,
  REFLECTOR_HEIGHT,
  REFLECTOR_INSET,
  SOCKET_WIDTH,
  TUBE_RADIUS,
} from './dimensions';
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
  /**
   * The dots of the whole panel, for one whose lines are not rows of a single
   * matrix (separate LED rows). Without it, `panelState` lays the lines out.
   */
  state?(strips: number[][], offsets: number[]): DotState;
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

/**
 * Several red LED rows like `ledRow`, all `width` wide, with their tops at
 * `ys`: one per sign of a unit that stacks several, each running its own text.
 * They are one matrix with a module per row, so they light and scroll together
 * with the rest of the sign.
 */
export function ledRows(x: number, ys: number[], width: number): LedRow {
  const cols = Math.floor((width - LED_PITCH) / LED_PITCH);
  const left = x + (width - cols * LED_PITCH) / 2;
  const inset = (LED_HEIGHT - LED_ROWS * LED_PITCH) / 2;
  const matrix = new DotMatrix<RoundLedLook>({
    modules: ys.map((y) => ({ x: left, y: y + inset })),
    cols,
    rows: LED_ROWS,
    pitch: LED_PITCH,
    skin: roundLed(),
    backing: (module) => [h('rect', { x, y: module.y - inset, width, height: LED_HEIGHT, fill: '#2c0a11', stroke: '#000000', 'stroke-width': 0.2 })],
  });
  return {
    matrix,
    cols,
    lines: ys.map(() => 0),
    strip: ledStrip,
    align: 'center',
    look: ledLook,
    state: (strips, offsets) => ys.map((_, i) => ledWindow(strips[i] ?? [], cols, offsets[i] ?? 0, 'center')),
  };
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
  if (panel.state) return panel.state(strips, offsets);
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

// "min." is set in a stack with known metrics, so that it fills its room the
// same everywhere. From Liberation Sans, whose metrics are Arial's and so
// Helvetica's: the top of the "i", and where the ink of "min." starts and
// ends, in ems from the start of the text.
const MIN_FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
const I_TOP = 0.7246;
const MIN_INK = { from: 0.0664, to: 1.7979 };
const MIN_SIZE = MIN_HEIGHT / I_TOP;
const MIN_SQUEEZE = MIN_WIDTH / ((MIN_INK.to - MIN_INK.from) * MIN_SIZE);

/**
 * The narrow "min." at the end of a flip-dot line whose flaps start at `top`:
 * its ink fills the room from `x`, the edge of the last character, to the end
 * of the line. It stands on the characters' middle, as in photographs.
 */
export function minLegend(x: number, top: number): VNode {
  const baseline = top + LINE_HEIGHT / 2 + MIN_HEIGHT / 2;
  const start = x - MIN_INK.from * MIN_SIZE * MIN_SQUEEZE;
  return h(
    'text',
    { transform: `translate(${num(start)},${num(baseline)}) scale(${num(MIN_SQUEEZE)},1)`, fill: MIN_LEGEND, 'font-family': MIN_FONT, 'font-size': MIN_SIZE },
    ['min.'],
  );
}

const REFLECTOR = '#0d0d0d';
const TUBE = '#e6e8e1';
const SOCKET = '#cfcfc8';

/**
 * The fluorescent tube that lights a flip-dot line from below, in front of
 * the bottom of the line's unit, whose bottom-left corner is (x, bottom) and
 * which is `width` wide. The reflector hides the lower half of the tube and
 * the sockets at its ends; what shows over it is the upper half.
 */
export function lineLamp(x: number, bottom: number, width: number): VNode {
  const top = bottom - REFLECTOR_HEIGHT;
  const reflector = { x: x + REFLECTOR_INSET, width: width - REFLECTOR_INSET * 2 };
  const tube = { x: reflector.x + SOCKET_WIDTH, y: top - TUBE_RADIUS, width: reflector.width - SOCKET_WIDTH * 2, height: TUBE_RADIUS };
  return h('g', {}, [
    h('rect', { ...tube, fill: TUBE }),
    ...[reflector.x, tube.x + tube.width].map((at) => h('rect', { x: at, y: tube.y, width: SOCKET_WIDTH, height: TUBE_RADIUS, fill: SOCKET })),
    h('rect', { x: reflector.x, y: top, width: reflector.width, height: REFLECTOR_HEIGHT, fill: REFLECTOR }),
  ]);
}
