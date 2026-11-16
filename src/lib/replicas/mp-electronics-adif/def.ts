import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema, Values } from '../../params';
import type { ReplicaDef } from '../types';
import { ROWS, stackSize } from './geometry';
import type { Mode, Regional } from './labels';

/**
 * The LED departure and arrival board that MP Electronics made for ADIF's
 * long-distance stations: a printed header, seven rows of five LED panels
 * (time, destination or origin, train, platform, remarks) and a wide row
 * underneath. The LEDs are red and green, so text can be either or both
 * (amber). Large stations hang several side by side or one above another.
 */
export interface AdifRow {
  time: string;
  /** Destination when departing, origin when arriving. */
  place: string;
  /** The product, then the number(s): "IRYO 06110", "A 03073/34073". */
  train: string;
  platform: string;
  remarks: string;
}

export interface AdifFrame {
  /** Seven per board, board after board. */
  rows: AdifRow[];
  /** The wide row. */
  wide: string;
  [key: string]: unknown;
}

export interface AdifOptions {
  mode: Mode;
  regional: Regional;
  header: 'green' | 'tab';
  logo: boolean;
  remarksEn: string;
  color: string;
  wideColor: string;
  wideScroll: boolean;
  wideSpeed: number;
  wideIdle: string;
  across: number;
  down: number;
  deadOn: number;
  deadOff: number;
  deadRows: number;
  deadSeed: number;
  [key: string]: unknown;
}

export const AMBER = '#ffa62b';
export const GREEN = '#5df08f';
export const RED = '#ff3b30';

const colorChoices = [
  { value: AMBER, label: 'adif.color.amber' },
  { value: GREEN, label: 'adif.color.green' },
  { value: RED, label: 'adif.color.red' },
];

export const optionsSchema: ParamSchema = {
  groups: [
    { id: 'board', label: 'adif.group.board' },
    { id: 'look', label: 'adif.group.look' },
    { id: 'defects', label: 'adif.group.defects' },
  ],
  fields: [
    {
      key: 'mode', urlKey: 'modo', type: 'select', label: 'adif.opt.mode', default: 'departures', group: 'board',
      choices: [{ value: 'departures', label: 'adif.mode.departures' }, { value: 'arrivals', label: 'adif.mode.arrivals' }],
    },
    {
      key: 'regional', urlKey: 'lengua', type: 'select', label: 'adif.opt.regional', help: 'adif.opt.regional.help', default: '', group: 'board',
      choices: [
        { value: '', label: 'adif.regional.none' },
        { value: 'ca', label: 'adif.regional.ca' },
        { value: 'va', label: 'adif.regional.va' },
        { value: 'eu', label: 'adif.regional.eu' },
        { value: 'gl', label: 'adif.regional.gl' },
      ],
    },
    { key: 'across', urlKey: 'ancho', type: 'range', label: 'adif.opt.across', default: 1, min: 1, max: 4, step: 1, group: 'board' },
    { key: 'down', urlKey: 'alto', type: 'range', label: 'adif.opt.down', help: 'adif.opt.stack.help', default: 1, min: 1, max: 3, step: 1, group: 'board' },
    {
      key: 'header', urlKey: 'cabecera', type: 'select', label: 'adif.opt.header', default: 'green', group: 'look',
      choices: [{ value: 'green', label: 'adif.header.green' }, { value: 'tab', label: 'adif.header.tab' }],
    },
    { key: 'logo', type: 'boolean', label: 'adif.opt.logo', help: 'adif.opt.logo.help', default: true, group: 'look' },
    {
      key: 'remarksEn', urlKey: 'obs', type: 'select', label: 'adif.opt.remarksEn', default: 'REMARKS', group: 'look', literal: true,
      choices: [{ value: 'REMARKS', label: 'REMARKS' }, { value: 'OBSERVATIONS', label: 'OBSERVATIONS' }],
    },
    { key: 'color', type: 'color', label: 'adif.opt.color', help: 'adif.opt.color.help', default: AMBER, group: 'look', choices: colorChoices },
    { key: 'wideColor', urlKey: 'colorfila', type: 'color', label: 'adif.opt.wideColor', default: RED, group: 'look', choices: colorChoices },
    { key: 'wideScroll', urlKey: 'scroll', type: 'boolean', label: 'adif.opt.wideScroll', default: true, group: 'look' },
    { key: 'wideSpeed', urlKey: 'speed', type: 'range', label: 'adif.opt.wideSpeed', default: 24, min: 4, max: 60, step: 1, unit: 'col/s', group: 'look' },
    { key: 'wideIdle', urlKey: 'idle', type: 'text', label: 'adif.opt.wideIdle', help: 'adif.opt.wideIdle.help', default: '', group: 'look' },
    { type: 'switch', key: 'deadPixels', label: 'adif.opt.deadPixels', controls: ['deadOn', 'deadOff', 'deadRows'], on: { deadOn: 0, deadOff: 1, deadRows: 3 }, group: 'defects' },
    { key: 'deadOn', urlKey: 'deadon', type: 'range', label: 'adif.opt.deadOn', default: 0, min: 0, max: 10, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadOff', urlKey: 'deadoff', type: 'range', label: 'adif.opt.deadOff', default: 0, min: 0, max: 20, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadRows', urlKey: 'deadrows', type: 'range', label: 'adif.opt.deadRows', help: 'adif.opt.deadRows.help', default: 0, min: 0, max: 20, step: 1, unit: '%', group: 'defects' },
    { key: 'deadSeed', urlKey: 'deadseed', type: 'number', label: 'adif.opt.deadSeed', default: 1, min: 0, max: 0xffffffff, group: 'defects', hidden: true, shuffle: true },
  ],
};

/** The example in the free-text form: a board photographed with Spanish and English legends. */
const EXAMPLE: AdifRow[] = [
  { time: '10:35', place: 'MADRID PTA. ATOCHA', train: 'AVLO 02109', platform: '-', remarks: '' },
  { time: '11:34', place: 'BARCELONA SANTS', train: 'IRYO 06021', platform: '-', remarks: '' },
  { time: '11:56', place: 'MADRID PTA. ATOCHA', train: 'AVE 02123', platform: '-', remarks: '' },
  { time: '13:26', place: 'SEVILLA STA. JUSTA', train: 'MD 13905', platform: '7', remarks: 'PROXIMO. 38905' },
  { time: '13:50', place: 'MADRID PTA. ATOCHA', train: 'IRYO 06149', platform: '-', remarks: 'CANCELADO' },
  { time: '14:11', place: 'SEVILLA STA. JUSTA', train: 'AVANT 08744', platform: '-', remarks: '' },
  { time: '14:51', place: 'MADRID PTA. ATOCHA', train: 'AVE 02153', platform: '-', remarks: '' },
];

const KEYS: Record<keyof AdifRow, string> = { time: 'h', place: 'd', train: 't', platform: 'v', remarks: 'o' };
const MAX: Record<keyof AdifRow, number> = { time: 5, place: 18, train: 13, platform: 4, remarks: 14 };

export const frameSchema: ParamSchema = {
  fields: [
    ...EXAMPLE.flatMap((row, i): Field[] =>
      (Object.keys(KEYS) as (keyof AdifRow)[]).map((key) => ({
        key: `${KEYS[key]}${i + 1}`,
        type: 'text',
        label: `adif.frame.${key}`,
        default: row[key],
        maxLength: MAX[key],
        group: `row${i + 1}`,
      })),
    ),
    { key: 'wide', urlKey: 'fila', type: 'text', label: 'adif.frame.wide', default: 'SERVICIOS DE CERCANIAS LINEA C1 AEROPUERTO/FUENGIROLA' },
  ],
  groups: EXAMPLE.map((_, i) => ({ id: `row${i + 1}`, label: `adif.frame.row${i + 1}`, layout: 'row' as const })),
};

/**
 * Frames cross the replica's boundary flat (h1, d1, t1, v1, o1, h2...), as a
 * form and a URL hold them; inside, they are rows. A stack of boards has
 * rows past the seventh; the hand-typed form fills the first board.
 */
export function fromFlat(flat: Values): AdifFrame {
  let count = ROWS;
  while (flat[`h${count + 1}`] !== undefined || flat[`d${count + 1}`] !== undefined) count++;
  const rows = Array.from({ length: count }, (_, i) => {
    const row = {} as AdifRow;
    for (const key of Object.keys(KEYS) as (keyof AdifRow)[]) row[key] = String(flat[`${KEYS[key]}${i + 1}`] ?? '');
    return row;
  });
  return { rows, wide: String(flat.wide ?? '') };
}

export function toFlat(frame: AdifFrame): Values {
  const flat: Values = { wide: frame.wide };
  frame.rows.forEach((row, i) => {
    for (const key of Object.keys(KEYS) as (keyof AdifRow)[]) flat[`${KEYS[key]}${i + 1}`] = row[key];
  });
  return flat;
}

const boards = (options: Values): number => Math.max(1, Number(options.across) || 1) * Math.max(1, Number(options.down) || 1);

const selection = (options: Values): SelectionPolicy => ({
  events: options.mode === 'arrivals' ? 'arrivals' : 'departures',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'scheduled',
  keepAfterMs: 60_000,
  // Cancelled trains stay on the board, marked as such.
  includeCancelled: true,
  window: { size: ROWS * boards(options), mode: 'top', dwellMs: 0 },
});

const sizeOf = (options: Values): { width: number; height: number } =>
  stackSize(Math.max(1, Number(options.across) || 1), Math.max(1, Number(options.down) || 1));

export const mpElectronicsAdif: ReplicaDef = {
  id: 'mp-electronics-adif',
  viewBox: sizeOf({}),
  size: sizeOf,
  accepts: 'board',
  needs: { services: ROWS, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection,
  // A long-distance board wants long-distance trains.
  sourceDefaults: { demo: { network: 'long-distance' } },
  load: async () => (await import('./index')).default,
};
