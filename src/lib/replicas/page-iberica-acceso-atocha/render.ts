import { textStrip, type LitFlapLook } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { enclosure, fillPlatform, flipRow, rowDots, rowLook, rowSweep, thinFont } from '../page-iberica-electromagneticos/atocha';
import { mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { ledRow, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { AccesoFrame, AccesoOptions } from './def';
import { HEIGHT, LAYOUT, LED, ROW, WIDTH } from './geometry';

export function describe(frame: AccesoFrame, options: FamilyOptions): string {
  return [`Vía ${frame.platform}`.trim(), thinFont.fold(frame.text).trim(), options.showMinutes ? frame.time : '', frame.led]
    .filter(Boolean)
    .join(' · ');
}

const spec: SignSpec<AccesoFrame, LitFlapLook> = {
  width: WIDTH,
  height: HEIGHT,
  credit: 'teleindicador electromagnético de acceso a andén de PAGE Ibérica, Atocha Cercanías',
  flipDots: flipRow(ROW.x, ROW.y),
  sweep: rowSweep,
  led: ledRow(LED.x, LED.y, LED.width),
  dots: (frame, options) => rowDots(frame.text, options.showMinutes && frame.time ? textStrip(frame.time, thinFont) : [], options),
  look: rowLook,
  ledText: (frame) => frame.led,
  describe,
  housing: (frame, _options, slots) => enclosure(LAYOUT, frame.platform, slots, 'page-logo-acceso-atocha'),
  fill: (frame, slots) => fillPlatform(frame.platform, slots),
};

export function renderToString(frame: AccesoFrame, options: AccesoOptions): string {
  return renderSign(spec, frame, options);
}

export function mount(host: Element, options: AccesoOptions, env: { ticker: Ticker }): MountedSign<AccesoFrame> {
  return mountSign(spec, { text: '', time: '', platform: '', led: '' }, host, options, env);
}
