/**
 * ADIF's boards, read into the shared model.
 *
 * One ReceiveMessage from the hub carries a station's whole board: every
 * train of the hours ahead (the whole night and morning at Chamartín, some
 * 300 of them), each with its calls before and after, and a table naming
 * every station they touch. Field meanings below were read off recorded
 * boards and off ADIF's own display code (adif_infotren_vista.js on
 * info.adif.es), which is the reference for what a screen shows. Only what
 * is read here is typed.
 */
import type { Call, EventTime, Line, Notice, Org, Place, Platform, Portion, Product, Service, Text } from '../../model';
import { findStation, normalCode, stationPlace, TIME_ZONE } from './stations';

/** One identity a train runs under: a product and its numbers. */
export interface AdifCommercialId {
  numbers?: string[];
  /** `AVE`, `REG`, `C04CERMAD` (line C-4 of Cercanías Madrid), `R2SRODBCN`… */
  product?: string;
  /**
   * `origin`: not valid for the journey before this station, so an arrivals
   * board leaves it out. `destination`: not valid after it, so a departures
   * board leaves it out. `commercial` and `none` are shown either way.
   */
  restricted?: string;
}

export interface AdifStop {
  code?: string | number;
  /** ISO 8601, from the timetable. */
  arrival_time?: string;
  /** Minutes. */
  delay_in?: number | null;
}

export interface AdifTrain {
  id?: string | number;
  /** `scheduled` (not running yet), `running` or `cancelled`. */
  status?: string;
  commercial_id?: AdifCommercialId[];
  /** `C` Cercanías, `R` regional and media distancia, `L` larga distancia. */
  traffic_type?: string;
  company?: string;
  /** `origin`, `intermediate` or `destination`, seen from this station. */
  class_stop?: string;
  /** ISO 8601, from the timetable: the delay is not in them. */
  arrival_time?: string;
  departure_time?: string;
  /** Minutes. Negative when running early. */
  delay_in?: number | null;
  delay_out?: number | null;
  /** Empty until the platform is assigned. `platform_in` is the one it arrives at. */
  platform?: string | null;
  platform_in?: string | null;
  /** What the platform will probably be, before it is assigned: `10 · 11`, or a range `6 - 13`. */
  platform_preview?: string | null;
  platform_preview_in?: string | null;
  /** Where it comes from and goes to. More than one when a screen shows two in turn. */
  origins?: { code?: string | number; line?: string }[];
  destinations?: { code?: string | number; line?: string }[];
  journey_stops_origin?: AdifStop[];
  journey_stops_destination?: AdifStop[];
  observation?: string | null;
  /** One list of cars per coupled unit. */
  composition?: unknown[][] | null;
}

export interface AdifAlert {
  id?: string;
  level?: string;
  /** By ADIF's language code: `ESP`, `ENG`, `CAT`… */
  message?: Record<string, { header?: string; description?: string } | undefined>;
  filter?: { traffic_types?: string[]; platforms?: string[] };
}

export interface AdifBoard {
  station_settings?: { code?: string | number; name?: string };
  trains?: (AdifTrain | null)[];
  /** Every station the trains touch, by code without its leading zero. Names longest first. */
  stations?: Record<string, { name?: string[] | string } | undefined>;
  multimedia_info?: { line_colors?: Record<string, string> };
  station_alerts?: (AdifAlert | null)[];
}

/** What a mapped service keeps about its origin, under `ext.adif`. */
export interface AdifExt {
  /** ADIF's id of the train's run. */
  id: string;
  /** `C`, `R` or `L`. */
  traffic: string;
  /** Every product code it runs under here. */
  products: string[];
}

export function adifExt(service: Service): AdifExt | undefined {
  return service.ext?.['adif'] as AdifExt | undefined;
}

/** The three kinds of traffic ADIF tells apart. */
export const TRAFFIC_TYPES = ['C', 'R', 'L'] as const;

// --- Who runs it, and as what --------------------------------------------------------

const OPERATORS: Record<string, Org> = {
  renfe: { id: 'renfe', name: 'Renfe' },
  rf: { id: 'renfe', name: 'Renfe' },
  iryo: { id: 'iryo', name: 'IRYO' },
  ouigo: { id: 'ouigo', name: 'OUIGO' },
  fgc: { id: 'fgc', name: 'FGC' },
  cp: { id: 'cp', name: 'CP' },
};

export function operatorOf(company: string | undefined): Org | undefined {
  const key = String(company ?? '').trim();
  if (!key) return undefined;
  return { ...(OPERATORS[key.toLowerCase()] ?? { name: key }) };
}

const brand = (id: string, name: string, category: Product['category'], shortName = name): Product => ({ id, name, shortName, category });

/** Products named by their code alone. The ids are those the demo board uses for the same brands. */
const PRODUCTS: Record<string, Product> = {
  AVE: brand('ave', 'AVE', 'high-speed'),
  AVLO: brand('avlo', 'AVLO', 'high-speed'),
  AVANT: brand('avant', 'AVANT', 'high-speed'),
  AVANTEXP: brand('avant-expres', 'AVANT EXP', 'high-speed', 'AVANT'),
  ALVIA: brand('alvia', 'ALVIA', 'long-distance'),
  EUROMED: brand('euromed', 'EUROMED', 'long-distance'),
  ICITY: brand('intercity', 'INTERCITY', 'long-distance', 'INTCITY'),
  CELTA: brand('celta', 'CELTA', 'long-distance'),
  TRENHOTEL: brand('trenhotel', 'TRENHOTEL', 'night'),
  IRYO: brand('iryo', 'IRYO', 'high-speed'),
  OUIGO: brand('ouigo', 'OUIGO', 'high-speed'),
  INOUI: brand('tgv-inoui', 'TGV INOUI', 'high-speed', 'INOUI'),
  MD: brand('md', 'MD', 'regional'),
  REG: brand('regional', 'REGIONAL', 'regional', 'REG'),
  REGEXP: brand('regional-expres', 'REG.EXP.', 'regional', 'REG.EXP'),
  REGCP: brand('regional-cp', 'REGIONAL', 'regional', 'REG'),
  TURISRF: brand('turistico', 'TREN TURÍSTICO', 'tourist', 'TURIST'),
  CERCAN: brand('cercanias', 'Cercanías', 'commuter', 'CERC'),
};

/** The services of a line product, by its middle part. */
const LINE_KINDS: Record<string, (network: string) => Product> = {
  CER: () => brand('cercanias', 'Cercanías', 'commuter', 'CERC'),
  // Cercanías Bilbao and San Sebastián, in Basque.
  ALD: () => brand('cercanias', 'Cercanías', 'commuter', 'CERC'),
  // Cercanías Asturias' and Madrid's semi-fast trains.
  CIV: () => brand('civis', 'Civis', 'commuter'),
  ROD: (network) => (network === 'VAL' ? brand('rodalia', 'Rodalia', 'commuter') : brand('rodalies', 'Rodalies', 'commuter')),
  REG: () => brand('regional', 'REGIONAL', 'regional', 'REG'),
  REX: () => brand('regional-expres', 'REG.EXP.', 'regional', 'REG.EXP'),
  MD: () => brand('md', 'MD', 'regional'),
  TRA: () => brand('tren-tram', 'Tren-tram', 'commuter'),
  FGC: () => brand('fgc', 'FGC', 'regional'),
};

/**
 * A product code that names a line: `C04CERMAD` (C-4, Cercanías Madrid),
 * `C8BCIVMAD`, `R2SRODBCN` (R2 Sud, Rodalies de Catalunya), `R11MDCAT`,
 * `RL3REGLLE`, `RL1FGC`, `T01TRACAD`.
 */
const LINE_CODE = /^([A-Z]{1,2}?)(\d{1,2}[A-Z]?)(CER|ALD|CIV|ROD|REG|REX|MD|TRA|FGC)([A-Z]{3})?$/;

export interface ProductReading {
  product?: Product;
  line?: Line;
  /** Remarks it implies: a Civis is a semi-fast Cercanías. */
  flags?: string[];
}

/** What a product code says: the product, and the line where it names one. */
export function readProduct(code: string | undefined, colors: Record<string, string> = {}): ProductReading {
  const raw = String(code ?? '').trim().toUpperCase();
  if (!raw) return {};
  const named = PRODUCTS[raw];
  if (named) return { product: { ...named } };
  const match = LINE_CODE.exec(raw);
  if (!match) return { product: { id: raw.toLowerCase(), name: raw, shortName: raw } };
  const [, prefix = '', number = '', kind = '', network = ''] = match;
  const digits = number.replace(/^0+(?=\d)/, '');
  // Madrid, Bilbao and the rest write their Cercanías lines with a hyphen
  // (C-4, T-1); Catalonia's lines are written without (R2S, RL3).
  const name = prefix === 'C' || prefix === 'T' ? `${prefix}-${digits}` : `${prefix}${digits}`;
  const line: Line = { id: raw, name };
  const color = colors[raw];
  if (color && /^#[0-9a-f]{6}$/i.test(color) && color.toUpperCase() !== '#FFFFFF') line.color = color;
  const reading: ProductReading = { product: LINE_KINDS[kind]!(network), line };
  if (kind === 'CIV') reading.flags = ['semi-fast'];
  return reading;
}

/**
 * The identities a board of this kind shows, as ADIF's own display picks
 * them: those restricted to the other side of the station are dropped (but
 * never all of them), and numbers of the same product are put together.
 */
export function identitiesFor(ids: AdifCommercialId[] | undefined, events: 'departures' | 'arrivals'): { product: string; numbers: string[] }[] {
  const all = (ids ?? []).filter((id): id is AdifCommercialId => !!id);
  const dropped = events === 'departures' ? 'destination' : 'origin';
  const kept = all.length > 1 ? all.filter((id) => id.restricted !== dropped) : all;
  const chosen = kept.length ? kept : all.slice(0, 1);
  const out: { product: string; numbers: string[] }[] = [];
  for (const id of chosen) {
    const product = String(id.product ?? '');
    const numbers = (id.numbers ?? []).map((n) => String(n).trim()).filter(Boolean);
    const same = out.find((entry) => entry.product === product);
    const into = same ?? { product, numbers: [] };
    for (const number of numbers) if (!into.numbers.includes(number)) into.numbers.push(number);
    if (!same) out.push(into);
  }
  return out;
}

// --- Places ----------------------------------------------------------------------------

/** ADIF's forms of a name, longest first, without one that only drops a space. */
export function nameLadder(forms: string[] | string | undefined): string[] {
  const list = (Array.isArray(forms) ? forms : forms ? [forms] : []).map((form) => String(form).trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const form of list) {
    const key = form.replace(/\s+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(form);
  }
  // Stable, so forms of the same length keep ADIF's order.
  return out.sort((a, b) => b.length - a.length);
}

/** The country of a station code: ADIF numbers French stations from 87 and Portuguese from 94, as the UIC does. */
function countryOf(code: string): string {
  if (/^87\d{3}$/.test(code)) return 'fr';
  if (/^94\d{3}$/.test(code)) return 'pt';
  return 'es';
}

/** Reads the places of one board, by code, with the board's own names first. */
export class PlaceBook {
  private readonly cache = new Map<string, Place | undefined>();

  constructor(private readonly names: AdifBoard['stations'] = {}) {}

  get(code: string | number | undefined | null): Place | undefined {
    const normal = normalCode(code);
    if (!normal) return undefined;
    if (this.cache.has(normal)) return this.cache.get(normal);
    const listed = findStation(normal);
    const entry = this.names?.[normal] ?? this.names?.[normal.replace(/^0+(?=\d)/, '')];
    const [name, ...names] = nameLadder(entry?.name);
    let place: Place | undefined;
    if (name) {
      place = { id: `adif/${normal}`, codes: { adif: normal }, name, country: countryOf(normal), timeZone: TIME_ZONE };
      if (names.length) place.names = names;
      if (listed?.town) place.town = listed.town;
    } else if (listed) {
      place = stationPlace(listed);
    }
    this.cache.set(normal, place);
    return place;
  }
}

// --- Times and platforms ---------------------------------------------------------------

function parseTime(value: string | undefined | null): number | undefined {
  if (!value) return undefined;
  const at = Date.parse(value);
  return Number.isFinite(at) ? at : undefined;
}

/**
 * The timetable time and, once there is something to go on, the expected
 * one: a train that is running, or one already known to be late or early
 * before it sets off. A train that has not started yet with no delay on it
 * has no estimate, which is not the same as being on time.
 */
function eventTime(value: string | undefined | null, delay: number | null | undefined, live: boolean): EventTime | undefined {
  const scheduled = parseTime(value);
  if (scheduled === undefined) return undefined;
  const minutes = Number(delay);
  const known = Number.isFinite(minutes) && (live || minutes !== 0);
  return known ? { scheduled, estimated: scheduled + minutes * 60000 } : { scheduled };
}

function readPlatform(assigned: string | null | undefined, preview: string | null | undefined): Platform | undefined {
  const name = String(assigned ?? '').trim();
  const hint = String(preview ?? '').trim();
  // "10 · 11" is the pair it usually takes; "6 - 13" only the range of
  // platforms it may use, which narrows nothing down for a passenger.
  const candidates = hint.includes('·')
    ? hint
        .split('·')
        .map((part) => part.trim())
        .filter(Boolean)
    : /^\w+$/.test(hint)
      ? [hint]
      : [];
  if (!name && candidates.length === 0) return undefined;
  const platform: Platform = { confirmed: !!name };
  if (name) platform.name = name;
  else platform.candidates = candidates;
  return platform;
}

/** Its free-text remarks, which ADIF sometimes repeats in one string. */
function remarksOf(observation: string | null | undefined): string[] {
  const parts = String(observation ?? '')
    .split(/\s{3,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.filter((part, i) => parts.indexOf(part) === i);
}

// --- Trains ------------------------------------------------------------------------------

/**
 * One row of the board as a Service, or undefined when it cannot be placed in
 * time.
 *
 * A train ADIF gives several destinations to (Bilbao and Irun, or Cercedilla
 * and then Segovia) is one Service with a portion per destination, which is
 * how ADIF's screens show it: one destination after the other. The board does
 * not say whether the train divides or runs on under another product, so the
 * portions carry nothing but the place.
 *
 * `station` is the board's own code: the calls of a train starting here
 * begin with this station, which is not a call before it.
 */
export function mapTrain(train: AdifTrain, places: PlaceBook, colors: Record<string, string> = {}, station = ''): Service | undefined {
  const role = train.class_stop;
  const activity: NonNullable<Service['here']>['activity'] = role === 'origin' ? 'origin' : role === 'destination' ? 'terminus' : 'calls';
  const live = train.status === 'running';
  const arrival = activity === 'origin' ? undefined : eventTime(train.arrival_time, train.delay_in, live);
  const departure = activity === 'terminus' ? undefined : eventTime(train.departure_time, train.delay_out, live);
  if (!arrival && !departure) return undefined;

  const identities = identitiesFor(train.commercial_id, activity === 'terminus' ? 'arrivals' : 'departures');
  const numbers = identities.flatMap((identity) => identity.numbers);
  const readings = identities.map((identity) => readProduct(identity.product, colors));
  const first = readings[0] ?? {};
  const lined = readings.find((reading) => reading.line) ?? {};

  const origins = (train.origins ?? []).map((origin) => places.get(origin?.code)).filter((place): place is Place => !!place);
  const destinations = (train.destinations ?? []).map((destination) => places.get(destination?.code)).filter((place): place is Place => !!place);

  const id = String(train.id ?? '').trim() || `${numbers[0] ?? '?'}@${departure?.scheduled ?? arrival?.scheduled}`;
  const service: Service = { id, mode: 'rail' };
  const operator = operatorOf(train.company);
  if (operator) service.operator = operator;
  if (first.product) service.product = first.product;
  if (lined.line) service.line = { ...lined.line };
  if (numbers[0]) service.number = numbers[0];
  if (numbers.length > 1) service.aliases = numbers.slice(1).map((number) => ({ number }));
  if (origins[0]) service.origin = origins[0];
  if (destinations[0]) service.destination = destinations[0];
  if (destinations.length > 1 || origins.length > 1) {
    const count = Math.max(destinations.length, origins.length);
    const portions: Portion[] = [];
    for (let i = 0; i < count; i++) {
      const portion: Portion = {};
      if (destinations.length > 1 && destinations[i]) portion.destination = destinations[i];
      if (origins.length > 1 && origins[i]) portion.origin = origins[i];
      portions.push(portion);
    }
    service.portions = portions;
  }

  const elsewhere = (stop: AdifStop | null | undefined): stop is AdifStop => !!stop && (!station || normalCode(stop.code) !== station);
  const before: Call[] = [];
  for (const stop of (train.journey_stops_origin ?? []).filter(elsewhere)) {
    const place = places.get(stop.code);
    if (place) before.push({ place });
  }
  if (before.length) service.callsBefore = before;
  const after: Call[] = [];
  for (const stop of (train.journey_stops_destination ?? []).filter(elsewhere)) {
    const place = places.get(stop.code);
    if (!place) continue;
    const call: Call = { place };
    const at = eventTime(stop.arrival_time, stop.delay_in, live);
    if (at) call.arrival = at;
    after.push(call);
  }
  if (after.length) service.callsAfter = after;

  const here: NonNullable<Service['here']> = { activity };
  if (arrival) here.arrival = arrival;
  if (departure) here.departure = departure;
  const platform =
    activity === 'terminus'
      ? readPlatform(train.platform_in || train.platform, train.platform_preview_in || train.platform_preview)
      : readPlatform(train.platform || train.platform_in, train.platform_preview || train.platform_preview_in);
  if (platform) here.platform = platform;
  service.here = here;

  if (train.status === 'cancelled') service.status = 'cancelled';
  const flags = readings.flatMap((reading) => reading.flags ?? []);
  if (flags.length) service.flags = [...new Set(flags)];
  const remarks = remarksOf(train.observation);
  if (remarks.length) service.remarks = remarks;
  const units = Array.isArray(train.composition) ? train.composition.filter(Array.isArray).length : 0;
  if (units > 0) service.formation = { units };

  service.ext = {
    adif: {
      id: String(train.id ?? ''),
      traffic: String(train.traffic_type ?? ''),
      products: identities.map((identity) => identity.product).filter(Boolean),
    } satisfies AdifExt,
  };
  return service;
}

// --- Notices -----------------------------------------------------------------------------

const LANGUAGES: Record<string, string> = { ESP: 'es', ENG: 'en', CAT: 'ca', VAL: 'ca', EUS: 'eu', GAL: 'gl', FRA: 'fr', POR: 'pt' };

export function mapAlert(alert: AdifAlert): Notice | undefined {
  const texts: Record<string, string> = {};
  for (const [language, message] of Object.entries(alert.message ?? {})) {
    const body = String(message?.description || message?.header || '').trim();
    if (body) texts[LANGUAGES[language] ?? language.toLowerCase()] = body;
  }
  const languages = Object.keys(texts);
  if (languages.length === 0) return undefined;
  const text: Text = languages.length === 1 ? texts[languages[0]!]! : texts;
  const level = String(alert.level ?? '').toLowerCase();
  const notice: Notice = { text, severity: level === 'info' ? 'info' : level === 'warning' ? 'warning' : 'disruption' };
  const platforms = (alert.filter?.platforms ?? []).map(String).filter(Boolean);
  if (platforms.length) notice.scope = { platforms };
  return notice;
}

// --- The board -----------------------------------------------------------------------------

export interface MappedBoard {
  station?: Place;
  services: Service[];
  notices: Notice[];
}

/**
 * A whole board. `traffic` keeps only the kinds of train wanted (all three
 * when empty), and the alerts addressed to them. Null when the message
 * carries no board at all.
 *
 * Trains ending here are kept and marked, and so are cancelled ones: whether
 * a display shows them is its selection policy's business.
 */
export function mapBoard(board: AdifBoard, traffic: readonly string[] = []): MappedBoard | null {
  if (!board || typeof board !== 'object' || !Array.isArray(board.trains)) return null;
  const wanted = (type: string | undefined): boolean => traffic.length === 0 || traffic.includes(String(type ?? ''));
  const places = new PlaceBook(board.stations ?? {});
  const colors = board.multimedia_info?.line_colors ?? {};
  const settings = board.station_settings;
  const code = normalCode(settings?.code);
  const services: Service[] = [];
  const taken = new Set<string>();
  for (const train of board.trains) {
    if (!train || !wanted(train.traffic_type)) continue;
    const service = mapTrain(train, places, colors, code);
    if (!service) continue;
    let id = service.id;
    for (let n = 2; taken.has(id); n++) id = `${service.id}#${n}`;
    taken.add(id);
    service.id = id;
    services.push(service);
  }
  const notices: Notice[] = [];
  for (const alert of board.station_alerts ?? []) {
    if (!alert) continue;
    const types = alert.filter?.traffic_types ?? [];
    if (traffic.length && types.length && !types.some((type) => traffic.includes(type))) continue;
    const notice = mapAlert(alert);
    if (notice) notices.push(notice);
  }
  const listed = code ? findStation(code) : undefined;
  const station = listed
    ? stationPlace(listed)
    : settings?.name
      ? { id: `adif/${code}`, codes: { adif: code }, name: String(settings.name), country: 'es', timeZone: TIME_ZONE }
      : undefined;
  return { ...(station ? { station } : {}), services, notices };
}
