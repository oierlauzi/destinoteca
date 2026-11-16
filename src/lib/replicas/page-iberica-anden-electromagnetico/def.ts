import type { SelectionPolicy } from '../../model';
import type { ParamSchema } from '../../params';
import type { ReplicaDef } from '../types';

/** Characters in the flip-dot line. */
export const CELLS = 16;

/** What the sign shows, as its controller sent it: one line of text and what goes on the LED row. */
export interface AndenFrame {
  /** The flip-dot line, up to 16 characters. */
  text: string;
  /** Written right-aligned over the end of the same line, beside the fixed "min." legend. */
  minutes: string;
  /** The vinyl number after "Vía". Not every sign had one. */
  platform: string;
  /** The LED row. Scrolls when it does not fit. */
  led: string;
  [key: string]: unknown;
}

export interface AndenOptions {
  showMinutes: boolean;
  dotColor: string;
  showOffDots: boolean;
  animate: boolean;
  ledColor: string;
  ledScroll: boolean;
  ledSpeed: number;
  ledIdle: string;
  deadOn: number;
  deadOff: number;
  deadSeed: number;
  hearts: number;
  [key: string]: unknown;
}

// URL keys are those of the original replica in renfe-flipdot-re, so that an
// embed made for it keeps working here with its query string untouched.
export const frameSchema: ParamSchema = {
  fields: [
    { key: 'text', type: 'text', label: 'anden.frame.text', default: 'SIN PARADA', maxLength: CELLS, glyphs: 'telenorma-cp437' },
    { key: 'minutes', urlKey: 'min', type: 'text', label: 'anden.frame.minutes', default: '1', maxLength: 4 },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'anden.frame.platform', default: '1', maxLength: 3 },
    { key: 'led', type: 'text', label: 'anden.frame.led', default: 'PROHIBIDO CRUZAR LAS VIAS', glyphs: 'telenorma-cp437' },
  ],
};

export const optionsSchema: ParamSchema = {
  groups: [
    { id: 'look', label: 'anden.group.look' },
    { id: 'defects', label: 'anden.group.defects' },
  ],
  fields: [
    { key: 'showMinutes', urlKey: 'showmin', type: 'boolean', label: 'anden.opt.showMinutes', default: true, group: 'look' },
    {
      key: 'dotColor', urlKey: 'dot', type: 'color', label: 'anden.opt.dotColor', default: '#e2d14a', group: 'look',
      choices: [
        { value: '#e2d14a', label: 'anden.color.amber' },
        { value: '#d9e04a', label: 'anden.color.yellowGreen' },
      ],
    },
    { key: 'showOffDots', urlKey: 'showoff', type: 'boolean', label: 'anden.opt.showOffDots', default: true, group: 'look' },
    { key: 'animate', urlKey: 'anim', type: 'boolean', label: 'anden.opt.animate', help: 'anden.opt.animate.help', default: true, group: 'look' },
    {
      key: 'ledColor', urlKey: 'ledc', type: 'color', label: 'anden.opt.ledColor', default: '#ff3b2e', group: 'look',
      choices: [
        { value: '#ff3b2e', label: 'anden.color.red' },
        { value: '#ff6a1a', label: 'anden.color.orange' },
        { value: '#ff2b55', label: 'anden.color.pinkRed' },
      ],
    },
    { key: 'ledScroll', urlKey: 'scroll', type: 'boolean', label: 'anden.opt.ledScroll', default: true, group: 'look' },
    { key: 'ledSpeed', urlKey: 'speed', type: 'range', label: 'anden.opt.ledSpeed', default: 14, min: 2, max: 30, step: 1, unit: 'col/s', group: 'look' },
    { key: 'ledIdle', urlKey: 'idle', type: 'text', label: 'anden.opt.ledIdle', help: 'anden.opt.ledIdle.help', default: '', group: 'look', glyphs: 'telenorma-cp437' },
    { key: 'deadOn', urlKey: 'deadon', type: 'range', label: 'anden.opt.deadOn', default: 0, min: 0, max: 20, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadOff', urlKey: 'deadoff', type: 'range', label: 'anden.opt.deadOff', default: 0, min: 0, max: 20, step: 0.5, unit: '%', group: 'defects' },
    { key: 'hearts', type: 'range', label: 'anden.opt.hearts', help: 'anden.opt.hearts.help', default: 0, min: 0, max: 25, step: 1, unit: '%', group: 'defects' },
    { key: 'deadSeed', urlKey: 'deadseed', type: 'number', label: 'anden.opt.deadSeed', default: 1, min: 0, max: 0xffffffff, group: 'defects', hidden: true, shuffle: true },
  ],
};

/** One platform, one train at a time, stepping through the next few. */
const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'expected',
  keepAfterMs: 30_000,
  includeCancelled: false,
  window: { size: 1, mode: 'rotate', dwellMs: 6000, depth: 12 },
};

export const andenElectromagnetico: ReplicaDef = {
  id: 'page-iberica-anden-electromagnetico',
  viewBox: { width: 190.87605, height: 81.160835 },
  accepts: 'board',
  needs: { services: 1, calls: true },
  options: optionsSchema,
  frame: frameSchema,
  selection: () => selection,
  load: async () => (await import('./index')).default,
};
