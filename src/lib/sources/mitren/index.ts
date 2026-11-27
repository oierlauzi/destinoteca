/**
 * The mitren source proper: everything `mitrenDef.load()` brings in.
 */
import type { Lookup, LookupItem, Values } from '../../params';
import type { SourceEnv, SourceInstance } from '../types';
import { MitrenSession, type MitrenDeps } from './client';
import { DEFAULT_FEED, findStation, isFeed, networkForCode, searchStations, stationUrl, type Station } from './stations';

/**
 * A session for the station in `config` (`station`, and optionally `feed`,
 * `network` and `url`). `deps` lets a test supply its own WebSocket.
 */
export function create(config: Values, env: SourceEnv, deps?: MitrenDeps): SourceInstance {
  return new MitrenSession(
    {
      station: String(config['station'] ?? ''),
      feed: String(config['feed'] ?? ''),
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
    urlLabel: 'mitren.viewOnMitren',
    set: { network: station.network },
  };
}

const networkOf = (values: Values | undefined): string => String(values?.['network'] ?? '').trim();

const feedOfValues = (values: Values | undefined): string => {
  const feed = String(values?.['feed'] ?? '').trim();
  return isFeed(feed) ? feed : DEFAULT_FEED;
};

/**
 * Station search: by name, town, mitren.app's aliases or code, accents
 * optional, within the feed that is chosen. A network already chosen is the
 * authority for a code, as an old embed carries one and nothing else.
 */
export const stationLookup: Lookup = {
  search(query, limit, values) {
    return searchStations(query, { feed: feedOfValues(values), network: networkOf(values) || undefined, limit }).map(item);
  },
  resolve(value, values) {
    const code = String(value ?? '').trim();
    if (!code) return undefined;
    const network = networkOf(values) || networkForCode(code, feedOfValues(values));
    const station = network ? findStation(network, code) : undefined;
    return station ? item(station) : undefined;
  },
  // The list is a snapshot of mitren.app's; a code it lacks may still answer.
  // Metro Bilbao numbers its stations from 1, Renfe's codes have five digits.
  accepts(value) {
    return /^\d{1,5}$/.test(String(value ?? '').trim());
  },
};

export const lookups: Record<string, Lookup> = { station: stationLookup };

export { MitrenSession } from './client';
export type { MitrenConfig, MitrenDeps, SocketFactory, SocketLike } from './client';
export { mapArrivals, remainingStops, mitrenExt, identityOf } from './map';
export * from './stations';
