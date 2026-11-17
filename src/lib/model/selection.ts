import { expandPortions, groupCoupled } from './portions';
import { confirmedPlatform, samePlatform } from './text';
import { bestTime } from './time';
import type { BoardSnapshot, Notice, Place, Service } from './types';

/**
 * How one display narrows the station-wide snapshot down to what it shows.
 * Declared by the replica, executed by the player with the pure functions
 * below: a one-line platform sign and a four-row concourse board differ only
 * in the policy they return.
 */
export interface SelectionPolicy {
  events: 'departures' | 'arrivals' | 'both';
  /** `one`: the unit serves the platform(s) given by its placement. `any`: the whole station. */
  platforms: 'one' | 'any';
  /** A dividing train as one row, or as one row per destination. */
  portions: 'merge' | 'rows';
  sortBy: 'expected' | 'scheduled';
  /** How long a service stays after its time has passed. */
  keepAfterMs: number;
  includeCancelled: boolean;
  window: {
    /** Rows the hardware has. */
    size: number;
    /** `top`: the next ones. `rotate`: step through one by one. `page`: step through a screenful at a time. */
    mode: 'top' | 'rotate' | 'page';
    dwellMs: number;
    /** How deep into the board rotation or paging goes. */
    depth?: number;
  };
}

/** Where a unit hangs: which platforms it serves, and whether it steps through trains. */
export interface Placement {
  /** Platform names. Empty means "not bolted to any". */
  platforms: string[];
  /** False holds the next service instead of rotating or paging. */
  cycle: boolean;
  /**
   * How many services the units before this one already show: the second
   * board of a series hung together carries on where the first stops.
   */
  skip?: number;
}

/** What a replica's presenter receives. Always a list, even for a one-line sign. */
export interface View {
  now: number;
  timeZone: string;
  station?: Place;
  /** The window: up to `policy.window.size` services, in display order. */
  services: Service[];
  /** How many services were eligible before windowing. */
  total: number;
  page?: { index: number; count: number };
  notices: Notice[];
  placement: Placement;
}

export const DEFAULT_TIME_ZONE = 'Europe/Madrid';

/** The time a service is ordered and expired by, from this board's point of view. */
export function boardTime(service: Service, policy: Pick<SelectionPolicy, 'events' | 'sortBy'>): number | undefined {
  const here = service.here;
  if (!here) return undefined;
  const event = policy.events === 'arrivals' ? (here.arrival ?? here.departure) : (here.departure ?? here.arrival);
  if (!event) return undefined;
  return policy.sortBy === 'scheduled' ? (event.scheduled ?? bestTime(event)) : bestTime(event);
}

function wanted(service: Service, policy: SelectionPolicy): boolean {
  const activity = service.here?.activity;
  // A train ending here is not a departure, and one starting here is not an arrival.
  if (policy.events === 'departures' && activity === 'terminus') return false;
  if (policy.events === 'arrivals' && activity === 'origin') return false;
  if (!policy.includeCancelled && service.status === 'cancelled') return false;
  return true;
}

function onPlatform(service: Service, platforms: string[]): boolean {
  if (platforms.length === 0) return true;
  // Like the real thing, only a confirmed platform puts a train on a sign.
  const name = confirmedPlatform(service.here?.platform);
  return platforms.some((platform) => samePlatform(name, platform));
}

/**
 * Every service this display could show, in order. Services without a time
 * (hand-typed ones) keep their place at the end, in the order given.
 */
export function eligible(snapshot: BoardSnapshot, policy: SelectionPolicy, placement: Placement, now: number): Service[] {
  let services = groupCoupled(snapshot.services).filter((service) => wanted(service, policy));
  if (policy.platforms === 'one') services = services.filter((service) => onPlatform(service, placement.platforms));
  if (policy.portions === 'rows') services = services.flatMap(expandPortions);
  const timed = services
    .map((service, index) => ({ service, index, at: boardTime(service, policy) }))
    .filter(({ at }) => at === undefined || at > now - policy.keepAfterMs);
  timed.sort((a, b) => {
    if (a.at === undefined && b.at === undefined) return a.index - b.index;
    if (a.at === undefined) return 1;
    if (b.at === undefined) return -1;
    return a.at - b.at || a.index - b.index;
  });
  return timed.map(({ service }) => service);
}

/**
 * The window of `eligible` services on show at step `step` (a counter the
 * player advances every `dwellMs`), after those the units before this one
 * show.
 */
export function windowOf(
  services: Service[],
  policy: SelectionPolicy,
  placement: Placement,
  step: number,
): { services: Service[]; page?: { index: number; count: number } } {
  const { size, mode } = policy.window;
  if (placement.skip) services = services.slice(placement.skip);
  const depth = Math.min(services.length, policy.window.depth ?? services.length);
  if (mode === 'top' || !placement.cycle || depth <= size) return { services: services.slice(0, size) };
  if (mode === 'rotate') {
    const start = step % depth;
    const out: Service[] = [];
    for (let i = 0; i < size; i++) out.push(services[(start + i) % depth]!);
    return { services: out, page: { index: start, count: depth } };
  }
  const count = Math.ceil(depth / size);
  const index = step % count;
  return { services: services.slice(index * size, Math.min(depth, (index + 1) * size)), page: { index, count } };
}

function noticeApplies(notice: Notice, placement: Placement): boolean {
  const scope = notice.scope?.platforms;
  if (!scope?.length || placement.platforms.length === 0) return true;
  return scope.some((platform) => placement.platforms.some((mine) => samePlatform(platform, mine)));
}

/** The whole pipeline: snapshot in, the view one display presents out. */
export function select(
  snapshot: BoardSnapshot | undefined,
  policy: SelectionPolicy,
  placement: Placement,
  now: number,
  step = 0,
): View {
  const all = snapshot ? eligible(snapshot, policy, placement, now) : [];
  const { services, page } = windowOf(all, policy, placement, step);
  return {
    now,
    timeZone: snapshot?.station?.timeZone ?? DEFAULT_TIME_ZONE,
    station: snapshot?.station,
    services,
    total: all.length,
    page,
    notices: (snapshot?.notices ?? []).filter((notice) => noticeApplies(notice, placement)),
    placement,
  };
}
