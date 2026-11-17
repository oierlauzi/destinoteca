import {
  DotMatrix,
  DotTransition,
  h,
  litFlap,
  pageIbericaThin7Own,
  place,
  textStrip,
  withStuckDots,
  type DotState,
  type LitFlapLook,
  type VNode,
} from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { ENCLOSURE, FACE as FACE_FILL, rowLook, thinFont } from '../page-iberica-electromagneticos/atocha';
import { mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { pageLogoPlate } from '../page-iberica-electromagneticos/page-logo';
import { ledRow, LEGEND, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import { fromFlat, LINE_COUNT, type PasarelaFrame, type PasarelaLine, type PasarelaOptions } from './def';
import {
  colX,
  COLS,
  DESTINATION_LEFT,
  FACE,
  faceAt,
  FACES,
  FRAME,
  GREY_HEIGHT,
  HEADER,
  HEIGHT,
  LED,
  LINE,
  lineAt,
  LINES,
  MINUTES_RIGHT,
  PITCH,
  PLATFORM_RIGHT,
  ROWS,
  WIDTH,
} from './geometry';

/** "2min": the number and "min" in the typeface's lowercase, with no space between. */
export function minutesStrip(minutes: string): number[] {
  return textStrip(`${minutes}min`, pageIbericaThin7Own);
}

/** The dots of one line, faults included; each line fails on its own. */
function lineDots(line: PasarelaLine | undefined, index: number, options: FamilyOptions): number[] {
  let dots: number[] = Array.from({ length: COLS }, () => 0);
  if (line) {
    dots = place(dots, textStrip(line.platform.trim().slice(-2), thinFont), PLATFORM_RIGHT, 'right');
    dots = place(dots, textStrip(line.text, thinFont), DESTINATION_LEFT, 'left');
    if (options.showMinutes && line.minutes) dots = place(dots, minutesStrip(line.minutes), MINUTES_RIGHT, 'right');
  }
  return withStuckDots([dots], COLS, ROWS, { on: options.deadOn / 100, off: options.deadOff / 100, seed: options.deadSeed + index * 7919 })[0]!;
}

const dots = (frame: PasarelaFrame, options: FamilyOptions): DotState =>
  Array.from({ length: LINE_COUNT }, (_, i) => lineDots(frame.lines[i], i, options));

const flipDots = new DotMatrix<LitFlapLook>({
  modules: Array.from({ length: LINE_COUNT }, (_, i) => lineAt(Math.floor(i / LINES), i % LINES)),
  cols: COLS,
  rows: ROWS,
  pitch: PITCH,
  skin: litFlap(),
  backing: (module, width, height) => [
    h('rect', { x: module.x - 0.6, y: module.y - 0.6, width: width + 1.2, height: height + 1.2, fill: FACE_FILL, stroke: '#000000', 'stroke-width': 0.2 }),
  ],
});

// Each line changes in a wave from left to right, the lines one after another.
const sweep = (): DotTransition => new DotTransition(LINE_COUNT, COLS, ROWS, (_turn, col, row) => col * 6 + row * 8);

/** The faces' rounded corners, and the frame's, concentric with them around the same centre. */
const INNER_CORNER = 10;
const CORNER = FRAME + INNER_CORNER;

/** A face's outline, with its outer top corner rounded and the other three square. */
function facePath(x: number, y: number, outer: 'left' | 'right'): string {
  const r = INNER_CORNER;
  const right = x + FACE.width;
  const bottom = y + FACE.height;
  return outer === 'left'
    ? `M${x},${bottom}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}H${right}V${bottom}Z`
    : `M${x},${bottom}V${y}H${right - r}A${r},${r} 0 0 1 ${right},${y + r}V${bottom}Z`;
}

/** One face: its printed header and the band of each line. */
function face(index: number): VNode[] {
  const { x, y } = faceAt(index);
  const legend = { fill: LEGEND, 'font-weight': 700 };
  const big = 6 * PITCH;
  const small = 2.7 * PITCH;
  const nodes: VNode[] = [
    // Rounded only at the corner where the frame around it is: the outer top corner.
    h('path', { d: facePath(x, y, index === 0 ? 'left' : 'right'), fill: FACE_FILL, stroke: '#000000', 'stroke-width': 2.6 }),
    h('text', { x: colX(index, 4), y: y + HEADER - 3.6 * PITCH, 'font-size': big / 0.72, ...legend }, ['Vía']),
    h('text', { x: colX(index, 41), y: y + HEADER - 3.6 * PITCH, 'font-size': big / 0.72, ...legend }, ['Destino']),
    h('text', { x: colX(index, 116), y: y + HEADER - 7.4 * PITCH, 'font-size': small / 0.72, 'text-anchor': 'middle', ...legend }, ['Próximo']),
    h('text', { x: colX(index, 116), y: y + HEADER - 3.6 * PITCH, 'font-size': small / 0.72, 'text-anchor': 'middle', ...legend }, ['tren']),
  ];
  for (let line = 0; line < LINES; line++) {
    const top = y + HEADER + line * LINE;
    // Each line's module is a darker band, with a thin rule between them.
    nodes.push(h('rect', { x: x + 1.5, y: top + 1.6 * PITCH, width: FACE.width - 3, height: LINE - 3.2 * PITCH, fill: '#141518' }));
    nodes.push(h('line', { x1: x, y1: top, x2: x + FACE.width, y2: top, stroke: '#3a3b3f', 'stroke-width': 0.5 }));
  }
  return nodes;
}

function housing(): VNode[] {
  return [
    // The LED row's black housing, square, under the grey frame.
    h('rect', { x: 0, y: LED.band.y - 4, width: WIDTH, height: LED.band.height + 4, fill: '#1c1c1d', stroke: '#000000', 'stroke-width': 0.6 }),
    // The grey frame: rounded at the top, square at the bottom where the LED housing meets it.
    h('path', { d: `M0,${GREY_HEIGHT}V${CORNER}A${CORNER},${CORNER} 0 0 1 ${CORNER},0H${WIDTH - CORNER}A${CORNER},${CORNER} 0 0 1 ${WIDTH},${CORNER}V${GREY_HEIGHT}Z`, fill: ENCLOSURE, stroke: '#77776f', 'stroke-width': 0.6 }),
    ...Array.from({ length: FACES }, (_, i) => face(i)).flat(),
    // The makers' plate, centred under each face.
    ...Array.from({ length: FACES }, (_, i) => pageLogoPlate(faceAt(i).x + FACE.width / 2, GREY_HEIGHT - FRAME / 2, 2.9, `page-logo-pasarela-${i}`)),
  ];
}

export function describe(frame: PasarelaFrame, options: FamilyOptions): string {
  const lines = frame.lines
    .filter((line) => line.platform || line.text || line.minutes)
    .map((line) => [line.platform, thinFont.fold(line.text).trim(), options.showMinutes && line.minutes ? `${line.minutes} min` : ''].filter(Boolean).join(' '));
  return [...lines, frame.led].filter(Boolean).join(' · ');
}

const spec: SignSpec<PasarelaFrame, LitFlapLook> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'panel electromagnético de PAGE Ibérica, pasarela de Atocha Cercanías',
  flipDots,
  sweep,
  led: ledRow(LED.x, LED.y, LED.width, LED.height),
  dots,
  look: rowLook,
  ledText: (frame) => frame.led,
  describe,
  housing: () => housing(),
};

export function renderToString(frame: PasarelaFrame, options: PasarelaOptions): string {
  return renderSign(spec, frame, options);
}

export function mount(host: Element, options: PasarelaOptions, env: { ticker: Ticker }): MountedSign<PasarelaFrame> {
  return mountSign(spec, fromFlat({}), host, options, env);
}
