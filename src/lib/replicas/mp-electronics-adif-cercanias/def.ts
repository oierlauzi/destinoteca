import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema, Values } from '../../params';
import { AMBER } from '../mp-electronics-adif/def';
import type { ReplicaDef } from '../types';
import { ROWS, SIZE } from './geometry';

/**
 * MP Electronics' smaller boards for ADIF's Cercanías platforms and
 * concourses, as at Madrid Chamartín: the header of the long-distance
 * boards, and twelve rows of discrete amber LEDs, seven dots high, each with
 * a platform, a destination and the time or the minutes to go.
 */
export interface CercaniasRow {
  platform: string;
  destination: string;
  time: string;
}

export interface CercaniasFrame {
  rows: CercaniasRow[];
  [key: string]: unknown;
}

export interface CercaniasOptions {
  color: string;
  deadOn: number;
  deadOff: number;
  deadRows: number;
  deadSeed: number;
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  groups: [
    { id: 'look', label: 'adif.group.look' },
    { id: 'defects', label: 'adif.group.defects' },
  ],
  fields: [
    { key: 'color', type: 'color', label: 'adif.opt.color', default: AMBER, group: 'look', choices: [{ value: AMBER, label: 'adif.color.amber' }] },
    { type: 'switch', key: 'deadPixels', label: 'adif.opt.deadPixels', controls: ['deadOn', 'deadOff', 'deadRows'], on: { deadOn: 0, deadOff: 1, deadRows: 3 }, group: 'defects' },
    { key: 'deadOn', urlKey: 'deadon', type: 'range', label: 'adif.opt.deadOn', default: 0, min: 0, max: 10, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadOff', urlKey: 'deadoff', type: 'range', label: 'adif.opt.deadOff', default: 0, min: 0, max: 20, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadRows', urlKey: 'deadrows', type: 'range', label: 'adif.opt.deadRows', default: 0, min: 0, max: 20, step: 1, unit: '%', group: 'defects' },
    { key: 'deadSeed', urlKey: 'deadseed', type: 'number', label: 'adif.opt.deadSeed', default: 1, min: 0, max: 0xffffffff, group: 'defects', hidden: true, shuffle: true },
  ],
};

/** The example in the free-text form: a board photographed at Chamartín. */
const EXAMPLE: CercaniasRow[] = [
  { platform: '3', destination: 'ATOCHA-ARANJUEZ', time: '14:05' },
  { platform: '8', destination: 'ATOCHA-ALCALA', time: '' },
  { platform: '1', destination: 'ATOCHA-PARLA', time: '' },
  { platform: '11', destination: 'R.CAJAL-PITIS', time: '3 min' },
  { platform: '10', destination: 'ATOCHA-VILLALBA', time: '14:04' },
  { platform: '5', destination: 'ATOCHA-ARANJUEZ', time: '14:27' },
  { platform: '', destination: 'ATOCHA-GUADALAJAR', time: '6 min' },
  { platform: '', destination: 'ALCO/S.S.REYES', time: '7 min' },
  { platform: '', destination: 'ATOCHA-PARLA', time: '11 m.' },
  { platform: '', destination: 'COLMENAR VIEJO', time: '12 m.' },
  { platform: '', destination: 'SEGOVIA', time: '19 m.' },
  { platform: '', destination: 'ATOCHA-PARLA', time: '21 m.' },
];

const KEYS: Record<keyof CercaniasRow, string> = { platform: 'v', destination: 'd', time: 't' };
const MAX: Record<keyof CercaniasRow, number> = { platform: 2, destination: 17, time: 5 };

export const frameSchema: ParamSchema = {
  fields: EXAMPLE.flatMap((row, i): Field[] =>
    (Object.keys(KEYS) as (keyof CercaniasRow)[]).map((key) => ({
      key: `${KEYS[key]}${i + 1}`,
      type: 'text',
      label: `cercanias.frame.${key}`,
      default: row[key],
      maxLength: MAX[key],
      group: `row${i + 1}`,
    })),
  ),
  groups: EXAMPLE.map((_, i) => ({ id: `row${i + 1}`, label: `cercanias.frame.row${i + 1}`, layout: 'row' as const })),
};

/** Frames cross the replica's boundary flat (v1, d1, t1, v2...); inside, they are rows. */
export function fromFlat(flat: Values): CercaniasFrame {
  return {
    rows: Array.from({ length: ROWS }, (_, i) => ({
      platform: String(flat[`v${i + 1}`] ?? ''),
      destination: String(flat[`d${i + 1}`] ?? ''),
      time: String(flat[`t${i + 1}`] ?? ''),
    })),
  };
}

export function toFlat(frame: CercaniasFrame): Values {
  const flat: Values = {};
  frame.rows.forEach((row, i) => {
    flat[`v${i + 1}`] = row.platform;
    flat[`d${i + 1}`] = row.destination;
    flat[`t${i + 1}`] = row.time;
  });
  return flat;
}

const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: ROWS, mode: 'top', dwellMs: 0 },
};

export const mpCercanias: ReplicaDef = {
  id: 'mp-electronics-adif-cercanias',
  viewBox: SIZE,
  // A Cercanías sign: ADIF's feed starts on Cercanías trains.
  sourceDefaults: { adif: { traffic: 'C' } },
  reads: ['services', 'time'],
  needs: { services: ROWS, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
