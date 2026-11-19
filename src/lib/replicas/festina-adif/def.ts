import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import { motionField, type HandMotion } from '../clock-hands';
import type { ReplicaDef } from '../types';
import { SIZE } from './geometry';

/**
 * The analogue clock Festina made for ADIF's stations: a white dial with
 * 12, 3, 6 and 9, a bar for every minute, Festina's mark under the 12, and
 * hands whose tips are drawn in outline. The same dial comes in several sizes
 * and cases: round with a polished ring, round with a dark one, and a large
 * square one.
 *
 * It needs no trains, only the time: it shows station time, so it agrees with
 * any board on the same page and can be set by hand in the manual source.
 */
export interface FestinaFrame {
  /** Station time, ms since the epoch. */
  time?: number;
  /** The station's time zone. */
  zone?: string;
  [key: string]: unknown;
}

export interface FestinaOptions {
  case: 'chrome' | 'dark' | 'square';
  inlays: boolean;
  secondHand: 'blue' | 'dark' | 'none';
  motion: HandMotion;
  /**
   * Whose mark the dial carries. Festina's clocks have the four numerals and
   * Festina's mark; the same clock built into MP Electronics' platform
   * displays can carry MP Electronics' mark instead, and no numerals.
   */
  dial?: 'festina' | 'mp';
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  fields: [
    {
      key: 'case', urlKey: 'caja', type: 'select', label: 'festina.opt.case', default: 'chrome',
      choices: [
        { value: 'chrome', label: 'festina.case.chrome' },
        { value: 'dark', label: 'festina.case.dark' },
        { value: 'square', label: 'festina.case.square' },
      ],
    },
    { key: 'inlays', urlKey: 'azul', type: 'boolean', label: 'festina.opt.inlays', help: 'festina.opt.inlays.help', default: false },
    {
      key: 'secondHand', urlKey: 'segundero', type: 'select', label: 'festina.opt.secondHand', default: 'dark',
      choices: [
        { value: 'dark', label: 'festina.second.dark' },
        { value: 'blue', label: 'festina.second.blue' },
        { value: 'none', label: 'festina.second.none' },
      ],
    },
    motionField(),
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

export const festinaAdif: ReplicaDef = {
  id: 'festina-adif',
  viewBox: { width: SIZE, height: SIZE },
  // Only the time: a train feed has nothing it can show.
  reads: ['time'],
  needs: { services: 0, calls: false },
  options: optionsSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
