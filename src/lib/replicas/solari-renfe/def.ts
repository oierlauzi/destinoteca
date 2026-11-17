import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema, Values } from '../../params';
import type { ReplicaDef } from '../types';
import { DEFAULT_ROWS, layout, stackSize, type Variant } from './geometry';

/**
 * Solari's split-flap boards for Renfe, in the dark skin of the 1970s and
 * 1980s: a light frame with the board's title, and rows of flaps under
 * printed legends. Two variants: long-distance departures (train,
 * destination, "por", departure, platform) and Cercanías (train, origin,
 * arrival, destination, departure, platform). Each row ends in two lamps.
 *
 * A frame is what the flaps show, row by row, as text: a time as "14.05".
 */
export type SolariRow = Record<string, string>;

export interface SolariFrame {
  rows: SolariRow[];
}

export interface SolariOptions {
  across: number;
  down: number;
  animate: boolean;
  speed: number;
  [key: string]: unknown;
}

const MAX_ACROSS = 4;
const MAX_DOWN = 3;

function optionsSchema(): ParamSchema {
  return {
    fields: [
      { key: 'across', urlKey: 'ancho', type: 'range', label: 'adif.opt.across', default: 1, min: 1, max: MAX_ACROSS, step: 1 },
      { key: 'down', urlKey: 'alto', type: 'range', label: 'adif.opt.down', help: 'adif.opt.stack.help', default: 1, min: 1, max: MAX_DOWN, step: 1 },
      { key: 'animate', urlKey: 'anim', type: 'boolean', label: 'solari.opt.animate', help: 'solari.opt.animate.help', default: true },
      { key: 'speed', type: 'range', label: 'solari.opt.speed', default: 14, min: 4, max: 30, step: 1, unit: 'paletas/s' },
    ],
  };
}

/** The examples of the hand-typed form, as photographed. */
const EXAMPLES: Record<Variant, SolariRow[]> = {
  largo: [
    { t: '', d: '', p: '', h: '11.00', v: '20', l: '1' },
    { t: 'RAPIDO', d: 'MONZON RIO C', p: '', h: '', v: '', l: '' },
    { t: '', d: '', p: '', h: '14.05', v: '13', l: '' },
    { t: 'RAP. ARAGON', d: 'CANFRANC', p: '', h: '14.10', v: '11', l: '' },
    { t: 'TALGO PENDULAR', d: 'CADIZ/HUELVA', p: '', h: '14.13', v: '', l: '' },
    { t: 'INTERURBANO', d: 'VALLADOLID', p: 'AVILA', h: '14.45', v: '7', l: '' },
    { t: 'TALGO PENDULAR', d: 'MALAGA', p: '', h: '15.00', v: '', l: '' },
    { t: 'TALGO', d: 'GRAN-ALMERIA', p: '', h: '', v: '', l: '' },
  ],
  cercanias: [
    { t: '', o: 'ATOCHA', a: '', d: 'CANTOBLANCO', s: '15.02', v: '2', l: '' },
    { t: '', o: 'CANTOBLANCO', a: '', d: 'ATOCHA', s: '14.53', v: '1', l: '' },
    { t: '', o: '', a: '', d: '', s: '', v: '', l: '' },
    { t: 'TRANVIA', o: 'EL ESCORIAL', a: '15.04', d: 'GUADALAJARA', s: '15.06', v: '3', l: '' },
    { t: 'TRANVIA', o: 'ALCALA H', a: '15.20', d: 'EL ESCORIAL', s: '15.25', v: '4', l: '' },
    { t: 'TRANVIA', o: 'CERCEDILLA', a: '15.39', d: 'GUADALAJARA', s: '15.40', v: '3', l: '' },
    { t: 'TRANVIA', o: 'GUADALAJARA', a: '15.46', d: 'CERCEDILLA', s: '15.47', v: '4', l: '' },
    { t: 'TRANVIA', o: 'AVILA', a: '15.52', d: 'ATOCHA', s: '15.53', v: '3', l: '' },
  ],
};

const LABELS: Record<string, string> = { t: 'tren', d: 'destino', p: 'por', o: 'procedencia', a: 'llegada', h: 'salida', s: 'salida', v: 'via', l: 'luces' };
const MAX_LENGTH: Record<string, number> = { t: 24, d: 12, o: 12, p: 18, h: 5, a: 5, s: 5, v: 2, l: 1 };

export const keysOf = (variant: Variant): string[] => layout(variant, 1).fields.map((field) => field.key);

function frameSchema(variant: Variant): ParamSchema {
  const keys = keysOf(variant);
  const example = EXAMPLES[variant];
  return {
    fields: example.flatMap((row, i): Field[] =>
      keys.map((key) => ({
        key: `${key}${i + 1}`,
        type: 'text',
        label: `solari.frame.${LABELS[key]}`,
        default: row[key] ?? '',
        maxLength: MAX_LENGTH[key],
        group: `row${i + 1}`,
      })),
    ),
    groups: example.map((_, i) => ({ id: `row${i + 1}`, label: `solari.frame.row${i + 1}`, layout: 'row' as const })),
  };
}

/** Frames cross the replica's boundary flat (t1, d1, h1...); inside, they are rows. */
export function fromFlat(variant: Variant, flat: Values): SolariFrame {
  const keys = keysOf(variant);
  return {
    rows: Array.from({ length: DEFAULT_ROWS[variant] * MAX_ACROSS * MAX_DOWN }, (_, i) => Object.fromEntries(keys.map((key) => [key, String(flat[`${key}${i + 1}`] ?? '')]))),
  };
}

export function toFlat(frame: SolariFrame): Values {
  const flat: Values = {};
  frame.rows.forEach((row, i) => {
    for (const [key, value] of Object.entries(row)) flat[`${key}${i + 1}`] = value;
  });
  return flat;
}

/** How many boards are hung together, and so how many rows there are in all: each board carries on from the one before. */
export const boardsOf = (options: Values): { across: number; down: number } => ({
  across: Math.max(1, Math.min(MAX_ACROSS, Number(options.across) || 1)),
  down: Math.max(1, Math.min(MAX_DOWN, Number(options.down) || 1)),
});
const rowsOf = (options: Values, variant: Variant): number => {
  const { across, down } = boardsOf(options);
  return DEFAULT_ROWS[variant] * across * down;
};

const selection = (variant: Variant) => (options: Values): SelectionPolicy => ({
  events: variant === 'largo' ? 'departures' : 'both',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'scheduled',
  keepAfterMs: 60_000,
  includeCancelled: false,
  window: { size: rowsOf(options, variant), mode: 'top', dwellMs: 0 },
});

function solari(id: string, variant: Variant): ReplicaDef {
  const size = (options: Values) => {
    const { across, down } = boardsOf(options);
    return stackSize(variant, across, down);
  };
  return {
    id,
    viewBox: size({}),
    size,
    accepts: 'board',
    needs: { services: DEFAULT_ROWS[variant], calls: false },
    options: optionsSchema(),
    frame: frameSchema(variant),
    selection: selection(variant),
    sourceDefaults: variant === 'largo' ? { demo: { network: 'long-distance' } } : undefined,
    load: async () => (await import('./index')).implementation(variant),
  };
}

export const solariLargo = solari('solari-renfe-largo-recorrido', 'largo');
export const solariCercanias = solari('solari-renfe-cercanias', 'cercanias');
export { rowsOf };
