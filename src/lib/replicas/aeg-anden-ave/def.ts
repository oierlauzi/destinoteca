import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import type { ReplicaDef } from '../types';
import { HEIGHT, WIDTH } from './geometry';

/**
 * AEG's liquid-crystal platform display of the AVE: one graphics matrix on
 * five by three glass modules, the departure time and the destination in a
 * large face on the top line, the kind of train and where it calls in a
 * small one below, and beside it, bolted to its frame, the clock that hung
 * with it in a box of its own.
 */
export interface AegFrame {
  /** The departure time, in the first module of the top line. */
  time: string;
  /** The top line after the time: «DESTINO» and where the train goes. */
  text: string;
  /** The kind of train, in the first module of the second line. */
  product: string;
  /** The second line after that: where the train calls. */
  calls: string;
  /** The third line. No photograph shows it written. */
  extra: string;
  /** What the clock beside it reads, «HH:MM». */
  clock: string;
  [key: string]: unknown;
}

export interface AegOptions {
  /** Which side of the display the clock's box is on. */
  clockSide: 'left' | 'right';
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  groups: [{ id: 'look', label: 'aeg.group.look' }],
  fields: [
    {
      key: 'clockSide', urlKey: 'reloj', type: 'select', label: 'aeg.opt.clockSide', help: 'aeg.opt.clockSide.help', default: 'right', group: 'look',
      choices: [{ value: 'right', label: 'aeg.side.right' }, { value: 'left', label: 'aeg.side.left' }],
    },
  ],
};

export const frameSchema: ParamSchema = {
  fields: [
    { key: 'time', urlKey: 'hora', type: 'text', label: 'aeg.frame.time', default: '11:00', maxLength: 8 },
    { key: 'text', urlKey: 'texto', type: 'text', label: 'aeg.frame.text', default: 'DESTINO Sevilla SJ', maxLength: 40 },
    { key: 'product', urlKey: 'tren', type: 'text', label: 'aeg.frame.product', default: 'AVE', maxLength: 16 },
    { key: 'calls', urlKey: 'paradas', type: 'text', label: 'aeg.frame.calls', default: 'CORDOBA', maxLength: 40 },
    { key: 'extra', urlKey: 'abajo', type: 'text', label: 'aeg.frame.extra', help: 'aeg.frame.extra.help', default: '', maxLength: 40 },
    { key: 'clock', urlKey: 'hora2', type: 'text', label: 'aeg.frame.clock', default: '10:58', maxLength: 5 },
  ],
};

/** One platform, the next train to leave it. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'scheduled',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 1, mode: 'top', dwellMs: 0 },
};

export const aegAndenAve: ReplicaDef = {
  id: 'aeg-anden-ave',
  viewBox: { width: WIDTH, height: HEIGHT },
  reads: ['services', 'time'],
  needs: { services: 1, calls: true },
  options: optionsSchema,
  frame: frameSchema,
  sourceDefaults: { demo: { network: 'long-distance' }, adif: { traffic: 'RL' } },
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
