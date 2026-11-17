import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema } from '../../params';
import { CELLS, optionsSchema as andenOptionsSchema, type AndenOptions } from '../page-iberica-anden-electromagnetico/def';
import type { ReplicaDef } from '../types';

/**
 * Two of PAGE Ibérica's platform signs stacked in one box, one for each of
 * two platforms: each half has its own "Vía", "Próxima Llegada", flip-dot
 * line and LED row, laid out as on the single sign.
 */
export interface DosViasHalf {
  /** The vinyl number after "Vía". */
  platform: string;
  /** The flip-dot line, up to 16 characters. */
  text: string;
  /** Written right-aligned over the end of the line, beside "min.". */
  minutes: string;
  /** The half's LED row. */
  led: string;
}

export interface DosViasFrame {
  /** The upper half, then the lower one. */
  halves: [DosViasHalf, DosViasHalf];
  [key: string]: unknown;
}

export type DosViasOptions = AndenOptions;

/** The width of the single sign, and one more of its panels in height. */
export const WIDTH = 190.87605;
export const PANEL_HEIGHT = 67.75975;
export const HEIGHT = 81.160835 + PANEL_HEIGHT;

const HALVES = ['1', '2'] as const;

/** The frame as the flat settings a form and a URL can hold: via1, text1, min1, led1, via2... */
export const toFlat = (frame: DosViasFrame): Record<string, string> =>
  Object.fromEntries(
    frame.halves.flatMap((half, i) => [
      [`via${i + 1}`, half.platform],
      [`text${i + 1}`, half.text],
      [`min${i + 1}`, half.minutes],
      [`led${i + 1}`, half.led],
    ]),
  );

export const fromFlat = (flat: Record<string, unknown>): DosViasFrame => ({
  halves: HALVES.map((n) => ({
    platform: String(flat[`via${n}`] ?? ''),
    text: String(flat[`text${n}`] ?? ''),
    minutes: String(flat[`min${n}`] ?? ''),
    led: String(flat[`led${n}`] ?? ''),
  })) as [DosViasHalf, DosViasHalf],
});

// The example is the video it is known from: platform 5 empty, platform 4 a train to Valladolid.
const EXAMPLE: DosViasHalf[] = [
  { platform: '5', text: '', minutes: '', led: '' },
  { platform: '4', text: 'SOL-VALLAD', minutes: '2', led: 'PROHIBIDO CRUZAR LAS VIAS' },
];

export const frameSchema: ParamSchema = {
  fields: HALVES.flatMap((n, i): Field[] => {
    const half = EXAMPLE[i]!;
    const group = `half${n}`;
    return [
      { key: `via${n}`, type: 'text', label: 'anden.frame.platform', default: half.platform, maxLength: 3, group },
      { key: `text${n}`, type: 'text', label: 'anden.frame.text', default: half.text, maxLength: CELLS, glyphs: 'telenorma-cp437', group },
      { key: `min${n}`, type: 'text', label: 'anden.frame.minutes', default: half.minutes, maxLength: 4, group },
      { key: `led${n}`, type: 'text', label: 'anden.frame.led', default: half.led, glyphs: 'telenorma-cp437', group },
    ];
  }),
  groups: [
    { id: 'half1', label: 'dosvias.frame.top', layout: 'row' },
    { id: 'half2', label: 'dosvias.frame.bottom', layout: 'row' },
  ],
};

/**
 * The platforms of its placement, the next trains first, without stepping
 * through them: each half picks the first train for its own platform.
 */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 24, mode: 'top', dwellMs: 0 },
};

export const andenDosVias: ReplicaDef = {
  id: 'page-iberica-anden-dos-vias',
  viewBox: { width: WIDTH, height: HEIGHT },
  accepts: 'board',
  needs: { services: 24, calls: true },
  options: andenOptionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
