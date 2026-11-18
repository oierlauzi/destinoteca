import {
  h,
  lcdModules,
  ledCells,
  ikusi7x9,
  updateLcd,
  updateLedCells,
  type LcdLook,
  type LcdModule,
  type LcdRefs,
  type LedCellLook,
  type LedCellRefs,
  type VNode,
} from '../../hardware';
import type { Field } from '../../params';
import { IKUSI_GLASSES } from '../ikusi/glass';
import { DOTS_7X9, GLASS, type Box } from '../ikusi/modules';

/*
 * What the signs Ikusi made for Metro Bilbao share: Ikusi's own character
 * modules on rails (../ikusi/modules.ts) behind a window in a black box,
 * glasses of 7 × 9 dots with characters of their own, their colours, and
 * the NaviLens code fitted beside them since 2024. The platform signs had
 * their glasses replaced by LED modules of the same size that draw the same
 * characters; the notice boards are drawn as photographed, with glasses.
 */

/** What the characters are made of: the original glasses, or the LED modules put in their place. */
export type Tech = 'lcd' | 'led';

export interface WearOptions {
  /** Per cent: how far the characters have drifted apart in shade. */
  uneven: number;
  /** Per cent of glasses with a patch where they have come apart. */
  delamination: number;
  wearSeed: number;
}

/** The settings of wear, with the URL keys of Ikusi's other signs. */
export const wearFields = (group: string): Field[] => [
  { key: 'uneven', urlKey: 'tono', type: 'range', label: 'ikusi.opt.uneven', help: 'ikusi.opt.uneven.help', default: 25, min: 0, max: 100, step: 5, unit: '%', group },
  { key: 'delamination', urlKey: 'despegado', type: 'range', label: 'ikusi.opt.delamination', help: 'ikusi.opt.delamination.help', default: 0, min: 0, max: 50, step: 1, unit: '%', group },
  { key: 'wearSeed', urlKey: 'semilla', type: 'number', label: 'ikusi.opt.wearSeed', default: 1, min: 0, max: 0xffffffff, group, hidden: true, shuffle: true },
];

/**
 * The glasses: the yellow characters of Ikusi's amber modules, over a glow
 * browner than theirs, measured on photographs of Metro Bilbao's signs.
 * Their dots are Ikusi's 7 × 9 (../ikusi/modules.ts), further apart down
 * than across, as on the LED modules that replaced them.
 */
export const lcdLook = (options: WearOptions): LcdLook => ({
  ...DOTS_7X9,
  lit: IKUSI_GLASSES.ambar.lit,
  litAged: IKUSI_GLASSES.ambar.litAged,
  blank: '#8f6328',
  blankDull: '#4f4030',
  uneven: options.uneven / 100,
  delamination: options.delamination / 100,
  seed: options.wearSeed,
});

/**
 * The LED modules, as large as the glasses they replaced: 7 × 9 dots,
 * further apart down than across, amber when lit; the others glow faintly,
 * the same in every module, with a character or without.
 */
export const ledLook = (options: WearOptions): LedCellLook => ({
  width: GLASS.width,
  height: GLASS.height,
  pitchX: 0.76,
  pitchY: 0.9,
  litRadius: 0.36,
  radius: 0.27,
  back: '#120b09',
  lit: '#ffc244',
  faint: '#5e3c1a',
  uneven: options.uneven / 100,
  seed: options.wearSeed,
});

/** How the boards write a text: capitals without accents but the Ñ, and a blank for what they have no character for. */
export const fold = ikusi7x9.fold;

export interface CellRefs {
  lcd: LcdRefs;
  led: LedCellRefs;
}

export const newCellRefs = (): CellRefs => ({ lcd: { glyph: [] }, led: { lit: [], rest: [] } });

/** One row's characters, in glasses or in LED modules; `first` numbers them across the board. */
export function cellNodes(tech: Tech, at: LcdModule[], chars: string[], options: WearOptions, first: number, refs?: CellRefs): VNode[] {
  return tech === 'led'
    ? ledCells(at, chars, ikusi7x9, ledLook(options), first, refs?.led)
    : lcdModules(at, chars, ikusi7x9, lcdLook(options), first, refs?.lcd);
}

export function updateCells(tech: Tech, refs: CellRefs, at: LcdModule[], chars: string[], options: WearOptions): void {
  if (tech === 'led') updateLedCells(refs.led, at, chars, ikusi7x9, ledLook(options));
  else updateLcd(refs.lcd, at, chars, ikusi7x9, lcdLook(options));
}

// --- The box -----------------------------------------------------------------------

const BODY = '#1b1a19';
const RIM = '#3c3a38';
const SHADE = '#0b0a0a';

/** The black box, its edge catching the light, with rounded corners. */
export function boxNodes(box: Box, corner: number): VNode[] {
  return [
    h('rect', { ...box, rx: corner, fill: BODY }),
    h('rect', { x: box.x + 0.3, y: box.y + 0.3, width: box.width - 0.6, height: box.height - 0.6, rx: Math.max(0, corner - 0.3), fill: 'none', stroke: RIM, 'stroke-width': 0.6 }),
  ];
}

/** The window the rows show through: sunk, with its edge in shadow. */
export function windowNodes(window: Box): VNode[] {
  return [
    h('rect', { x: window.x - 0.5, y: window.y - 0.5, width: window.width + 1, height: window.height + 1, rx: 0.4, fill: SHADE }),
    h('rect', { ...window, fill: '#141313' }),
  ];
}
