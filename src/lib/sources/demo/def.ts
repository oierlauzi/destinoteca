import type { SourceDef } from '../types';
import * as module from './index';

export const demoDef: SourceDef = {
  id: 'demo',
  label: 'demo.label',
  description: 'demo.description',
  kind: 'simulated',
  config: {
    fields: [
      // Seeds the board, so that each station shows its own. Shared with the live source on purpose:
      // switching between the two keeps the station.
      { key: 'station', type: 'text', label: 'demo.station', default: '', hidden: true },
    ],
  },
  // A couple of kilobytes: shipped with the page rather than fetched on first use.
  load: async () => module,
};
