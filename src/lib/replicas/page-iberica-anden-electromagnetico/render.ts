import { h, overlay, toCells, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { LINE_HEIGHT, MIN_GAP, lineWidth } from '../page-iberica-electromagneticos/dimensions';
import { flipDotLines, flipDotSweep } from '../page-iberica-electromagneticos/flip-dot-lines';
import { mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { cercaniasRoundel, HOUSING, LEGEND, ledRow, minLegend, PANEL, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import { CELLS, type AndenFrame, type AndenOptions } from './def';

// Everything is in millimetres of the reference drawing (renfe-flipdot-re,
// web-replica/reference.svg), shifted so that the sign's corner is at 0,0.
const ORIGIN = { x: 4.3614364, y: 4.8301482 };
export const WIDTH = 190.87605;
export const HEIGHT = 81.160835;
const at = (x: number, y: number) => ({ x: x - ORIGIN.x, y: y - ORIGIN.y });

// The line keeps the drawing's left edge, and sits higher than in the
// drawing to leave room under it for the fluorescent tube (not drawn) before
// the rule above the LED row, which stays where the drawing has it.
const LED_RULE = 56.89837;
const TUBE_GAP = 7.4;
const ROW = at(24.658236, LED_RULE - TUBE_GAP - LINE_HEIGHT);
const LED = at(20.358263, 60.55167);
const led = ledRow(LED.x, LED.y, 158.50243);
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
function housing(frame: AndenFrame, _options: FamilyOptions, slots: Record<string, SVGElement>): VNode[] {
  const panel = at(12.080421, 11.557226);
  const big = { fill: LEGEND, 'font-size': 23.2833, 'font-weight': 700, 'letter-spacing': 1 };
  const divider = (y: number): VNode => {
    const p = at(12.080421, y);
    return h('line', { x1: p.x, y1: p.y, x2: p.x + 176.00145, y2: p.y, stroke: '#000000', 'stroke-width': 0.2 });
  };
  const via = at(58.99646, 33.011734);
  const next = at(146.3284, 23.902781);
  const platform = at(106.98637, 33.244568);
  return [
    h('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, rx: 10, fill: HOUSING }),
    h('rect', { x: panel.x, y: panel.y, width: 176.00145, height: 67.75975, rx: 5, fill: PANEL, stroke: '#000000', 'stroke-width': 3 }),
    minLegend(ROW.x + lineWidth(CELLS) + MIN_GAP, ROW.y),
    h('text', { x: via.x, y: via.y, ...big }, ['Vía']),
    h('text', { fill: LEGEND, 'font-size': 7.05556, 'font-weight': 700 }, [
      h('tspan', { x: next.x, y: next.y }, ['Próxima']),
      h('tspan', { x: next.x, y: next.y + 7.761116, 'letter-spacing': 0.15875 }, ['Llegada']),
    ]),
    divider(35.448382),
    divider(LED_RULE),
    cercaniasRoundel(at(21.284002, 16.007592).x + 8.218758, at(21.284002, 16.007592).y + 8.218758, 8.218758),
    // The platform number: a vinyl stuck on beside "Vía".
    h('text', { x: platform.x, y: platform.y, ...big }, [frame.platform], (element) => (slots.platform = element)),
  ];
}

const spec: SignSpec<AndenFrame> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'teleindicador de andén electromagnético de PAGE Ibérica',
  flipDots: flipDotLines({ lines: 1, cells: CELLS, x: ROW.x, y: ROW.y }),
  sweep: () => flipDotSweep(1, CELLS),
  led,
  cells: lineCells,
  ledText: (frame) => frame.led,
  describe,
  housing,
  fill: (frame, slots) => {
    if (slots.platform) slots.platform.textContent = frame.platform;
  },
};

export function renderToString(frame: AndenFrame, options: AndenOptions): string {
  return renderSign(spec, frame, options);
}

export function mount(host: Element, initial: AndenOptions, env: { ticker: Ticker }): MountedSign<AndenFrame> {
  return mountSign(spec, { text: '', minutes: '', platform: '', led: '' }, host, initial, env);
}
