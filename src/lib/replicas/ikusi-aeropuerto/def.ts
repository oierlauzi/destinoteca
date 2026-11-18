import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema, Values } from '../../params';
import type { ReplicaDef } from '../types';
import { type BoardRow, type LayoutId, type Mode, type Regional } from './columns';
import { boardSize, MAX_CELLS, MAX_ROWS, MIN_CELLS, MIN_ROWS, shapeOf, type PictoSize } from './geometry';

/**
 * Ikusi's liquid-crystal departure and arrival boards of Aena's airports:
 * a printed header with Aena's pictogram, the title and the legends of the
 * columns, and under it rows of character modules, one module per
 * character, each row a run of 51 of them on most boards. What goes in
 * each column is up to the airport; the board only has its rows.
 */
export interface AirportFrame {
  /** One per row of the board, from the top; a board shows as many as it has. */
  rows: BoardRow[];
  /** The clock in the header of the boards that have one: «12:01». */
  clock: string;
  [key: string]: unknown;
}

export type Model = 'clasico' | 'reloj';
export type FrameColor = 'gris' | 'plata' | 'negro';
export type GlassTint = 'verde' | 'oliva' | 'ambar';

export interface AirportOptions {
  mode: Mode;
  /** `reloj`: the later boards with a yellow line round the front and a clock in the header. */
  model: Model;
  regional: Regional;
  layout: LayoutId;
  /** Printed large in the header after «Terminal»: «B», «T1». */
  terminal: string;
  frame: FrameColor;
  rounded: boolean;
  rows: number;
  cells: number;
  picto: PictoSize;
  glass: GlassTint;
  /** Whether the header's clock is lit. */
  clockOn: boolean;
  uneven: number;
  delamination: number;
  wearSeed: number;
  [key: string]: unknown;
}

export const optionsSchema: ParamSchema = {
  groups: [
    { id: 'board', label: 'aeropuerto.group.board' },
    { id: 'look', label: 'aeropuerto.group.look' },
    { id: 'defects', label: 'ikusi.group.wear' },
  ],
  fields: [
    {
      key: 'mode', urlKey: 'modo', type: 'select', label: 'aeropuerto.opt.mode', default: 'departures', group: 'board',
      choices: [{ value: 'departures', label: 'aeropuerto.mode.departures' }, { value: 'arrivals', label: 'aeropuerto.mode.arrivals' }],
    },
    {
      key: 'regional', urlKey: 'lengua', type: 'select', label: 'aeropuerto.opt.regional', help: 'aeropuerto.opt.regional.help', default: 'va', group: 'board',
      choices: [
        { value: '', label: 'aeropuerto.regional.none' },
        { value: 'va', label: 'aeropuerto.regional.va' },
        { value: 'ca', label: 'aeropuerto.regional.ca' },
        { value: 'eu', label: 'aeropuerto.regional.eu' },
        { value: 'de', label: 'aeropuerto.regional.de' },
      ],
    },
    {
      key: 'layout', urlKey: 'columnas', type: 'select', label: 'aeropuerto.opt.layout', help: 'aeropuerto.opt.layout.help', default: 'valencia', group: 'board',
      choices: [
        { value: 'valencia', label: 'aeropuerto.layout.valencia' },
        { value: 'bilbao', label: 'aeropuerto.layout.bilbao' },
        { value: 'canarias', label: 'aeropuerto.layout.canarias' },
        { value: 'barajas', label: 'aeropuerto.layout.barajas' },
      ],
    },
    { key: 'rows', urlKey: 'filas', type: 'range', label: 'aeropuerto.opt.rows', default: 12, min: MIN_ROWS, max: MAX_ROWS, step: 1, group: 'board' },
    { key: 'cells', urlKey: 'modulos', type: 'range', label: 'aeropuerto.opt.cells', help: 'aeropuerto.opt.cells.help', default: 51, min: MIN_CELLS, max: MAX_CELLS, step: 1, group: 'board' },
    {
      key: 'model', urlKey: 'modelo', type: 'select', label: 'aeropuerto.opt.model', help: 'aeropuerto.opt.model.help', default: 'clasico', group: 'board',
      choices: [{ value: 'clasico', label: 'aeropuerto.model.clasico' }, { value: 'reloj', label: 'aeropuerto.model.reloj' }],
    },
    { key: 'clockOn', urlKey: 'encendido', type: 'boolean', label: 'aeropuerto.opt.clockOn', help: 'aeropuerto.opt.clockOn.help', default: true, group: 'board' },
    { key: 'terminal', type: 'text', label: 'aeropuerto.opt.terminal', help: 'aeropuerto.opt.terminal.help', default: '', maxLength: 4, group: 'board' },
    {
      key: 'frame', urlKey: 'marco', type: 'select', label: 'aeropuerto.opt.frame', help: 'aeropuerto.opt.frame.help', default: 'gris', group: 'look',
      choices: [{ value: 'gris', label: 'aeropuerto.frame.gris' }, { value: 'plata', label: 'aeropuerto.frame.plata' }, { value: 'negro', label: 'aeropuerto.frame.negro' }],
    },
    { key: 'rounded', urlKey: 'redondeado', type: 'boolean', label: 'aeropuerto.opt.rounded', default: false, group: 'look' },
    {
      key: 'picto', urlKey: 'titulo', type: 'select', label: 'aeropuerto.opt.picto', help: 'aeropuerto.opt.picto.help', default: 'grande', group: 'look',
      choices: [{ value: 'grande', label: 'aeropuerto.picto.grande' }, { value: 'mediano', label: 'aeropuerto.picto.mediano' }, { value: 'pequeno', label: 'aeropuerto.picto.pequeno' }],
    },
    {
      key: 'glass', urlKey: 'cristal', type: 'select', label: 'aeropuerto.opt.glass', help: 'aeropuerto.opt.glass.help', default: 'oliva', group: 'look',
      choices: [{ value: 'verde', label: 'aeropuerto.glass.verde' }, { value: 'oliva', label: 'aeropuerto.glass.oliva' }, { value: 'ambar', label: 'aeropuerto.glass.ambar' }],
    },
    { key: 'uneven', urlKey: 'tono', type: 'range', label: 'ikusi.opt.uneven', help: 'ikusi.opt.uneven.help', default: 40, min: 0, max: 100, step: 5, unit: '%', group: 'defects' },
    { key: 'delamination', urlKey: 'despegado', type: 'range', label: 'ikusi.opt.delamination', help: 'ikusi.opt.delamination.help', default: 0, min: 0, max: 50, step: 1, unit: '%', group: 'defects' },
    { key: 'wearSeed', urlKey: 'semilla', type: 'number', label: 'ikusi.opt.wearSeed', default: 1, min: 0, max: 0xffffffff, group: 'defects', hidden: true, shuffle: true },
  ],
};

const blankRow = (): BoardRow => ({ time: '', place: '', flight: '', counter: '', second: '', gate: '', remarks: '' });

const row = (flight: string, place: string, time: string, second: string, counter: string, gate = '', remarks = ''): BoardRow => ({ time, place, flight, counter, second, gate, remarks });

/** The example in the free-text form: the departures of Valencia, as photographed. */
const EXAMPLE: BoardRow[] = [
  row('UX 4004', 'P.MALLORCA', '09:05', '08:40', '', 'R54', 'UL.LLAMAD'),
  row('FR 9678', 'ROMA-CIA', '09:25', '08:42', '35-36', 'C12', 'EMBARQUE'),
  row('FR 9835', 'FRANK HAHN', '09:55', '09:20', '35-36', 'A4'),
  row('HV 5390', 'ROTTERDAM', '10:15', '09:40', '58-59'),
  row('IB 8246', 'ASTURIAS', '10:15', '09:50', '1-4'),
  row('IB 8734', 'MENORCA', '10:15', '09:50', '1-4'),
  row('IB 8993', 'MADRID', '10:15', '09:50', '1-4'),
  row('FR 7216', 'IBIZA', '11:10', '10:35', '35-36'),
  row('EZY 5222', 'LONDRES-GW', '11:30', '10:55', '60-61'),
  row('TP 1097', 'LISBOA', '12:05', '11:40', '56-57'),
  row('UX 4064', 'MADRID', '12:20', '11:55', '18-20'),
  row('VY 8920', 'BRUSELAS', '12:35', '12:00', '6-7'),
];

/** The URL keys of a row's fields, followed by the row's number: h1, d1, v1… */
const KEYS: Record<keyof BoardRow, string> = { time: 'h', place: 'd', flight: 'v', counter: 'm', second: 'e', gate: 'p', remarks: 'o' };
const MAX: Record<keyof BoardRow, number> = { time: 5, place: 10, flight: 8, counter: 7, second: 5, gate: 3, remarks: 30 };
const FIELD_ORDER: (keyof BoardRow)[] = ['time', 'place', 'flight', 'counter', 'second', 'gate', 'remarks'];

export const frameSchema: ParamSchema = {
  fields: [
    ...Array.from({ length: MAX_ROWS }, (_, i): Field[] => {
      const example = EXAMPLE[i] ?? blankRow();
      return FIELD_ORDER.map((key) => ({
        key: `${KEYS[key]}${i + 1}`,
        type: 'text',
        label: `aeropuerto.frame.${key}`,
        default: example[key],
        maxLength: MAX[key],
        group: `row${i + 1}`,
      }));
    }).flat(),
    { key: 'clock', urlKey: 'reloj', type: 'text', label: 'aeropuerto.frame.clock', default: '', maxLength: 5 },
  ],
  groups: Array.from({ length: MAX_ROWS }, (_, i) => ({ id: `row${i + 1}`, label: `aeropuerto.frame.row${i + 1}`, layout: 'row' as const })),
};

/**
 * Frames cross the replica's boundary flat (h1, d1, v1… h2…), as a form and
 * a URL hold them; inside, they are rows.
 */
export function fromFlat(flat: Values): AirportFrame {
  const rows = Array.from({ length: MAX_ROWS }, (_, i) => {
    const out = blankRow();
    for (const key of FIELD_ORDER) out[key] = String(flat[`${KEYS[key]}${i + 1}`] ?? '');
    return out;
  });
  return { rows, clock: String(flat.clock ?? '') };
}

export function toFlat(frame: AirportFrame): Values {
  const flat: Values = { clock: frame.clock };
  for (let i = 0; i < MAX_ROWS; i++) {
    const row = frame.rows[i] ?? blankRow();
    for (const key of FIELD_ORDER) flat[`${KEYS[key]}${i + 1}`] = row[key];
  }
  return flat;
}

const selection = (options: Values): SelectionPolicy => ({
  events: options.mode === 'arrivals' ? 'arrivals' : 'departures',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'scheduled',
  keepAfterMs: 60_000,
  // Cancelled flights stay on the board, marked as such.
  includeCancelled: true,
  window: { size: shapeOf(options).rows, mode: 'top', dwellMs: 0 },
});

const sizeOf = (options: Values): { width: number; height: number } => boardSize(shapeOf(options));

export const ikusiAeropuerto: ReplicaDef = {
  id: 'ikusi-aeropuerto',
  viewBox: sizeOf({ rows: 12, cells: 51 }),
  size: sizeOf,
  accepts: 'board',
  needs: { services: MAX_ROWS, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection,
  // Trains with numbers and names of long-distance services read more like flights.
  sourceDefaults: { demo: { network: 'long-distance' } },
  load: async () => (await import('./index')).default,
};
