import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema, Values } from '../../params';
import { wearFields, type Tech, type WearOptions } from '../ikusi-metro-bilbao/parts';
import { motionField, type HandMotion } from '../clock-hands';
import type { ReplicaDef } from '../types';
import { CHARS, sizeOf, type Side } from './geometry';

/**
 * The platform signs Ikusi made for Metro Bilbao: two rows of 19
 * characters, one train each, and an analogue clock beside them. A row
 * writes the destination from the left and the minutes in its last two
 * characters; some trains carry a number in brackets before them, «(5)».
 * Made in two hands, the clock at one end or the other; since 2024 a
 * NaviLens code at the other end. Their glasses were later replaced by LED
 * modules in the same box.
 */
export interface BilbaoRow {
  destination: string;
  /** What goes in brackets before the minutes, without the brackets. */
  bracket: string;
  minutes: string;
}

export interface BilbaoFrame {
  rows: BilbaoRow[];
  /** Station time, for the clock. */
  clock?: number;
  zone?: string;
}

export interface BilbaoOptions extends WearOptions {
  side: Side;
  tech: Tech;
  navilens: boolean;
  /** How the clock's hands move. */
  motion: HandMotion;
  [key: string]: unknown;
}

/** The last two characters of a row are the minutes. */
export const MINUTES = 2;
/** The bracket ends one character before the minutes. */
export const BRACKET_END = CHARS - MINUTES - 1;

/** A row as its 19 characters: the destination, then the bracket and the minutes at the right end, a blank before each. */
export function composeRow(row: BilbaoRow, fold: (text: string) => string): string[] {
  const cells = Array.from({ length: CHARS }, () => ' ');
  const put = (text: string, from: number) => Array.from(text).forEach((char, i) => from + i >= 0 && from + i < CHARS && (cells[from + i] = char));
  const minutes = Array.from(fold(row.minutes.trim())).slice(-MINUTES).join('');
  const bracket = fold(row.bracket.trim());
  let room = CHARS;
  if (minutes) {
    put(minutes, CHARS - minutes.length);
    room = CHARS - MINUTES - 1;
  }
  if (bracket) {
    const text = `(${bracket})`;
    const from = BRACKET_END - Array.from(text).length;
    put(text, from);
    room = Math.max(0, from - 1);
  }
  put(Array.from(fold(row.destination)).slice(0, room).join(''), 0);
  return cells;
}

export const ROW_COUNT = 2;

/** The frame as the flat settings a form and a URL can hold: dest1, par1, min1, dest2... */
export const toFlat = (frame: BilbaoFrame): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  frame.rows.forEach((row, i) => {
    out[`dest${i + 1}`] = row.destination;
    out[`par${i + 1}`] = row.bracket;
    out[`min${i + 1}`] = row.minutes;
  });
  if (frame.clock !== undefined) out.clock = frame.clock;
  if (frame.zone !== undefined) out.zone = frame.zone;
  return out;
};

export const fromFlat = (flat: Record<string, unknown>): BilbaoFrame => ({
  rows: Array.from({ length: ROW_COUNT }, (_, i) => ({
    destination: String(flat[`dest${i + 1}`] ?? ''),
    bracket: String(flat[`par${i + 1}`] ?? ''),
    minutes: String(flat[`min${i + 1}`] ?? ''),
  })),
  clock: typeof flat.clock === 'number' ? flat.clock : undefined,
  zone: typeof flat.zone === 'string' ? flat.zone : undefined,
});

const EXAMPLE: BilbaoRow[] = [
  { destination: 'ETXEBARRI', bracket: '', minutes: '03' },
  { destination: 'BASAURI', bracket: '5', minutes: '05' },
];

export const frameSchema: ParamSchema = {
  fields: EXAMPLE.flatMap((row, k): Field[] => {
    const i = k + 1;
    const group = `row${i}`;
    return [
      { key: `dest${i}`, type: 'text', label: 'bilbao.frame.dest', default: row.destination, maxLength: CHARS, group },
      { key: `par${i}`, type: 'text', label: 'bilbao.frame.bracket', help: 'bilbao.frame.bracket.help', default: row.bracket, maxLength: 2, group },
      { key: `min${i}`, type: 'text', label: 'bilbao.frame.min', default: row.minutes, maxLength: MINUTES, group },
    ];
  }),
  groups: [
    { id: 'row1', label: 'bilbao.frame.row1', layout: 'row' },
    { id: 'row2', label: 'bilbao.frame.row2', layout: 'row' },
  ],
};

export const optionsSchema: ParamSchema = {
  groups: [
    { id: 'board', label: 'ikusi.group.board' },
    { id: 'defects', label: 'ikusi.group.wear' },
  ],
  fields: [
    {
      key: 'tech', urlKey: 'caracteres', type: 'select', label: 'bilbao.opt.tech', help: 'bilbao.opt.tech.help', default: 'lcd', group: 'board',
      choices: [{ value: 'lcd', label: 'bilbao.tech.lcd' }, { value: 'led', label: 'bilbao.tech.led' }],
    },
    {
      key: 'side', urlKey: 'lado', type: 'select', label: 'bilbao.opt.side', default: 'left', group: 'board',
      choices: [{ value: 'left', label: 'bilbao.side.left' }, { value: 'right', label: 'bilbao.side.right' }],
    },
    { key: 'navilens', urlKey: 'navilens', type: 'boolean', label: 'bilbao.opt.navilens', help: 'bilbao.opt.navilens.help', default: false, group: 'board' },
    motionField('board'),
    ...wearFields('defects'),
  ],
};

/** One platform, the next two trains on it. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: ROW_COUNT, mode: 'top', dwellMs: 0 },
};

export const sideOf = (options: Values): Side => (options.side === 'right' ? 'right' : 'left');
export const techOf = (options: Values): Tech => (options.tech === 'led' ? 'led' : 'lcd');

export const ikusiMetroBilbaoAnden: ReplicaDef = {
  id: 'ikusi-metro-bilbao-anden',
  viewBox: sizeOf('left', false),
  size: (options: Values) => sizeOf(sideOf(options), options.navilens === true),
  // A sign of the Metro announces the Metro's trains: simulated, Metro
  // Bilbao's network; live, Metro Bilbao's own feed.
  sourceDefaults: { demo: { network: 'metro-bilbao' }, mitren: { feed: 'metro-bilbao' } },
  accepts: 'board',
  needs: { services: ROW_COUNT, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
