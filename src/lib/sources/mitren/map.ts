/**
 * mitren.app's messages, read into the shared model.
 *
 * Field meanings are documented upstream in app/schemas/arrivals.py (board
 * rows) and app/schemas/train_detail.py (a train's stops). Only what is read
 * here is typed; anything else in a message is ignored.
 */
import type { Call, Place, Platform, Service } from '../../model';
import { findStation, fold, placeForName, stationLadder, stationPlace, TIME_ZONE, type Station } from './stations';

/** One row of an `arrivals_update`. */
export interface MitrenRow {
  /** Seconds. The delay is already folded in. */
  epoch?: number | string;
  display_destination_name?: string;
  destination_name?: string;
  short_name?: string;
  service_state?: string;
  is_realtime?: boolean;
  is_origin?: boolean;
  /** `at_station` or `arriving`, from positive evidence only. */
  presence?: string | null;
  platform?: { value?: string | number | null; confirmed?: boolean; pair?: (string | number)[] | null } | null;
  line?: { short_name?: string; color_bg?: string; color_fg?: string } | null;
  identity?: { public_number?: string | number | null; technical_id?: string | number | null } | null;
}

export interface MitrenArrivals {
  type?: string;
  station_id?: string | number;
  arrivals?: (MitrenRow | null)[];
}

/** One stop of a `train_update`. */
export interface MitrenStop {
  station_id?: string | number;
  stop_id?: string | number;
  name?: string;
  short_name?: string;
  skipped_side?: unknown;
  times?: { display?: { service_state?: string } };
}

export interface MitrenTrain {
  stops?: (MitrenStop | null)[];
}

/** What a mapped service keeps about its origin, under `ext.mitren`. */
export interface MitrenExt {
  /** The id its own channel is keyed by. Only a train already running has one. */
  technicalId: string | null;
  /** Whether the time is live or straight from the timetable. */
  realtime: boolean;
}

export function mitrenExt(service: Service): MitrenExt | undefined {
  return service.ext?.['mitren'] as MitrenExt | undefined;
}

const OPERATOR = { id: 'renfe', name: 'Renfe' } as const;
const PRODUCT = { id: 'cercanias', name: 'Cercanías', shortName: 'CERC', category: 'commuter' } as const;

function mapPlatform(raw: MitrenRow['platform']): Platform | undefined {
  if (!raw) return undefined;
  const value = raw.value == null ? '' : String(raw.value).trim();
  const pair = (raw.pair ?? []).map(String).filter(Boolean);
  if (!value && pair.length === 0) return undefined;
  const platform: Platform = { confirmed: !!(raw.confirmed && value) };
  if (value) platform.name = value;
  // mitren.app also predicts a platform from habit, sometimes as the two faces
  // of an island. A real sign shows neither; a list may, marked as a guess.
  if (pair.length) platform.candidates = pair;
  return platform;
}

/**
 * The services of one `arrivals_update`: the station's next trains (up to 20,
 * at most 3 per line), realtime where the server has it and timetable
 * otherwise. Null when the message carries no board at all.
 *
 * It is an arrivals board, so trains ending their run here are on it too, and
 * so are cancelled ones. Both are kept and marked; whether a display shows
 * them is its selection policy's business.
 */
export function mapArrivals(msg: MitrenArrivals, here: Station | undefined, network: string): Service[] | null {
  if (!Array.isArray(msg.arrivals)) return null;
  const ownNames = new Set(here ? stationLadder(here).map(fold) : []);
  const taken = new Set<string>();
  const services: Service[] = [];
  for (const row of msg.arrivals) {
    if (!row) continue;
    const epoch = Number(row.epoch);
    if (!Number.isFinite(epoch) || epoch <= 0) continue;
    const destination = row.display_destination_name || row.destination_name;
    if (!destination) continue;

    const identity = row.identity ?? {};
    const number = identity.public_number == null ? '' : String(identity.public_number);
    const technical = identity.technical_id == null ? '' : String(identity.technical_id);
    const realtime = !!row.is_realtime;
    const lineName = row.line?.short_name || row.short_name || '';

    // The public number outlives the switch from timetable to live, which the
    // technical id does not, so it makes the steadier key.
    let id = number
      ? `${number}@${fold(destination)}`
      : technical
        ? `t:${technical}`
        : `${lineName}:${fold(destination)}:${epoch}`;
    for (let n = 2; taken.has(id); n++) id = `${id.replace(/#\d+$/, '')}#${n}`;
    taken.add(id);

    const at = epoch * 1000;
    const service: Service = {
      id,
      mode: 'rail',
      operator: { ...OPERATOR },
      product: { ...PRODUCT },
      destination: placeForName(String(destination), network),
      here: {
        activity: ownNames.has(fold(destination)) ? 'terminus' : row.is_origin ? 'origin' : 'calls',
        // The board gives one time with the delay folded in and no plan to
        // compare it with, so the other reading is left unknown, not invented.
        departure: realtime ? { estimated: at } : { scheduled: at },
      },
      ext: {
        mitren: {
          // A timetabled row carries a locator in this field instead, which
          // no train channel answers to.
          technicalId: realtime && technical ? technical : null,
          realtime,
        } satisfies MitrenExt,
      },
    };
    if (lineName) {
      service.line = { name: lineName };
      if (row.line?.color_bg) service.line.color = row.line.color_bg;
      if (row.line?.color_fg) service.line.textColor = row.line.color_fg;
    }
    if (number) service.number = number;
    const platform = mapPlatform(row.platform);
    if (platform) service.here!.platform = platform;
    if (row.service_state === 'canceled') service.status = 'cancelled';
    if (row.presence === 'at_station') service.presence = 'at-stop';
    else if (row.presence === 'arriving') service.presence = 'approaching';
    services.push(service);
  }
  return services;
}

function stopPlace(stop: MitrenStop, network: string): Place | undefined {
  const code = stop.station_id == null ? '' : String(stop.station_id);
  const listed = code ? findStation(network, code) : undefined;
  const name = stop.name || listed?.name || stop.short_name;
  if (!name) return undefined;
  const place: Place = listed ? stationPlace(listed) : { name, country: 'es', timeZone: TIME_ZONE };
  place.name = name;
  // mitren.app's own short form for this stop comes first: it is what its
  // board would announce.
  const shorter = [stop.short_name, ...(place.names ?? [])].filter(
    (form, i, all): form is string => !!form && form !== name && all.indexOf(form) === i,
  );
  if (shorter.length) place.names = shorter;
  else delete place.names;
  if (code && !listed) {
    place.id = `${network}/${code}`;
    place.codes = { adif: code };
  }
  return place;
}

/**
 * The calls a train still has to make after `station`, from a train_update's
 * `data.stops`. Skipped and cancelled stops are left out. Null when the
 * station is not on the train's list, which means nothing trustworthy can be
 * said.
 */
export function remainingStops(data: MitrenTrain | null | undefined, station: string, network: string): Call[] | null {
  const stops = data && Array.isArray(data.stops) ? data.stops : null;
  if (!stops) return null;
  const at = stops.findIndex((stop) => !!stop && (String(stop.station_id) === station || String(stop.stop_id) === station));
  if (at < 0) return null;
  const calls: Call[] = [];
  for (const stop of stops.slice(at + 1)) {
    if (!stop) continue;
    const state = stop.times?.display?.service_state;
    if (stop.skipped_side || state === 'skipped' || state === 'canceled') continue;
    const place = stopPlace(stop, network);
    if (place) calls.push({ place });
  }
  return calls;
}
