import { h, overlay, toCells, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { DOTS_TOP, MIN_GAP, PI_T100_M, PI_T100_M_WIDTH, PLATFORM_LED_WIDTH, ROW_HEIGHT, dotsInUnit, lineWidth } from '../page-iberica-electromagneticos/dimensions';
import { flipDotLines, flipDotSweep } from '../page-iberica-electromagneticos/flip-dot-lines';
import { characterDots, mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { cercaniasRoundel, flipLook, HOUSING, LEGEND, ledRow, lineLamp, minLegend, PANEL, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import { CELLS, type AndenFrame, type AndenOptions } from './def';

// Everything is in millimetres of the reference drawing (renfe-flipdot-re,
// web-replica/reference.svg), shifted so that the sign's corner is at 0,0.
const ORIGIN = { x: 4.3614364, y: 4.8301482 };
export const WIDTH = 190.87605;
export const HEIGHT = 81.160835;
const at = (x: number, y: number) => ({ x: x - ORIGIN.x, y: y - ORIGIN.y });

// The flip-dot line (the PI-T100-M unit) fills the inner panel between its
// black edges, and runs from the hairline under "Vía" to the one over the LED
// row, which follows from its height. Inside it, everything is as measured on
// the recovered unit.
const PANEL_X = at(12.080421, 0).x;
const PANEL_WIDTH = 176.00145;
const PANEL_EDGE = 1.5;
const LINE_TOP = 35.448382;
const LED_RULE = LINE_TOP + ROW_HEIGHT;
/** The flip-dot line's unit: its top-left corner and its width, as seen from the front. */
export const LINE_UNIT = { x: PANEL_X + PANEL_EDGE, y: at(0, LINE_TOP).y, width: PI_T100_M_WIDTH };
/** The flip-dot line's top-left corner. */
export const ROW = { x: LINE_UNIT.x + dotsInUnit(CELLS, PI_T100_M.tubeLength), y: LINE_UNIT.y + DOTS_TOP };
/** The LED row's top-left corner, and its width. */
export const LED_WIDTH = PLATFORM_LED_WIDTH;
export const LED = { x: PANEL_X + (PANEL_WIDTH - LED_WIDTH) / 2, y: at(0, 60.55167).y };
/** Height of the inner panel, which holds everything printed and both displays. */
export const PANEL_HEIGHT = 67.75975;
/** Where the inner panel starts. */
export const PANEL_TOP = at(12.080421, 11.557226).y;
const led = ledRow(LED.x, LED.y, LED_WIDTH);
export const LED_COLS = led.cols;

/** The 16 characters of the flip-dot line: the text, with the minutes written over its end. */
export function lineCells(frame: AndenFrame, options: FamilyOptions): string[] {
  const cells = toCells(frame.text, CELLS);
  return options.showMinutes ? overlay(cells, frame.minutes, 'right') : cells;
}

/** What a screen reader says instead of 1,300 dots. */
export function describe(frame: AndenFrame, options: FamilyOptions): string {
  const parts = [`Vía ${frame.platform}`.trim()];
  const line = lineCells(frame, { ...options, showMinutes: false }).join('').trim();
  if (line) parts.push(line);
  if (options.showMinutes && frame.minutes) parts.push(`${frame.minutes} min.`);
  if (frame.led) parts.push(frame.led);
  return parts.join(' · ');
}

/**
 * The fixed part of the sign: its frame, and the legends. On the real thing
 * those are vinyls on a sheet of metal mounted behind the glass.
 */
/** The legend over the minutes: "Próxima Llegada" on most signs, "Próximo tren" on some (Cercedilla). */
const nextLegend = (options: FamilyOptions): [string, string] => (options.nextLegend === 'tren' ? ['Próximo', 'tren'] : ['Próxima', 'Llegada']);

/** The inner panel, from `top` and `height` tall, with the sign's rounded corners and black edge. */
export function panelRect(top: number, height: number): VNode {
  const corner = at(12.080421, 11.557226);
  return h('rect', { x: corner.x, y: top, width: PANEL_WIDTH, height, rx: 5, fill: PANEL, stroke: '#000000', 'stroke-width': PANEL_EDGE * 2 });
}

/** A hairline between two rows of the panel, at `y` in sign coordinates. */
export function panelRule(y: number): VNode {
  return h('line', { x1: PANEL_X, y1: y, x2: PANEL_X + PANEL_WIDTH, y2: y, stroke: '#000000', 'stroke-width': 0.2 });
}

/**
 * The panel inside the frame and everything printed or stuck on it, `dy`
 * below where this sign has it: a unit that stacks two signs draws it twice.
 * Nodes that follow the frame register in `slots` under their name plus `key`.
 * With `panel` false the inner panel itself is left out, for a unit whose
 * rows run on in one panel.
 */
export function signFace(dy: number, platform: string, options: FamilyOptions, slots: Record<string, SVGElement>, key = '', panel = true): VNode[] {
  const [first, second] = nextLegend(options);
  const here = (x: number, y: number) => at(x, y + dy);
  const corner = here(12.080421, 11.557226);
  const big = { fill: LEGEND, 'font-size': 23.2833, 'font-weight': 700, 'letter-spacing': 1 };
  const divider = (y: number): VNode => {
    const p = here(12.080421, y);
    return h('line', { x1: p.x, y1: p.y, x2: p.x + PANEL_WIDTH, y2: p.y, stroke: '#000000', 'stroke-width': 0.2 });
  };
  const via = here(58.99646, 33.011734);
  const next = here(146.3284, 23.902781);
  const number = here(106.98637, 33.244568);
  const roundel = here(21.284002, 16.007592);
  return [
    ...(panel ? [panelRect(corner.y, PANEL_HEIGHT)] : []),
    minLegend(ROW.x + lineWidth(CELLS) + MIN_GAP, ROW.y + dy),
    lineLamp(LINE_UNIT.x, LINE_UNIT.y + ROW_HEIGHT + dy, LINE_UNIT.width),
    h('text', { x: via.x, y: via.y, ...big }, ['Vía']),
    h('text', { fill: LEGEND, 'font-size': 7.05556, 'font-weight': 700 }, [
      h('tspan', { x: next.x, y: next.y }, [first], (element) => (slots[`next1${key}`] = element)),
      h('tspan', { x: next.x, y: next.y + 7.761116, 'letter-spacing': 0.15875 }, [second], (element) => (slots[`next2${key}`] = element)),
    ]),
    divider(LINE_TOP),
    divider(LED_RULE),
    cercaniasRoundel(roundel.x + 8.218758, roundel.y + 8.218758, 8.218758),
    // The platform number: a vinyl stuck on beside "Vía".
    h('text', { x: number.x, y: number.y, ...big }, [platform], (element) => (slots[`platform${key}`] = element)),
  ];
}

/** Brings the nodes `signFace` registered under `key` up to date. */
export function fillSignFace(platform: string, options: FamilyOptions, slots: Record<string, SVGElement>, key = ''): void {
  const [first, second] = nextLegend(options);
  const next1 = slots[`next1${key}`];
  const next2 = slots[`next2${key}`];
  const number = slots[`platform${key}`];
  if (next1) next1.textContent = first;
  if (next2) next2.textContent = second;
  if (number) number.textContent = platform;
}

function housing(frame: AndenFrame, options: FamilyOptions, slots: Record<string, SVGElement>): VNode[] {
  return [h('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, rx: 10, fill: HOUSING }), ...signFace(0, frame.platform, options, slots)];
}

const spec: SignSpec<AndenFrame> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'teleindicador electromagnético de andén de PAGE Ibérica',
  flipDots: flipDotLines({ lines: 1, cells: CELLS, x: ROW.x, y: ROW.y }),
  sweep: () => flipDotSweep(1, CELLS),
  led,
  dots: (frame, options) => characterDots(lineCells(frame, options), options),
  look: flipLook,
  ledText: (frame) => frame.led,
  describe,
  housing,
  fill: (frame, slots, options) => fillSignFace(frame.platform, options, slots),
};

export function renderToString(frame: AndenFrame, options: AndenOptions): string {
  return renderSign(spec, frame, options);
}

export function mount(host: Element, initial: AndenOptions, env: { ticker: Ticker }): MountedSign<AndenFrame> {
  return mountSign(spec, { text: '', minutes: '', platform: '', led: '' }, host, initial, env);
}
