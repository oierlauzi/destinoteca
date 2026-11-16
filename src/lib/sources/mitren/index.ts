/**
 * The mitren source proper: everything `mitrenDef.load()` brings in.
 */
import type { Lookup, LookupItem, Values } from '../../params';
import type { SourceEnv, SourceInstance } from '../types';
import { MitrenSession, type MitrenDeps } from './client';
import { findStation, networkForCode, searchStations, stationUrl, type Station } from './stations';

/**
 * A session for the station in `config` (`station`, and optionally `network`
 * and `url`). `deps` lets a test supply its own WebSocket.
 */
export function create(config: Values, env: SourceEnv, deps?: MitrenDeps): SourceInstance {
  return new MitrenSession(
    {
      station: String(config['station'] ?? ''),
      network: String(config['network'] ?? ''),
      url: typeof config['url'] === 'string' && config['url'] ? config['url'] : undefined,
    },
    env,
    deps,
  );
}

function item(station: Station): LookupItem {
  return {
    value: station.code,
    label: station.name,
    detail: [station.town, station.networkName].filter(Boolean).join(' · '),
    url: stationUrl(station.network, station.code),
    set: { network: station.network },
  };
}

const networkOf = (values: Values | undefined): string => String(values?.['network'] ?? '').trim();

/** Station search: by name, town, mitren.app's aliases or code, accents optional. */
export const stationLookup: Lookup = {
  search(query, limit, values) {
    return searchStations(query, { network: networkOf(values) || undefined, limit }).map(item);
  },
  resolve(value, values) {
    const code = String(value ?? '').trim();
    if (!code) return undefined;
    const network = networkOf(values) || networkForCode(code);
    const station = network ? findStation(network, code) : undefined;
    return station ? item(station) : undefined;
  },
  // The list is a snapshot of mitren.app's; a code it lacks may still answer.
  accepts(value) {
    return /^\d{4,5}$/.test(String(value ?? '').trim());
  },
};

export const lookups: Record<string, Lookup> = { station: stationLookup };

export { MitrenSession } from './client';
export type { MitrenConfig, MitrenDeps, SocketFactory, SocketLike } from './client';
export { mapArrivals, remainingStops, mitrenExt } from './map';
export * from './stations';
