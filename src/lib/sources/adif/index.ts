/**
 * The ADIF source proper: everything `adifDef.load()` brings in.
 */
import type { Lookup, LookupItem, Values } from '../../params';
import type { SourceEnv, SourceInstance } from '../types';
import { AdifSession, readTraffic, type AdifDeps } from './client';
import { findStation, searchStations, stationUrl, type AdifStation } from './stations';

/**
 * A session for the station in `config` (`station`, and optionally `traffic`
 * and `url`). `deps` lets a test supply its own WebSocket.
 */
export function create(config: Values, env: SourceEnv, deps?: AdifDeps): SourceInstance {
  return new AdifSession(
    {
      station: String(config['station'] ?? ''),
      traffic: readTraffic(config['traffic']),
      url: typeof config['url'] === 'string' && config['url'] ? config['url'] : undefined,
    },
    env,
    deps,
  );
}

function item(station: AdifStation): LookupItem {
  return {
    value: station.code,
    label: station.name,
    detail: [station.town, station.province, station.code].filter((part, i, all) => part && all.indexOf(part) === i).join(' · '),
    url: stationUrl(station.code),
    urlLabel: 'adif.viewOnAdif',
  };
}

/** Station search: by name, town, province or code, accents and leading zero optional. */
export const stationLookup: Lookup = {
  search(query, limit) {
    return searchStations(query, limit).map(item);
  },
  resolve(value) {
    const station = findStation(value);
    return station ? item(station) : undefined;
  },
  // The list is a snapshot; ADIF may well have a board for a code it lacks.
  accepts(value) {
    return /^\d{1,5}$/.test(String(value ?? '').trim());
  },
};

export const lookups: Record<string, Lookup> = { station: stationLookup };

export { AdifSession, ADIF_HUB, readTraffic } from './client';
export type { AdifConfig, AdifDeps, SocketFactory, SocketLike } from './client';
export { adifExt, identitiesFor, mapAlert, mapBoard, mapTrain, nameLadder, PlaceBook, readProduct } from './map';
export type { AdifBoard, AdifTrain } from './map';
export { allStations, findStation, normalCode, searchStations, stationPlace, stationUrl } from './stations';
