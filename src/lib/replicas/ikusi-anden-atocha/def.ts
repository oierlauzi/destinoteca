import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import type { ReplicaDef } from '../types';
import { HEIGHT, LINE, TIME, WIDTH, type Side } from './geometry';

/**
 * One of Ikusi's liquid-crystal platform signs of Atocha Cercanías: the vía
 * printed, the time and the destination of the next train in characters of
 * their own, and a red strip whose use is not known. The two-platform boxes
 * of the photographs are two of these, one on each side of the pole.
 */
export interface IkusiFrame {
  /** Departure time, five characters with the colon. */
  time: string;
  /** The destination, or a notice, in 12 characters. */
  text: string;
  /** The number printed after «VIA». */
  platform: string;
  [key: string]: unknown;
}

export interface IkusiOptions {
  side: Side;
  /** Per cent: how far the characters have drifted apart in shade. */
  uneven: number;
  /** Per cent of characters with a patch where the glass has come apart. */
  delamination: number;
  wearSeed: number;
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  groups: [
    { id: 'board', label: 'ikusi.group.board' },
    { id: 'defects', label: 'ikusi.group.wear' },
  ],
  fields: [
    {
      key: 'side', urlKey: 'lado', type: 'select', label: 'ikusi.opt.side', help: 'ikusi.opt.side.help', default: 'left', group: 'board',
      choices: [{ value: 'left', label: 'ikusi.side.left' }, { value: 'right', label: 'ikusi.side.right' }],
    },
    { key: 'uneven', urlKey: 'tono', type: 'range', label: 'ikusi.opt.uneven', help: 'ikusi.opt.uneven.help', default: 45, min: 0, max: 100, step: 5, unit: '%', group: 'defects' },
    { key: 'delamination', urlKey: 'despegado', type: 'range', label: 'ikusi.opt.delamination', help: 'ikusi.opt.delamination.help', default: 0, min: 0, max: 50, step: 1, unit: '%', group: 'defects' },
    { key: 'wearSeed', urlKey: 'semilla', type: 'number', label: 'ikusi.opt.wearSeed', default: 1, min: 0, max: 0xffffffff, group: 'defects', hidden: true, shuffle: true },
  ],
};

export const frameSchema: ParamSchema = {
  fields: [
    { key: 'time', urlKey: 'hora', type: 'text', label: 'ikusi.frame.time', default: '18:47', maxLength: TIME },
    { key: 'text', urlKey: 'texto', type: 'text', label: 'ikusi.frame.text', default: 'ALCALA', maxLength: LINE },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'anden.frame.platform', default: '3', maxLength: 2 },
  ],
};

/** One platform, the next train on it. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'scheduled',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 1, mode: 'top', dwellMs: 0 },
};

export const ikusiAndenAtocha: ReplicaDef = {
  id: 'ikusi-anden-atocha',
  viewBox: { width: WIDTH, height: HEIGHT },
  accepts: 'board',
  needs: { services: 1, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
