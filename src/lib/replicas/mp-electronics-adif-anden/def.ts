import type { SelectionPolicy } from '../../model';
import type { Field, ParamSchema, Values } from '../../params';
import { AMBER, GREEN, RED } from '../mp-electronics-adif/def';
import { motionField, type HandMotion } from '../clock-hands';
import type { ReplicaDef } from '../types';
import { sizeOf, type Kind } from './geometry';

/**
 * MP Electronics' platform displays for ADIF, in the design of its
 * departure boards: the next train on three rows of LED panels (time and
 * train; destination; a running line underneath), the platform number
 * printed large beside them with a green stripe on that side, and in two of
 * the three models a clock built in. Each is made in two hands: the number
 * and the stripe on the left or on the right.
 */
export interface AndenRow {
  time: string;
  train: string;
  destination: string;
  /** The third row: the stops, running when they do not fit. */
  line: string;
  platform: string;
}

export interface AndenFrame extends AndenRow {
  /** Station time, for the clock. */
  clock?: number;
  zone?: string;
}

export interface AndenOptions {
  side: 'left' | 'right';
  regional: '' | 'ca' | 'va' | 'eu' | 'gl';
  color: string;
  lineColor: string;
  lineScroll: boolean;
  lineSpeed: number;
  dial: 'festina' | 'mp';
  /** How the clock's hands move; only the models with a clock. */
  motion: HandMotion;
  deadOn: number;
  deadOff: number;
  deadRows: number;
  deadSeed: number;
  [key: string]: unknown;
}

const colorChoices = [
  { value: AMBER, label: 'adif.color.amber' },
  { value: GREEN, label: 'adif.color.green' },
  { value: RED, label: 'adif.color.red' },
];

function optionsSchema(kind: Kind): ParamSchema {
  const fields: Field[] = [
    {
      key: 'side', urlKey: 'lado', type: 'select', label: 'anden.mp.opt.side', help: 'anden.mp.opt.side.help', default: 'left', group: 'board',
      choices: [{ value: 'left', label: 'anden.mp.side.left' }, { value: 'right', label: 'anden.mp.side.right' }],
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
  ];
  if (kind !== 'plain') {
    fields.push({
      key: 'dial', urlKey: 'esfera', type: 'select', label: 'anden.mp.opt.dial', help: 'anden.mp.opt.dial.help', default: kind === 'vertical' ? 'mp' : 'festina', group: 'board',
      choices: [{ value: 'festina', label: 'anden.mp.dial.festina' }, { value: 'mp', label: 'anden.mp.dial.mp' }],
    }, motionField('board'));
  }
  fields.push(
    { key: 'color', type: 'color', label: 'adif.opt.color', default: AMBER, group: 'look', choices: colorChoices },
    { key: 'lineColor', urlKey: 'colorfila', type: 'color', label: 'anden.mp.opt.lineColor', default: RED, group: 'look', choices: colorChoices },
    { key: 'lineScroll', urlKey: 'scroll', type: 'boolean', label: 'adif.opt.wideScroll', default: true, group: 'look' },
    { key: 'lineSpeed', urlKey: 'speed', type: 'range', label: 'adif.opt.wideSpeed', default: 24, min: 4, max: 60, step: 1, unit: 'col/s', group: 'look' },
    { type: 'switch', key: 'deadPixels', label: 'adif.opt.deadPixels', controls: ['deadOn', 'deadOff', 'deadRows'], on: { deadOn: 0, deadOff: 1, deadRows: 3 }, group: 'defects' },
    { key: 'deadOn', urlKey: 'deadon', type: 'range', label: 'adif.opt.deadOn', default: 0, min: 0, max: 10, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadOff', urlKey: 'deadoff', type: 'range', label: 'adif.opt.deadOff', default: 0, min: 0, max: 20, step: 0.5, unit: '%', group: 'defects' },
    { key: 'deadRows', urlKey: 'deadrows', type: 'range', label: 'adif.opt.deadRows', help: 'adif.opt.deadRows.help', default: 0, min: 0, max: 20, step: 1, unit: '%', group: 'defects' },
    { key: 'deadSeed', urlKey: 'deadseed', type: 'number', label: 'adif.opt.deadSeed', default: 1, min: 0, max: 0xffffffff, group: 'defects', hidden: true, shuffle: true },
  );
  return {
    groups: [
      { id: 'board', label: 'adif.group.board' },
      { id: 'look', label: 'adif.group.look' },
      { id: 'defects', label: 'adif.group.defects' },
    ],
    fields,
  };
}

// The URL keys of the board's free text, where the meaning is the same.
export const frameSchema: ParamSchema = {
  fields: [
    { key: 'time', urlKey: 'h1', type: 'text', label: 'adif.frame.time', default: '12:28', maxLength: 5 },
    { key: 'train', urlKey: 't1', type: 'text', label: 'adif.frame.train', default: 'ALVIA 00621', maxLength: 13 },
    { key: 'destination', urlKey: 'd1', type: 'text', label: 'anden.mp.frame.destination', default: 'BARCELONA SANTS', maxLength: 18 },
    { key: 'line', urlKey: 'fila', type: 'text', label: 'anden.mp.frame.line', default: 'CON PARADA EN PAMPLONA, TAFALLA, CASTEJON' },
    { key: 'platform', urlKey: 'via', type: 'text', label: 'anden.frame.platform', default: '1', maxLength: 2 },
  ],
};

const selection: SelectionPolicy = {
  events: 'departures',
  platforms: 'one',
  portions: 'merge',
  sortBy: 'scheduled',
  keepAfterMs: 60_000,
  includeCancelled: false,
  window: { size: 1, mode: 'top', dwellMs: 0 },
};

function anden(id: string, kind: Kind): ReplicaDef {
  return {
    id,
    viewBox: sizeOf(kind),
    reads: ['services', 'time'],
    needs: { services: 1, calls: true },
    options: optionsSchema(kind),
    frame: frameSchema,
    selection: (_options: Values) => selection,
    sourceDefaults: { demo: { network: 'long-distance' }, adif: { traffic: 'RL' } },
    load: async () => (await import('./index')).implementation(kind),
  };
}

export const andenMp = anden('mp-electronics-adif-anden', 'plain');
export const andenMpReloj = anden('mp-electronics-adif-anden-reloj', 'clock');
export const andenMpVertical = anden('mp-electronics-adif-anden-vertical', 'vertical');
