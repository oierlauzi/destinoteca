import type { LcdLook } from '../../hardware';
import type { Field } from '../../params';
import { IKUSI_GLASSES } from '../ikusi/glass';
import { DOTS_7X9 } from '../ikusi/modules';

/*
 * What Ikusi's platform signs for Euskotren share: a very dark grey box with
 * rounded corners, Ikusi's character modules on rails (../ikusi/modules.ts)
 * with glasses of 7 × 9 dots, yellow printing, and the logo in white.
 */

export interface WearOptions {
  /** Per cent: how far the characters have drifted apart in shade. */
  uneven: number;
  /** Per cent of characters with a patch where the glass has come apart. */
  delamination: number;
  wearSeed: number;
}

/** The settings of wear, with the URL keys of Ikusi's other signs. */
export const wearFields = (group: string): Field[] => [
  { key: 'uneven', urlKey: 'tono', type: 'range', label: 'ikusi.opt.uneven', help: 'ikusi.opt.uneven.help', default: 30, min: 0, max: 100, step: 5, unit: '%', group },
  { key: 'delamination', urlKey: 'despegado', type: 'range', label: 'ikusi.opt.delamination', help: 'ikusi.opt.delamination.help', default: 0, min: 0, max: 50, step: 1, unit: '%', group },
  { key: 'wearSeed', urlKey: 'semilla', type: 'number', label: 'ikusi.opt.wearSeed', default: 1, min: 0, max: 0xffffffff, group, hidden: true, shuffle: true },
];

/**
 * As photographed at Atxuri: lime-yellow characters, and glasses glowing a
 * dull olive when blank, some greener and some browner than others; the
 * colours of Ikusi's olive glasses.
 */
export const lcdLook = (options: WearOptions): LcdLook => ({
  ...DOTS_7X9,
  ...IKUSI_GLASSES.oliva,
  uneven: options.uneven / 100,
  delamination: options.delamination / 100,
  seed: options.wearSeed,
});

export const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
/** Helvetica's capitals, as a share of the font's size. */
export const CAP = 0.718;

/** The box, a very dark grey, and its edge catching the light. */
export const BODY = '#1f2021';
export const RIM = '#393b3d';
/** The printing: yellow, and white for the Basque legends. */
export const YELLOW = '#e2c63a';
export const WHITE = '#ecece6';
export const LOGO = '#d9dad6';
