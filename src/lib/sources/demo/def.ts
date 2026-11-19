import type { SourceDef } from '../types';
import * as module from './index';
import { DEFAULT_NETWORK, NETWORKS } from './networks';

export const demoDef: SourceDef = {
  id: 'demo',
  label: 'demo.label',
  description: 'demo.description',
  kind: 'simulated',
  provides: ['services'],
  config: {
    fields: [
      // Seeds the board, so that each station shows its own. Shared with the live source on purpose:
      // switching between the two keeps the station.
      { key: 'station', type: 'text', label: 'demo.station', default: '', hidden: true },
      {
        // Which network the board stands in for. A replica starts on the one it was built to announce
        // (`sourceDefaults`), and the rest are offered here.
        key: 'network', urlKey: 'red', type: 'select', label: 'demo.network', help: 'demo.network.help', default: DEFAULT_NETWORK.id,
        choices: NETWORKS.map((network) => ({ value: network.id, label: network.label })),
      },
    ],
  },
  // A couple of kilobytes: shipped with the page rather than fetched on first use.
  load: async () => module,
};
