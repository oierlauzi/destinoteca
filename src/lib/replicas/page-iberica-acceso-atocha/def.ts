import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import { optionsSchema as continuoOptions, type ContinuoOptions } from '../page-iberica-anden-continuo/def';
import type { ReplicaDef } from '../types';
import { HEIGHT, WIDTH } from './geometry';

/**
 * PAGE Ibérica's display at the head of each platform of Atocha Cercanías:
 * the next train on one flip-dot line lit by LEDs (destination and time) and
 * a red LED row under it.
 */
export interface AccesoFrame {
  /** The line, laid out by the typeface from the left. */
  text: string;
  /** Written right-aligned at the end of the line, as "04:35". */
  time: string;
  /** The number after "Vía". */
  platform: string;
  /** The LED row. */
  led: string;
  [key: string]: unknown;
}

export type AccesoOptions = ContinuoOptions;

// The URL keys of the other platform signs, where the meaning is the same.
export const frameSchema: ParamSchema = {
  fields: [
    { key: 'text', type: 'text', label: 'continuo.frame.text', default: 'SIN SERVICIO', maxLength: 40 },
    { key: 'time', urlKey: 'hora', type: 'text', label: 'continuo.frame.time', default: '04:35', maxLength: 5 },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'anden.frame.platform', default: '7', maxLength: 3 },
    { key: 'led', type: 'text', label: 'anden.frame.led', default: 'PROXIMA SALIDA', glyphs: 'telenorma-cp437' },
  ],
};

/** Those of the Alcalá de Henares sign: the same kind of line, the time instead of minutes. */
export const optionsSchema: ParamSchema = continuoOptions;

const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 1, mode: 'rotate', dwellMs: 6000, depth: 12 },
};

export const accesoAtocha: ReplicaDef = {
  id: 'page-iberica-acceso-atocha',
  viewBox: { width: WIDTH, height: HEIGHT },
  accepts: 'board',
  needs: { services: 1, calls: true },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
