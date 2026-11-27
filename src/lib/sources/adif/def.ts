import type { SourceDef } from '../types';

/**
 * Live departures and arrivals from ADIF, the infrastructure manager: the
 * boards behind the screens of its stations, published at info.adif.es, for
 * every operator and every kind of train it shows. Only the description lives
 * here; the client and the station list are loaded when the source is used.
 */
export const adifDef: SourceDef = {
  id: 'adif',
  label: 'adif.label',
  description: 'adif.description',
  credit: 'adif.credit',
  kind: 'live',
  provides: ['services'],
  attribution: {
    name: 'Adif (info.adif.es)',
    url: 'https://info.adif.es/',
  },
  config: {
    fields: [
      {
        key: 'station',
        urlKey: 'station',
        type: 'lookup',
        lookup: 'station',
        label: 'adif.field.station',
        placeholder: 'adif.searchPlaceholder',
        default: '',
      },
      {
        // ADIF's own three kinds of traffic, as its screens are set up to
        // show them (`traffic=C,R,L` on info.adif.es). A display made for
        // one kind starts on it (`sourceDefaults`).
        key: 'traffic',
        urlKey: 'trafico',
        type: 'select',
        label: 'adif.field.traffic',
        help: 'adif.field.traffic.help',
        default: 'CRL',
        choices: [
          { value: 'CRL', label: 'adif.traffic.CRL' },
          { value: 'C', label: 'adif.traffic.C' },
          { value: 'RL', label: 'adif.traffic.RL' },
          { value: 'L', label: 'adif.traffic.L' },
          { value: 'R', label: 'adif.traffic.R' },
        ],
      },
    ],
  },
  load: () => import('./index'),
};
