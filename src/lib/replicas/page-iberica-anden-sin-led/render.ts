import { h, overlay, toCells, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { CELLS } from '../page-iberica-anden-electromagnetico/def';
import { MIN_GAP, ROW_HEIGHT, lineWidth, rowWidth } from '../page-iberica-electromagneticos/dimensions';
import { flipDotLines, flipDotSweep } from '../page-iberica-electromagneticos/flip-dot-lines';
import { characterDots, mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { flipLook, HOUSING, lineLamp, minLegend, PANEL, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { SinLedFrame, SinLedOptions } from './def';
import { HEIGHT, PANEL_HEIGHT, PANEL_WIDTH, PANEL_X, PANEL_Y, ROW_X, ROW_Y, UNIT_X, UNIT_Y, WIDTH } from './geometry';

/** The 16 characters of the line: the text, with the minutes written over its end. */
export function lineCells(frame: SinLedFrame, options: FamilyOptions): string[] {
  const cells = toCells(frame.text, CELLS);
  return options.showMinutes ? overlay(cells, frame.minutes, 'right') : cells;
}

/** What a screen reader says instead of the dots. */
export function describe(frame: SinLedFrame, options: FamilyOptions): string {
  const parts: string[] = [];
  const line = lineCells(frame, { ...options, showMinutes: false }).join('').trim();
  if (line) parts.push(line);
  if (options.showMinutes && frame.minutes) parts.push(`${frame.minutes} min.`);
  return parts.join(' · ');
}

/** The enclosure and inner panel of the sign with the LED row, one line tall, "min." after the line and its tube under it. */
function housing(): VNode[] {
  return [
    h('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, rx: 10, fill: HOUSING }),
    h('rect', { x: PANEL_X, y: PANEL_Y, width: PANEL_WIDTH, height: PANEL_HEIGHT, rx: 5, fill: PANEL, stroke: '#000000', 'stroke-width': 3 }),
    minLegend(ROW_X + lineWidth(CELLS) + MIN_GAP, ROW_Y),
    lineLamp(UNIT_X, UNIT_Y + ROW_HEIGHT, rowWidth(CELLS)),
  ];
}

const spec: SignSpec<SinLedFrame> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'teleindicador electromagnético de andén de PAGE Ibérica, sin fila de LED',
  flipDots: flipDotLines({ lines: 1, cells: CELLS, x: ROW_X, y: ROW_Y }),
  sweep: () => flipDotSweep(1, CELLS),
  dots: (frame, options) => characterDots(lineCells(frame, options), options),
  look: flipLook,
  describe,
  housing,
};

export function renderToString(frame: SinLedFrame, options: SinLedOptions): string {
  return renderSign(spec, frame, options);
}

export function mount(host: Element, initial: SinLedOptions, env: { ticker: Ticker }): MountedSign<SinLedFrame> {
  return mountSign(spec, { text: '', minutes: '' }, host, initial, env);
}
