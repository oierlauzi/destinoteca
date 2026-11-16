import {
  DotMatrix,
  DotTransition,
  h,
  litFlap,
  pageIbericaBold7,
  place,
  textStrip,
  withStuckDots,
  type DotState,
  type LitFlapLook,
  type VNode,
} from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { FLIP_DOT_UNLIT } from '../page-iberica-electromagneticos/flip-dot-lines';
import { mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { cercaniasRoundel, HOUSING, LEGEND, ledRow, PANEL as PANEL_FILL, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { ContinuoFrame, ContinuoOptions } from './def';
import { COLS, HEIGHT, LED, LED_WIDTH, MATRIX, PANEL, PITCH, ROWS, RULES, WIDTH } from './geometry';
import { LEFT } from './presenter';

const font = pageIbericaBold7;
/** The light an LED casts: a pale version of the flaps' green. */
const LED_LIGHT = '#f2ffc4';

const matrix = new DotMatrix<LitFlapLook>({
  modules: [{ x: MATRIX.x, y: MATRIX.y }],
  cols: COLS,
  rows: ROWS,
  pitch: PITCH,
  skin: litFlap(),
  backing: (module, width, height) => [
    h('rect', { x: module.x - 0.6, y: module.y - 0.6, width: width + 1.2, height: height + 1.2, fill: '#1c1c1a', stroke: '#000000', 'stroke-width': 0.2 }),
  ],
});

/** The 96 columns of the line: the text from the left, the time ending at the last column. */
export function lineState(frame: ContinuoFrame, options: FamilyOptions): number[] {
  let line: number[] = Array.from({ length: COLS }, () => 0);
  line = place(line, textStrip(frame.text, font), LEFT, 'left');
  if (options.showMinutes && frame.time) line = place(line, textStrip(frame.time, font), COLS - 1, 'right');
  return line;
}

const dots = (frame: ContinuoFrame, options: FamilyOptions): DotState =>
  withStuckDots([lineState(frame, options)], COLS, ROWS, { on: options.deadOn / 100, off: options.deadOff / 100, seed: options.deadSeed });

const look = (options: FamilyOptions): LitFlapLook => ({
  lit: options.dotColor,
  unlit: options.showOffDots ? FLIP_DOT_UNLIT : null,
  leds: (options as ContinuoOptions).pixelLeds !== false,
  led: LED_LIGHT,
});

export function describe(frame: ContinuoFrame, options: FamilyOptions): string {
  return [`Vía ${frame.platform}`.trim(), font.fold(frame.text).trim(), options.showMinutes ? frame.time : '', frame.led]
    .filter(Boolean)
    .join(' · ');
}

/**
 * The enclosure of the earlier sign, without "Próxima Llegada" or "min.":
 * the roundel and "Vía" sit further right and are a little smaller, as
 * photographed.
 */
function housing(frame: ContinuoFrame, _options: FamilyOptions, slots: Record<string, SVGElement>): VNode[] {
  const legend = { fill: LEGEND, 'font-size': 17.5, 'font-weight': 700, 'letter-spacing': 2.2 };
  const baseline = 28.6;
  return [
    h('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, rx: 10, fill: HOUSING }),
    h('rect', { ...PANEL, rx: 5, fill: PANEL_FILL, stroke: '#000000', 'stroke-width': 3 }),
    ...RULES.map((y) => h('line', { x1: PANEL.x, y1: y, x2: PANEL.x + PANEL.width, y2: y, stroke: '#000000', 'stroke-width': 0.2 })),
    cercaniasRoundel(43.5, 21.6, 6.6),
    h('text', { x: 70.5, y: baseline, ...legend }, ['Vía']),
    h('text', { x: 116, y: baseline, ...legend }, [frame.platform], (element) => (slots.platform = element)),
  ];
}

// Flaps change in a wave from left to right across the whole line, in about a second.
const sweep = (): DotTransition => new DotTransition(1, COLS, ROWS, (_turn, col, row) => col * 10 + row * 8);

const spec: SignSpec<ContinuoFrame, LitFlapLook> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'teleindicador electromagnético de andén de PAGE Ibérica, matriz continua',
  flipDots: matrix,
  sweep,
  led: ledRow(LED.x, LED.y, LED_WIDTH),
  dots,
  look,
  ledText: (frame) => frame.led,
  describe,
  housing,
  fill: (frame, slots) => {
    if (slots.platform) slots.platform.textContent = frame.platform;
  },
};

export function renderToString(frame: ContinuoFrame, options: ContinuoOptions): string {
  return renderSign(spec, frame, options);
}

export function mount(host: Element, options: ContinuoOptions, env: { ticker: Ticker }): MountedSign<ContinuoFrame> {
  return mountSign(spec, { text: '', time: '', platform: '', led: '' }, host, options, env);
}
