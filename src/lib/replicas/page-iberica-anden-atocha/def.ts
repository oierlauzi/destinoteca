import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema } from '../../params';
import { familyOptionsSchema, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { ReplicaDef } from '../types';
import { HEIGHT, WIDTH } from './geometry';

/**
 * PAGE Ibérica's platform display at Atocha Cercanías: the next train on one
 * flip-dot line lit by LEDs (destination and minutes) over a two-line LED
 * panel, whose LEDs are bicolour (red and green, amber with both lit).
 */
export interface AndenAtochaFrame {
  /** The line, laid out by the typeface from the left. */
  text: string;
  /** Minutes to departure, written "7 min" at the end of the line. */
  minutes: string;
  /** The number after "Vía". */
  platform: string;
  /** First line of the LED panel, as "PARA EN:". */
  label: string;
  /** Second line of the LED panel: the stops, running when they do not fit. */
  led: string;
  [key: string]: unknown;
}

export interface AndenAtochaOptions extends FamilyOptions {
  pixelLeds: boolean;
}

export const AMBER = '#ffad2a';
export const LED_RED = '#ff3b2e';
export const LED_GREEN = '#9ee34a';

// The URL keys of the other platform signs where the meaning is the same.
export const frameSchema: ParamSchema = {
  fields: [
    { key: 'text', type: 'text', label: 'continuo.frame.text', default: 'P.PIO-VILLAL', maxLength: 40 },
    { key: 'minutes', urlKey: 'min', type: 'text', label: 'anden.frame.minutes', default: '7', maxLength: 3 },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'anden.frame.platform', default: '4', maxLength: 3 },
    { key: 'label', urlKey: 'led1', type: 'text', label: 'atocha.frame.label', default: 'PARA EN:', maxLength: 15 },
    { key: 'led', type: 'text', label: 'atocha.frame.led', default: 'PIRAMIDES, PRINCIPE PIO, LAGUNA, ...' },
  ],
};

/**
 * The family's settings less the hearts, plus the LEDs of the dots; the LED
 * colours are those of a bicolour panel.
 */
export const optionsSchema: ParamSchema = {
  ...familyOptionsSchema,
  fields: [
    ...familyOptionsSchema.fields
      .filter((field) => field.key !== 'hearts')
      .map((field): Field =>
        field.type === 'color' && field.key === 'ledColor'
          ? {
              ...field,
              default: AMBER,
              choices: [
                { value: AMBER, label: 'pageib.color.amber' },
                { value: LED_RED, label: 'pageib.color.red' },
                { value: LED_GREEN, label: 'pageib.color.green' },
              ],
            }
          : field,
      ),
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

export const andenAtocha: ReplicaDef = {
  id: 'page-iberica-anden-atocha',
  viewBox: { width: WIDTH, height: HEIGHT },
  // A Cercanías sign: ADIF's feed starts on Cercanías trains.
  sourceDefaults: { adif: { traffic: 'C' } },
  reads: ['services', 'time'],
  needs: { services: 1, calls: true },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
