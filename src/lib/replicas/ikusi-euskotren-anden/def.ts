import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import { wearFields, type WearOptions } from '../ikusi-euskotren/parts';
import type { ReplicaDef } from '../types';
import { HEIGHT, TEXT, TIME, WIDTH } from './geometry';

/**
 * The platform signs Ikusi made for Euskotren: the platform's number on a
 * printed plate, and one row of 21 liquid-crystal characters with the time
 * of the next train and where it goes, under the printed legends «Ordua /
 * Hora» and «Norako / Destino».
 */
export interface EuskotrenFrame {
  /** Departure time, five characters with the colon. */
  time: string;
  /** The destination, or a notice, from the seventh character. */
  text: string;
  /** The number printed on the plate. */
  platform: string;
  [key: string]: unknown;
}

export interface EuskotrenOptions extends WearOptions {
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  groups: [{ id: 'defects', label: 'ikusi.group.wear' }],
  fields: wearFields('defects'),
};

export const frameSchema: ParamSchema = {
  fields: [
    { key: 'time', urlKey: 'hora', type: 'text', label: 'ikusi.frame.time', default: '10:16', maxLength: TIME },
    { key: 'text', urlKey: 'texto', type: 'text', label: 'ikusi.frame.text', default: 'GERNIKA', maxLength: TEXT },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'euskotren.frame.platform', default: '2', maxLength: 2 },
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

export const ikusiEuskotrenAnden: ReplicaDef = {
  id: 'ikusi-euskotren-anden',
  viewBox: { width: WIDTH, height: HEIGHT },
  // A sign of Euskotren announces its own trains, by their Basque names:
  // simulated, Euskotren's network; live, Euskotren's own feed.
  sourceDefaults: { demo: { network: 'euskotren' }, mitren: { feed: 'euskotren' } },
  accepts: 'board',
  needs: { services: 1, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
