import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import { familyOptionsSchema, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { ReplicaDef } from '../types';
import { WIDTH, HEIGHT } from './geometry';

/**
 * The later version of PAGE Ibérica's platform sign: the same enclosure, but
 * the flip-dot line is one continuous matrix lit by LEDs, written in a bold
 * proportional typeface, and it shows the departure time where the earlier
 * one showed minutes.
 */
export interface ContinuoFrame {
  /** The line, laid out by the typeface from the left. */
  text: string;
  /** Written right-aligned at the end of the line, as "10:12". */
  time: string;
  /** The vinyl number after "Vía". */
  platform: string;
  /** The LED row. */
  led: string;
  [key: string]: unknown;
}

export interface ContinuoOptions extends FamilyOptions {
  pixelLeds: boolean;
}

// Same URL keys as the earlier sign where the meaning is the same; the time is new.
export const frameSchema: ParamSchema = {
  fields: [
    { key: 'text', type: 'text', label: 'continuo.frame.text', default: 'CHAMARTIN', maxLength: 40 },
    { key: 'time', urlKey: 'hora', type: 'text', label: 'continuo.frame.time', default: '10:12', maxLength: 5 },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'anden.frame.platform', default: '2', maxLength: 3 },
    { key: 'led', type: 'text', label: 'anden.frame.led', default: '', glyphs: 'telenorma-cp437' },
  ],
};

/**
 * The family's settings, plus the LEDs of the dots, less the hearts: those
 * came from the earlier controller's end-of-message byte, and nothing says
 * this one shares it. "Show minutes" becomes "show the time".
 */
export const optionsSchema: ParamSchema = {
  ...familyOptionsSchema,
  fields: [
    ...familyOptionsSchema.fields
      .filter((field) => field.key !== 'hearts')
      .map((field) => (field.key === 'showMinutes' ? { ...field, label: 'continuo.opt.showTime' } : field)),
    { key: 'pixelLeds', urlKey: 'leds', type: 'boolean', label: 'continuo.opt.pixelLeds', help: 'continuo.opt.pixelLeds.help', default: true, group: 'look' },
  ],
};

const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 1, mode: 'rotate', dwellMs: 6000, depth: 12 },
};

export const andenContinuo: ReplicaDef = {
  id: 'page-iberica-anden-continuo',
  viewBox: { width: WIDTH, height: HEIGHT },
  reads: ['services', 'time'],
  needs: { services: 1, calls: true },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
