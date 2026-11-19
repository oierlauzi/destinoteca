import type { SelectionPolicy } from '../../model';
import type { ParamSchema, Values } from '../../params';
import { wearFields, type WearOptions } from '../ikusi-metro-bilbao/parts';
import type { ReplicaDef } from '../types';
import { CHARS, sizeOf, type PlateSide } from './geometry';

/**
 * The notice boards Ikusi made for Metro Bilbao's concourses: three rows of
 * 35 liquid-crystal characters. A notice goes in Basque on the first row
 * and in Spanish on the second; the third runs, a character at a time, a
 * longer text or the stations it concerns. Since 2024 a NaviLens code hangs
 * beside it.
 */
export interface AvisosFrame {
  lines: string[];
}

export interface AvisosOptions extends WearOptions {
  navilens: PlateSide;
  scroll: boolean;
  /** Characters per second. */
  speed: number;
  [key: string]: unknown;
}

export const LINES = 3;
/** Blank characters between the end of a running text and its start again, as photographed. */
export const RUN_GAP = 8;

export const toFlat = (frame: AvisosFrame): Record<string, string> => Object.fromEntries(frame.lines.map((line, i) => [`l${i + 1}`, line]));
export const fromFlat = (flat: Record<string, unknown>): AvisosFrame => ({ lines: Array.from({ length: LINES }, (_, i) => String(flat[`l${i + 1}`] ?? '')) });

export const frameSchema: ParamSchema = {
  fields: [
    { key: 'l1', type: 'text', label: 'bilbao.frame.l1', default: 'KALEKO IGOGAILUA HONDATUA' },
    { key: 'l2', type: 'text', label: 'bilbao.frame.l2', default: 'ASCENSOR EXTERIOR AVERIADO' },
    { key: 'l3', type: 'text', label: 'bilbao.frame.l3', help: 'bilbao.frame.l3.help', default: 'DEUSTU/ARIZ' },
  ],
};

export const optionsSchema: ParamSchema = {
  groups: [
    { id: 'board', label: 'ikusi.group.board' },
    { id: 'look', label: 'ikusi.group.look' },
    { id: 'defects', label: 'ikusi.group.wear' },
  ],
  fields: [
    {
      key: 'navilens', urlKey: 'navilens', type: 'select', label: 'bilbao.opt.navilens', help: 'bilbao.opt.navilens.help', default: '', group: 'board',
      choices: [{ value: '', label: 'bilbao.navilens.none' }, { value: 'left', label: 'bilbao.navilens.left' }, { value: 'right', label: 'bilbao.navilens.right' }],
    },
    { key: 'scroll', urlKey: 'scroll', type: 'boolean', label: 'bilbao.opt.scroll', help: 'bilbao.opt.scroll.help', default: true, group: 'look' },
    { key: 'speed', urlKey: 'speed', type: 'range', label: 'bilbao.opt.speed', default: 3, min: 1, max: 10, step: 0.5, unit: 'car./s', group: 'look' },
    ...wearFields('defects'),
  ],
};

/** A notice board reads no trains; the policy only has to exist. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 0,
  includeCancelled: false,
  window: { size: 1, mode: 'top', dwellMs: 0 },
};

export const plateOf = (options: Values): PlateSide => (options.navilens === 'left' || options.navilens === 'right' ? options.navilens : '');

export { CHARS };

export const ikusiMetroBilbaoAvisos: ReplicaDef = {
  id: 'ikusi-metro-bilbao-avisos',
  viewBox: sizeOf(''),
  size: (options: Values) => sizeOf(plateOf(options)),
  // The notices of the simulated Metro Bilbao are the ones these boards wrote: Basque, Spanish, and the stations they concern.
  sourceDefaults: { demo: { network: 'metro-bilbao' } },
  accepts: 'board',
  needs: { services: 0, calls: false },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
