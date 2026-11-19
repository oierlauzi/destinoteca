import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema, Values } from '../../params';
import { familyOptionsSchema, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { ReplicaDef } from '../types';
import { FACES, HEIGHT, LINES, WIDTH } from './geometry';

/**
 * PAGE Ibérica's board on the gangway of Atocha Cercanías: the next ten
 * trains of the whole station, five on each face, each line with its
 * platform, destination and minutes, and one red LED row under both faces.
 */
export interface PasarelaLine {
  /** The platform, at the start of the line. */
  platform: string;
  /** The destination, laid out by the typeface. */
  text: string;
  /** Minutes to departure, written "2min" at the end of the line. */
  minutes: string;
}

export interface PasarelaFrame {
  /** Left face first, top to bottom. */
  lines: PasarelaLine[];
  /** The LED row. */
  led: string;
}

export interface PasarelaOptions extends FamilyOptions {
  pixelLeds: boolean;
}

export const LINE_COUNT = FACES * LINES;

/** The family's settings less the hearts, plus the LEDs of the dots. */
export const optionsSchema: ParamSchema = {
  ...familyOptionsSchema,
  fields: [
    ...familyOptionsSchema.fields.filter((field) => field.key !== 'hearts'),
    { key: 'pixelLeds', urlKey: 'leds', type: 'boolean', label: 'continuo.opt.pixelLeds', help: 'continuo.opt.pixelLeds.help', default: true, group: 'look' },
  ],
};

/** The examples of the hand-typed form: lines as photographed. */
const EXAMPLE: PasarelaLine[] = [
  { platform: '2', text: 'CERCEDILLA', minutes: '1' },
  { platform: '10', text: 'MOSTOLES', minutes: '' },
  { platform: '9', text: 'SIN SERVICIO', minutes: '1' },
  { platform: '4', text: 'P.PIO-VILLAL', minutes: '2' },
  { platform: '1', text: 'CHAMARTIN', minutes: '2' },
  { platform: '9', text: 'SIN SERVICIO', minutes: '7' },
  { platform: '9', text: 'SIN SERVICIO', minutes: '7' },
  { platform: '9', text: 'SIN SERVICIO', minutes: '8' },
  { platform: '', text: '', minutes: '' },
  { platform: '9', text: 'SIN SERVICIO', minutes: '7' },
];

export const frameSchema: ParamSchema = {
  fields: [
    ...EXAMPLE.flatMap((line, i): Field[] => [
      { key: `v${i + 1}`, type: 'text', label: 'anden.frame.platform', default: line.platform, maxLength: 2, group: `line${i + 1}` },
      { key: `d${i + 1}`, type: 'text', label: 'pasarela.frame.destination', default: line.text, maxLength: 24, group: `line${i + 1}` },
      { key: `m${i + 1}`, type: 'text', label: 'anden.frame.minutes', default: line.minutes, maxLength: 2, group: `line${i + 1}` },
    ]),
    { key: 'led', type: 'text', label: 'anden.frame.led', default: '', glyphs: 'telenorma-cp437' },
  ],
  groups: EXAMPLE.map((_, i) => ({ id: `line${i + 1}`, label: `pasarela.frame.line${i + 1}`, layout: 'row' as const })),
};

/** Frames cross the replica's boundary flat (v1, d1, m1...); inside, they are lines. */
export function fromFlat(flat: Values): PasarelaFrame {
  return {
    lines: Array.from({ length: LINE_COUNT }, (_, i) => ({
      platform: String(flat[`v${i + 1}`] ?? ''),
      text: String(flat[`d${i + 1}`] ?? ''),
      minutes: String(flat[`m${i + 1}`] ?? ''),
    })),
    led: String(flat.led ?? ''),
  };
}

export function toFlat(frame: PasarelaFrame): Values {
  const flat: Values = { led: frame.led };
  frame.lines.forEach((line, i) => {
    flat[`v${i + 1}`] = line.platform;
    flat[`d${i + 1}`] = line.text;
    flat[`m${i + 1}`] = line.minutes;
  });
  return flat;
}

/** The whole station, soonest first: the left face, then the right one. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: LINE_COUNT, mode: 'top', dwellMs: 0 },
};

export const pasarelaAtocha: ReplicaDef = {
  id: 'page-iberica-pasarela-atocha',
  viewBox: { width: WIDTH, height: HEIGHT },
  reads: ['services', 'time'],
  needs: { services: LINE_COUNT, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
