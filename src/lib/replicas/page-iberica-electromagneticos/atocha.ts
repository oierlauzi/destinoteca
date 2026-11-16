import {
  DotMatrix,
  DotTransition,
  h,
  litFlap,
  pageIbericaThin7,
  place,
  textStrip,
  withStuckDots,
  type DotState,
  type LitFlapLook,
  type VNode,
} from '../../hardware';
import { FLIP_DOT_UNLIT } from './flip-dot-lines';
import { pageLogoPlate } from './page-logo';
import { cercaniasRoundel, LEGEND, type FamilyOptions } from './parts';

/**
 * What the PAGE Ibérica signs of Atocha Cercanías share: a grey enclosure
 * with a black face, a header with the Cercanías roundel, "Vía N" and
 * "Próximo tren", one continuous flip-dot line lit by LEDs written in a light
 * proportional typeface, and the makers' plate centred under the face.
 *
 * Measured on photographs. The line is taken to have the same dots as the
 * Alcalá de Henares sign (same pitch); the photographs then give it about 104
 * columns, from the text, which starts one column in, and the time or the
 * minutes, which end two columns before the end.
 */
export const COLS = 104;
export const ROWS = 7;
export const PITCH = (16 * 7.9834499 + 15 * 1.4552071) / 96;
/** The first column of the text. */
export const LEFT = 1;
/** The last column of what is right-aligned. */
export const RIGHT = COLS - 3;

export const ENCLOSURE = '#a3a39f';
const ENCLOSURE_EDGE = '#77776f';
export const FACE = '#1b1c1f';
const RULE = '#000000';
const LED_LIGHT = '#f2ffc4';

export const thinFont = pageIbericaThin7;

/** The flip-dot line, its top-left dot's square at (x, y). */
export function flipRow(x: number, y: number): DotMatrix<LitFlapLook> {
  return new DotMatrix<LitFlapLook>({
    modules: [{ x, y }],
    cols: COLS,
    rows: ROWS,
    pitch: PITCH,
    skin: litFlap(),
    backing: (module, width, height) => [
      h('rect', { x: module.x - 0.6, y: module.y - 0.6, width: width + 1.2, height: height + 1.2, fill: FACE, stroke: '#000000', 'stroke-width': 0.2 }),
    ],
  });
}

/** The line's dots: `text` from the left, `right` (already as columns) ending near the right end. */
export function rowDots(text: string, right: number[], options: FamilyOptions): DotState {
  let line: number[] = Array.from({ length: COLS }, () => 0);
  line = place(line, textStrip(text, thinFont), LEFT, 'left');
  line = place(line, right, RIGHT, 'right');
  return withStuckDots([line], COLS, ROWS, { on: options.deadOn / 100, off: options.deadOff / 100, seed: options.deadSeed });
}

export const rowLook = (options: FamilyOptions): LitFlapLook => ({
  lit: options.dotColor,
  unlit: options.showOffDots ? FLIP_DOT_UNLIT : null,
  leds: options.pixelLeds !== false,
  led: LED_LIGHT,
});

// Flaps change in a wave from left to right across the whole line, in about a second.
export const rowSweep = (): DotTransition => new DotTransition(1, COLS, ROWS, (_turn, col, row) => col * 10 + row * 8);

/** Width of the grey frame, the same all round. */
export const FRAME = 10;
/** Black face either side of the flip-dot line. */
const SIDE = 7.3;
const FACE_WIDTH = COLS * PITCH + 2 * SIDE;
/** The header: roundel, "Vía N", "Próximo tren". */
export const HEADER = 29;

export interface Layout {
  width: number;
  height: number;
  face: { x: number; y: number; width: number; height: number };
  /** Top of each section of the face below the header, and the bottom of the last. */
  sections: number[];
}

/**
 * A face of the header and then sections of the given heights, in a frame
 * of constant width. Measured from photographs and set square: the line is
 * centred across the face, with 7.3 units of black either side.
 */
export function layout(heights: number[]): Layout {
  const sections = [FRAME + HEADER];
  for (const height of heights) sections.push(sections[sections.length - 1]! + height);
  const faceHeight = sections[sections.length - 1]! - FRAME;
  return {
    width: FACE_WIDTH + 2 * FRAME,
    height: faceHeight + 2 * FRAME,
    face: { x: FRAME, y: FRAME, width: FACE_WIDTH, height: faceHeight },
    sections,
  };
}

/** Top-left corner of the first dot's square of a flip-dot line centred in a section. */
export function rowAt(frame: Layout, section: number): { x: number; y: number } {
  const top = frame.sections[section]!;
  const bottom = frame.sections[section + 1]!;
  return { x: FRAME + SIDE, y: (top + bottom - ROWS * PITCH) / 2 };
}

/**
 * The enclosure and its legends. The number after "Vía" follows the frame:
 * its node registers itself in `slots` and `fill` updates it.
 */
export function enclosure(frame: Layout, platform: string, slots: Record<string, SVGElement>, id: string): VNode[] {
  const legend = { fill: LEGEND, 'font-weight': 700 };
  const { x, y, width, height } = frame.face;
  // Header contents, from the left of the face; their middle is a little below the header's.
  const middle = y + 17.2;
  const via = { size: 23, baseline: y + 25.5 };
  const next = { size: 9.3, x: x + 147.5 };
  return [
    h('rect', { x: 0, y: 0, width: frame.width, height: frame.height, rx: FRAME + 2, fill: ENCLOSURE, stroke: ENCLOSURE_EDGE, 'stroke-width': 0.6 }),
    // A lip on the inside of the frame, as the light catches it.
    h('rect', { x: x - 2.2, y: y - 2.2, width: width + 4.4, height: height + 4.4, rx: 7.5, fill: 'none', stroke: '#b9b9b4', 'stroke-width': 1.2 }),
    h('rect', { x, y, width, height, rx: 5.5, fill: FACE, stroke: '#0c0c0d', 'stroke-width': 1.2 }),
    ...frame.sections.slice(0, -1).map((ry) => h('line', { x1: x, y1: ry, x2: x + width, y2: ry, stroke: RULE, 'stroke-width': 0.4 })),
    cercaniasRoundel(x + 23.7, middle, 8.4),
    h('text', { x: x + 45, y: via.baseline, 'font-size': via.size, ...legend }, ['Vía']),
    h('text', { x: x + 91, y: via.baseline, 'font-size': via.size, ...legend }, [platform], (element) => (slots.platform = element)),
    h('text', { x: next.x, y: y + 17.1, 'font-size': next.size, 'text-anchor': 'middle', ...legend }, ['Próximo']),
    h('text', { x: next.x, y: y + 26, 'font-size': next.size, 'text-anchor': 'middle', ...legend }, ['tren']),
    // The makers' plate, centred on the bottom of the frame.
    pageLogoPlate(frame.width / 2, frame.height - FRAME / 2, 2.9, id),
  ];
}

export function fillPlatform(platform: string, slots: Record<string, SVGElement>): void {
  if (slots.platform) slots.platform.textContent = platform;
}
