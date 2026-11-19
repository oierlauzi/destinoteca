import type { ParamSchema } from '../../params';
import type { SourceDef } from '../types';
import * as module from './index';

/**
 * The time, and nothing else: the clock of the machine the page is open on.
 *
 * It is what a display that announces no trains needs (a station clock), and
 * what a board shows when there is nothing to announce. The settings are the
 * two ways a clock on a wall differs from the viewer's own: which time of day
 * it keeps, and how far off it has drifted.
 */
export const deviceConfig: ParamSchema = {
  fields: [
    {
      key: 'zone', urlKey: 'zona', type: 'select', label: 'device.zone', help: 'device.zone.help', default: 'local', about: ['time'],
      choices: [
        { value: 'local', label: 'device.zone.local' },
        { value: 'Europe/Madrid', label: 'device.zone.madrid' },
      ],
    },
    { key: 'drift', urlKey: 'desvio', type: 'range', label: 'device.drift', help: 'device.drift.help', default: 0, min: -5, max: 5, step: 0.5, unit: 'min', about: ['time'] },
  ],
};

export const deviceDef: SourceDef = {
  id: 'device',
  label: 'device.label',
  description: 'device.description',
  kind: 'device',
  provides: ['time'],
  config: deviceConfig,
  // A few lines: shipped with the page rather than fetched on first use.
  load: async () => module,
};
