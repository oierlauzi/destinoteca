import type { SourceDef } from '../types';

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
  load: () => import('./index'),
};
