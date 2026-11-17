import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import { CELLS } from '../page-iberica-anden-electromagnetico/def';
import { familyOptionsSchema, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { ReplicaDef } from '../types';
import { HEIGHT, WIDTH } from './geometry';

/**
 * PAGE Ibérica's platform sign with only its flip-dot line: the destination
 * and the minutes, beside the fixed "min.", and no LED row, no "Vía" and no
 * other legend. Seen at Vallecas.
 */
export interface SinLedFrame {
  /** The flip-dot line, up to 16 characters. */
  text: string;
  /** Written right-aligned over the end of the same line, beside "min.". */
  minutes: string;
  [key: string]: unknown;
}

export type SinLedOptions = FamilyOptions;

// The URL keys of the sign with the LED row, for what the two share.
export const frameSchema: ParamSchema = {
  fields: [
    { key: 'text', type: 'text', label: 'anden.frame.text', default: 'CHAMARTIN', maxLength: CELLS, glyphs: 'telenorma-cp437' },
    { key: 'minutes', urlKey: 'min', type: 'text', label: 'anden.frame.minutes', default: '8', maxLength: 4 },
  ],
};

/** The settings of the LED row, which this sign does not have. */
const LED_SETTINGS = new Set(['ledColor', 'ledScroll', 'ledSpeed', 'ledIdle']);

/** The family's settings, less those of the LED row. */
export const optionsSchema: ParamSchema = {
  ...familyOptionsSchema,
  fields: familyOptionsSchema.fields.filter((field) => !LED_SETTINGS.has(field.key)),
};

/** One platform, one train at a time, stepping through the next few: as the sign with the LED row. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 1, mode: 'rotate', dwellMs: 6000, depth: 12 },
};

export const andenSinLed: ReplicaDef = {
  id: 'page-iberica-anden-sin-led',
  viewBox: { width: WIDTH, height: HEIGHT },
  accepts: 'board',
  // Without the LED row, the calls after this station have nowhere to go.
  needs: { services: 1, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
