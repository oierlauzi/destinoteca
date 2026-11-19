import type { ParamSchema } from '../../params';
import type { SourceDef } from '../types';
import * as module from './index';

/**
 * One hand-typed service. Short keys, because the whole list travels in the
 * URL of an embed. Everything is optional: type what the display should know.
 */
export interface ManualRow {
  /** Destination. */
  dest?: string;
  /** Minutes until it leaves. */
  min?: number;
  /** Or the time it leaves, "HH:MM" station time. Wins over `min`. */
  time?: string;
  /** The time it arrives, "HH:MM" station time, for boards that show arrivals. */
  arr?: string;
  /** Platform. */
  via?: string;
  /** False while the platform is only expected. */
  conf?: boolean;
  /** Line, and its colour. */
  line?: string;
  color?: string;
  /** Train number. */
  num?: string;
  /** Service type: Cercanías, AVE... */
  prod?: string;
  /** Railway company. */
  op?: string;
  origin?: string;
  /** Calling points after this station, comma-separated. */
  stops?: string;
  /** Minutes late (negative: early). */
  delay?: number;
  /** '' runs normally. */
  state?: '' | 'cancelled' | 'passes' | 'terminus' | 'origin';
  /** Free-text remark. */
  note?: string;
  /** Further parts of a train that divides, each to its own destination. */
  split?: { dest?: string; stops?: string; pos?: '' | 'front' | 'middle' | 'rear'; num?: string }[];
  /** Where the first part rides in the train, when it divides. */
  pos?: '' | 'front' | 'middle' | 'rear';
}

export const EXAMPLE_ROWS: ManualRow[] = [
  { dest: 'Chamartín', min: 6, via: '1', line: 'C-1', color: '#4fb0e5', num: '23545', prod: 'Cercanías', op: 'Renfe', origin: 'Aeropuerto T4', stops: 'Nuevos Ministerios, Recoletos, Atocha' },
  { dest: 'Príncipe Pío', min: 11, via: '1', line: 'C-10', color: '#bccf00', prod: 'Cercanías', op: 'Renfe', origin: 'Villalba', stops: 'Pitis, Las Rozas' },
  { dest: 'Villalba', min: 18, via: '2', line: 'C-8', color: '#00a34b', prod: 'Cercanías', op: 'Renfe', origin: 'Atocha' },
];

export const manualConfig: ParamSchema = {
  fields: [
    { key: 'services', urlKey: 'svc', type: 'json', editor: 'services', label: 'manual.services', default: [], about: ['services'] },
    { key: 'station', urlKey: 'en', type: 'text', label: 'manual.station', default: '', placeholder: 'Madrid-Chamartín', about: ['services'] },
    { key: 'notice', urlKey: 'aviso', type: 'text', label: 'manual.notice', help: 'manual.notice.help', default: '', about: ['services'] },
    { key: 'time', urlKey: 'hora', type: 'text', label: 'manual.time', help: 'manual.time.help', default: '', maxLength: 5, placeholder: 'HH:MM', about: ['time'] },
    { key: 'freeze', urlKey: 'parado', type: 'boolean', label: 'manual.freeze', help: 'manual.freeze.help', default: false, about: ['time'] },
    { key: 'countdown', urlKey: 'cuenta', type: 'boolean', label: 'manual.countdown', help: 'manual.countdown.help', default: false, about: ['services'] },
  ],
};

export const manualDef: SourceDef = {
  id: 'manual',
  label: 'manual.label',
  description: 'manual.description',
  kind: 'manual',
  // Trains typed by hand, and the time of day the board lives at.
  provides: ['services', 'time'],
  config: manualConfig,
  // A couple of kilobytes: shipped with the page rather than fetched on first use.
  load: async () => module,
};
