import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema } from '../../params';
import { familyOptionsSchema, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import type { ReplicaDef } from '../types';
import { boardGeometry, CELLS } from './geometry';

/**
 * PAGE Ibérica's electromagnetic concourse boards: two or four lines of 20
 * flip-dot characters under a printed header, and the same red LED row as
 * the platform signs, a little wider than the lines. One line per train:
 * platform, destination, minutes.
 *
 * The geometry is estimated from photographs taken at an angle; no unit has
 * been measured.
 */
export { CELLS } from './geometry';
/** The platform takes the first two characters of a line ("Vía" is printed above them). */
export const PLATFORM_CELLS = 2;

export interface BoardRow {
  platform: string;
  destination: string;
  minutes: string;
}

/** What the board shows, as its controller sent it: one row per line, and the LED row. */
export interface VestibuloFrame {
  rows: BoardRow[];
  led: string;
  [key: string]: unknown;
}

/** The frame as the flat settings a form and a URL can hold: via1, dest1, min1, via2... */
export const toFlat = (frame: VestibuloFrame): Record<string, string> => {
  const out: Record<string, string> = { led: frame.led };
  frame.rows.forEach((row, i) => {
    out[`via${i + 1}`] = row.platform;
    out[`dest${i + 1}`] = row.destination;
    out[`min${i + 1}`] = row.minutes;
  });
  return out;
};

export const fromFlat = (lines: number, flat: Record<string, unknown>): VestibuloFrame => ({
  rows: Array.from({ length: lines }, (_, i) => ({
    platform: String(flat[`via${i + 1}`] ?? ''),
    destination: String(flat[`dest${i + 1}`] ?? ''),
    minutes: String(flat[`min${i + 1}`] ?? ''),
  })),
  led: String(flat.led ?? ''),
});

function frameSchema(lines: number, example: BoardRow[]): ParamSchema {
  const fields: Field[] = [];
  for (let i = 1; i <= lines; i++) {
    const row = example[i - 1] ?? { platform: '', destination: '', minutes: '' };
    const group = `row${i}`;
    fields.push(
      { key: `via${i}`, type: 'text', label: 'vestibulo.frame.via', default: row.platform, maxLength: PLATFORM_CELLS, group },
      { key: `dest${i}`, type: 'text', label: 'vestibulo.frame.dest', default: row.destination, maxLength: CELLS - PLATFORM_CELLS, glyphs: 'telenorma-cp437', group },
      { key: `min${i}`, type: 'text', label: 'vestibulo.frame.min', default: row.minutes, maxLength: 3, group },
    );
  }
  fields.push({ key: 'led', type: 'text', label: 'vestibulo.frame.led', default: '', glyphs: 'telenorma-cp437' });
  return { fields, groups: Array.from({ length: lines }, (_, i) => ({ id: `row${i + 1}`, label: `vestibulo.frame.row${i + 1}`, layout: 'row' as const })) };
}

/** The whole station, the next trains first, as many as there are lines. */
const selection = (lines: number): SelectionPolicy => ({
  events: 'departures',
  platforms: 'any',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: lines, mode: 'top', dwellMs: 0 },
});

export type VestibuloOptions = FamilyOptions;

/**
 * The family's settings, less the LED row's idle text: what the boards' LED
 * row showed is not known, so it is left dark rather than filled in.
 */
export const optionsSchema: ParamSchema = {
  ...familyOptionsSchema,
  fields: [
    ...familyOptionsSchema.fields.filter((field) => field.key !== 'ledIdle'),
    { key: 'colon', urlKey: 'dospuntos', type: 'boolean', label: 'vestibulo.opt.colon', help: 'vestibulo.opt.colon.help', default: false, group: 'look' },
  ],
};

/** `nextArrival`: whether "Próxima Llegada" is printed in the header (it is at Cantoblanco, not at Tres Cantos). */
function board(id: string, lines: number, nextArrival: boolean, example: BoardRow[]): ReplicaDef {
  const { width, height } = boardGeometry(lines);
  return {
    id,
    viewBox: { width, height },
    accepts: 'board',
    needs: { services: lines, calls: false },
    options: optionsSchema,
    frame: frameSchema(lines, example),
    selection: () => selection(lines),
    load: async () => (await import('./index')).implementation(lines, nextArrival),
  };
}

// Defaults for "texto libre": trains of line C-4, which served both stations.
export const vestibulo2 = board('page-iberica-vestibulo-2-lineas', 2, false, [
  { platform: '1', destination: 'CHAMARTIN', minutes: '2' },
  { platform: '2', destination: 'COLMENAR VIEJO', minutes: '13' },
]);

export const vestibulo4 = board('page-iberica-vestibulo-4-lineas', 4, true, [
  { platform: '2', destination: 'CHAMARTIN', minutes: '8' },
  { platform: '1', destination: 'COLMENAR VIEJO', minutes: '8' },
  { platform: '2', destination: 'ATOCHA', minutes: '15' },
  { platform: '1', destination: 'ALCOBENDAS', minutes: '22' },
]);
