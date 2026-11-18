import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import type { ReplicaDef } from '../types';
import { SIZE } from './geometry';

/**
 * The analogue clock of Renfe's Cercanías stations: a plain white dial and
 * red hands behind a glass that carries the marks, a white ring of sixty
 * bars split by transparent slots and a dark grey ring with the numerals.
 * One face of it; whether it hangs on a wall or shows two faces is the
 * entry's business.
 *
 * It needs no trains, only the time: it shows station time, so it agrees
 * with any board on the same page and can be set by hand in the manual
 * source.
 */
export interface RelojCercaniasFrame {
  /** Station time, ms since the epoch. */
  time?: number;
  /** The station's time zone. */
  zone?: string;
  [key: string]: unknown;
}

export interface RelojCercaniasOptions {
  motion: 'step' | 'sweep';
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  fields: [
    {
      key: 'motion', urlKey: 'marcha', type: 'select', label: 'reloj.cercanias.opt.motion', default: 'step',
      choices: [
        { value: 'step', label: 'reloj.cercanias.motion.step' },
        { value: 'sweep', label: 'reloj.cercanias.motion.sweep' },
      ],
    },
  ],
};

/** A clock reads no trains; the policy only has to exist. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 0,
  includeCancelled: false,
  window: { size: 1, mode: 'top', dwellMs: 0 },
};

export const relojCercanias: ReplicaDef = {
  id: 'reloj-cercanias',
  viewBox: { width: SIZE, height: SIZE },
  accepts: 'board',
  needs: { services: 0, calls: false },
  options: optionsSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
