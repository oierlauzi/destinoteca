import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import { familyOptionsSchema, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { ReplicaDef } from '../types';

/** Characters in the flip-dot line. */
export const CELLS = 16;


/** What the sign shows, as its controller sent it: one line of text and what goes on the LED row. */
export interface AndenFrame {
  /** The flip-dot line, up to 16 characters. */
  text: string;
  /** Written right-aligned over the end of the same line, beside the fixed "min." legend. */
  minutes: string;
  /** The vinyl number after "Vía". Not every sign had one. */
  platform: string;
  /** The LED row. Scrolls when it does not fit. */
  led: string;
  [key: string]: unknown;
}

export type AndenOptions = FamilyOptions;

// URL keys are those of the original replica in renfe-flipdot-re, so that an
// embed made for it keeps working here with its query string untouched.
export const frameSchema: ParamSchema = {
  fields: [
    { key: 'text', type: 'text', label: 'anden.frame.text', default: 'SIN PARADA', maxLength: CELLS, glyphs: 'telenorma-cp437' },
    { key: 'minutes', urlKey: 'min', type: 'text', label: 'anden.frame.minutes', default: '1', maxLength: 4 },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'anden.frame.platform', default: '1', maxLength: 3 },
    { key: 'led', type: 'text', label: 'anden.frame.led', default: 'PROHIBIDO CRUZAR LAS VIAS', glyphs: 'telenorma-cp437' },
  ],
};

/** The family's settings, plus the printed legend over the minutes, which was not the same everywhere. */
export const optionsSchema: ParamSchema = {
  ...familyOptionsSchema,
  fields: [
    ...familyOptionsSchema.fields,
    {
      key: 'nextLegend', urlKey: 'rotulo', type: 'select', label: 'anden.opt.nextLegend', help: 'anden.opt.nextLegend.help', default: 'llegada', group: 'look',
      choices: [{ value: 'llegada', label: 'anden.nextLegend.llegada' }, { value: 'tren', label: 'anden.nextLegend.tren' }],
    },
  ],
};

/** One platform, one train at a time, stepping through the next few. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 1, mode: 'rotate', dwellMs: 6000, depth: 12 },
};

export const andenElectromagnetico: ReplicaDef = {
  id: 'page-iberica-anden-electromagnetico',
  viewBox: { width: 190.87605, height: 81.160835 },
  accepts: 'board',
  needs: { services: 1, calls: true },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
