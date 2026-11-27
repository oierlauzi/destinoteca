import type { SourceDef } from '../types';

/**
 * Live departures from ¿Dónde está mi tren? (mitren.app): Renfe's Cercanías
 * and Rodalies, Euskotren or Metro Bilbao, whichever feed is picked. Only the
 * description lives here; the client and the station list (some 90 kB) are
 * loaded when the source is actually used.
 */
export const mitrenDef: SourceDef = {
  id: 'mitren',
  label: 'mitren.label',
  description: 'mitren.description',
  credit: 'mitren.credit',
  kind: 'live',
  // The feed reports its server's time along the way, but trains are what it is for.
  provides: ['services'],
  attribution: {
    name: '¿Dónde está mi tren? (mitren.app)',
    url: 'https://mitren.app/',
    license: 'Apache-2.0',
  },
  config: {
    fields: [
      {
        // Which of mitren.app's feeds. The values are those of FEEDS in
        // stations.ts, repeated here so that choosing a source loads nothing.
        key: 'feed',
        urlKey: 'op',
        type: 'select',
        label: 'mitren.field.feed',
        help: 'mitren.field.feed.help',
        default: 'cercanias',
        choices: [
          { value: 'cercanias', label: 'mitren.feed.cercanias' },
          { value: 'euskotren', label: 'mitren.feed.euskotren' },
          { value: 'metro-bilbao', label: 'mitren.feed.metro-bilbao' },
        ],
        // A station code only means anything inside its own feed.
        resets: ['station', 'network'],
      },
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
