import type { SourceDef } from '../types';

/**
 * Live Renfe Cercanías and Rodalies departures from ¿Dónde está mi tren?
 * (mitren.app). Only the description lives here; the client and the station
 * list (some 80 kB) are loaded when the source is actually used.
 */
export const mitrenDef: SourceDef = {
  id: 'mitren',
  label: 'mitren.label',
  description: 'mitren.description',
  kind: 'live',
  attribution: {
    name: '¿Dónde está mi tren? (mitren.app)',
    url: 'https://mitren.app/',
    license: 'Apache-2.0',
  },
  config: {
    fields: [
      {
        key: 'station',
        urlKey: 'station',
        type: 'lookup',
        lookup: 'station',
        label: 'mitren.field.station',
        placeholder: 'mitren.searchPlaceholder',
        default: '',
      },
      {
        // Set by picking a station. Old embeds carry a station code alone,
        // and the network is then looked up from it.
        key: 'network',
        urlKey: 'network',
        type: 'text',
        label: 'mitren.field.network',
        hidden: true,
        default: '',
      },
    ],
  },
  load: () => import('./index'),
};
