import { h, overlay, toCells } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { CELLS } from '../page-iberica-anden-electromagnetico/def';
import { fillSignFace, LED, LED_WIDTH, PANEL_TOP, panelRect, panelRule, ROW, signFace } from '../page-iberica-anden-electromagnetico/render';
import { LINE_HEIGHT } from '../page-iberica-electromagneticos/dimensions';
import { flipDotLines, flipDotSweep } from '../page-iberica-electromagneticos/flip-dot-lines';
import { characterDots, mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { flipLook, HOUSING, ledRows, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import { HEIGHT, PANEL_HEIGHT, WIDTH, type DosViasFrame, type DosViasHalf, type DosViasOptions } from './def';

/** The 16 characters of one half's line: its text, with the minutes written over its end. */
export function lineCells(half: DosViasHalf, options: FamilyOptions): string[] {
  const cells = toCells(half.text, CELLS);
  return options.showMinutes ? overlay(cells, half.minutes, 'right') : cells;
}

/** What a screen reader says instead of the dots: one half after the other. */
export function describe(frame: DosViasFrame, options: FamilyOptions): string {
  return frame.halves
    .map((half) => {
      const parts = [`Vía ${half.platform}`.trim()];
      const line = lineCells(half, { ...options, showMinutes: false }).join('').trim();
      if (line) parts.push(line);
      if (options.showMinutes && half.minutes) parts.push(`${half.minutes} min.`);
      if (half.led) parts.push(half.led);
      return parts.join(' · ');
    })
    .join(' / ');
}

const spec: SignSpec<DosViasFrame> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'teleindicador electromagnético de andén de PAGE Ibérica, de dos vías',
  // The single sign's line, and the same again one panel lower.
  flipDots: flipDotLines({ lines: 2, cells: CELLS, x: ROW.x, y: ROW.y, lineGap: PANEL_HEIGHT - LINE_HEIGHT }),
  sweep: () => flipDotSweep(2, CELLS),
  led: ledRows(LED.x, [LED.y, LED.y + PANEL_HEIGHT], LED_WIDTH),
  dots: (frame, options) => characterDots(frame.halves.flatMap((half) => lineCells(half, options)), options),
  look: flipLook,
  ledText: (frame) => frame.halves.map((half) => half.led),
  describe,
  // One panel runs the whole height, the rows of both signs following each
  // other like a rack, with the same hairline between the two halves as
  // between any two rows.
  housing: (frame, options, slots) => [
    h('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, rx: 10, fill: HOUSING }),
    panelRect(PANEL_TOP, 2 * PANEL_HEIGHT),
    panelRule(PANEL_TOP + PANEL_HEIGHT),
    ...signFace(0, frame.halves[0].platform, options, slots, '1', false),
    ...signFace(PANEL_HEIGHT, frame.halves[1].platform, options, slots, '2', false),
  ],
  fill: (frame, slots, options) => {
    fillSignFace(frame.halves[0].platform, options, slots, '1');
    fillSignFace(frame.halves[1].platform, options, slots, '2');
  },
};

export function renderToString(frame: DosViasFrame, options: DosViasOptions): string {
  return renderSign(spec, frame, options);
}

const EMPTY: DosViasHalf = { platform: '', text: '', minutes: '', led: '' };

export function mount(host: Element, initial: DosViasOptions, env: { ticker: Ticker }): MountedSign<DosViasFrame> {
  return mountSign(spec, { halves: [EMPTY, EMPTY] }, host, initial, env);
}
