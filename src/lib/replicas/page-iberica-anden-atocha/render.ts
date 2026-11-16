import { DotMatrix, h, pageIbericaLed12, pageIbericaThin7Own, roundLed, textStrip, type LitFlapLook, type RoundLedLook } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { enclosure, fillPlatform, flipRow, rowDots, rowLook, rowSweep, thinFont } from '../page-iberica-electromagneticos/atocha';
import { mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import type { FamilyOptions, LedRow } from '../page-iberica-electromagneticos/parts';
import type { AndenAtochaFrame, AndenAtochaOptions } from './def';
import { HEIGHT, LAYOUT, PANEL, PANEL_COLS, PANEL_LINES, PANEL_ROWS, ROW, WIDTH } from './geometry';

/** "7 min": the number, a space, and "min" in the typeface's lowercase. */
export function minutesStrip(minutes: string): number[] {
  return textStrip(`${minutes} min`, pageIbericaThin7Own);
}

/** An unlit LED of the panel: its diffuser is a light grey. */
const PANEL_UNLIT = '#8b8e89';

const panel: LedRow = {
  matrix: new DotMatrix<RoundLedLook>({
    modules: [{ x: PANEL.x, y: PANEL.y }],
    cols: PANEL_COLS,
    rows: PANEL_ROWS,
    pitch: PANEL.pitch,
    skin: roundLed({ litRadius: 0.45, unlitRadius: 0.33 }),
    backing: (module, width, height) => [
      h('rect', { x: module.x - 1, y: module.y - 1, width: width + 2, height: height + 2, fill: '#62655f', stroke: '#000000', 'stroke-width': 0.3 }),
    ],
  }),
  cols: PANEL_COLS,
  lines: PANEL_LINES,
  strip: (text) => textStrip(text, pageIbericaLed12),
  align: 'left',
  look: (options) => ({ lit: options.ledColor, unlit: PANEL_UNLIT }),
};

export function describe(frame: AndenAtochaFrame, options: FamilyOptions): string {
  const minutes = options.showMinutes && frame.minutes ? `${frame.minutes} min` : '';
  return [`Vía ${frame.platform}`.trim(), thinFont.fold(frame.text).trim(), minutes, frame.label, frame.led].filter(Boolean).join(' · ');
}

const spec: SignSpec<AndenAtochaFrame, LitFlapLook> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'teleindicador electromagnético de andén de PAGE Ibérica, Atocha Cercanías',
  flipDots: flipRow(ROW.x, ROW.y),
  sweep: rowSweep,
  led: panel,
  dots: (frame, options) => rowDots(frame.text, options.showMinutes && frame.minutes ? minutesStrip(frame.minutes) : [], options),
  look: rowLook,
  ledText: (frame) => [frame.label, frame.led],
  describe,
  housing: (frame, _options, slots) => enclosure(LAYOUT, frame.platform, slots, 'page-logo-anden-atocha'),
  fill: (frame, slots) => fillPlatform(frame.platform, slots),
};

export function renderToString(frame: AndenAtochaFrame, options: AndenAtochaOptions): string {
  return renderSign(spec, frame, options);
}

export function mount(host: Element, options: AndenAtochaOptions, env: { ticker: Ticker }): MountedSign<AndenAtochaFrame> {
  return mountSign(spec, { text: '', minutes: '', platform: '', label: '', led: '' }, host, options, env);
}
