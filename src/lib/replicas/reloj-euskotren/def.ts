import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import type { HandMotion } from '../clock-hands';
import type { ReplicaDef } from '../types';
import { SIZE } from './geometry';

/**
 * The round clock of Euskotren's stations: a white dial with blue figures,
 * sixty minute marks and two blue hands, in a dark ring, hung from a bracket
 * over the platform. One face of it.
 *
 * It needs no trains, only the time: it shows station time, so it agrees
 * with any board on the same page and can be set by hand in the manual
 * source.
 */
export interface RelojEuskotrenFrame {
  /** Station time, ms since the epoch. */
  time?: number;
  /** The station's time zone. */
  zone?: string;
  [key: string]: unknown;
}

export interface RelojEuskotrenOptions {
  /** This clock has no second hand, so the choice is only how the minute hand moves. */
  motion: Extract<HandMotion, 'ppm' | 'sweep'>;
  /** Whether EuskoTren's wordmark is printed on the dial. */
  logo: boolean;
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  fields: [
    {
      key: 'motion', urlKey: 'marcha', type: 'select', label: 'euskotren.reloj.opt.motion', help: 'euskotren.reloj.opt.motion.help', default: 'ppm',
      choices: [
        { value: 'ppm', label: 'euskotren.reloj.motion.ppm' },
        { value: 'sweep', label: 'euskotren.reloj.motion.sweep' },
      ],
    },
    { key: 'logo', urlKey: 'rotulo', type: 'boolean', label: 'euskotren.reloj.opt.logo', help: 'euskotren.reloj.opt.logo.help', default: true },
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

export const relojEuskotren: ReplicaDef = {
  id: 'reloj-euskotren',
  viewBox: { width: SIZE, height: SIZE },
  // Only the time: a train feed has nothing it can show.
  reads: ['time'],
  needs: { services: 0, calls: false },
  options: optionsSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
