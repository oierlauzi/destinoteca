/**
 * The shared data model between data sources and replicas.
 *
 * A source fills in what it knows; a replica shows what it can. Hence almost
 * every field is optional, and nothing here is shaped after one particular
 * sign or one particular feed. Times are epoch milliseconds.
 */

/** Plain text, or the same text per language code (es, ca, eu, gl, en...). */
export type Text = string | Record<string, string>;

/** A company: a railway operator, an airline, an infrastructure manager. */
export interface Org {
  /** Shared vocabulary id (`renfe`, `adif`...), so logos match across sources. */
  id?: string;
  name: string;
  shortName?: string;
}

/** The commercial service type: Cercanías, AVE, Alvia, Media Distancia... */
export interface Product {
  id?: string;
  name: Text;
  shortName?: string;
  category?: 'commuter' | 'regional' | 'long-distance' | 'high-speed' | 'night' | 'tourist' | 'freight' | 'other';
}

export interface Line {
  id?: string;
  /** As printed: `C-5`, `R4`, `L1`. */
  name: string;
  color?: string;
  textColor?: string;
}

export interface Place {
  id?: string;
  /** Codes by scheme: `adif`, `uic`, `iata`... */
  codes?: Record<string, string>;
  name: string;
  /**
   * The same name in progressively shorter forms, longest first. A narrow sign
   * takes the longest one that fits rather than inventing an abbreviation.
   */
  names?: string[];
  localized?: Record<string, { name: string; names?: string[] }>;
  town?: string;
  /** ISO 3166-1 alpha-2, lower case. */
  country?: string;
  /** IANA zone. Lives on the place, not on the viewer's browser. */
  timeZone?: string;
}

/** One event seen three ways. `bestTime()` picks the most informed one. */
export interface EventTime {
  scheduled?: number;
  estimated?: number;
  actual?: number;
}

export interface Platform {
  name?: string;
  /** False while it is only a prediction. Real signs show confirmed platforms only. */
  confirmed?: boolean;
  /** The platform it was moved from, on a platform change. */
  previous?: string;
  /** Unconfirmed alternatives, e.g. the two faces of an island. */
  candidates?: string[];
}

export interface Call {
  place: Place;
  arrival?: EventTime;
  departure?: EventTime;
  platform?: Platform;
  status?: 'skipped' | 'cancelled';
}

export interface Car {
  number?: string;
  class?: string;
  sector?: string;
  features?: string[];
}

export interface Formation {
  /** Number of coupled units. */
  units?: number;
  length?: 'short' | 'long';
  cars?: Car[];
}

export type ServiceStatus = 'scheduled' | 'on-time' | 'delayed' | 'cancelled' | 'diverted' | 'replaced';

/**
 * One part of a train that divides on the way, or that was joined from several
 * origins. It states only what differs from the Service it belongs to; use
 * `portionsOf()` to read portions with the shared fields filled in.
 */
export interface Portion {
  id?: string;
  number?: string;
  product?: Product;
  operator?: Org;
  origin?: Place;
  destination?: Place;
  via?: Place[];
  headsign?: Text;
  callsBefore?: Call[];
  callsAfter?: Call[];
  /** Where this portion leaves the rest of the train. */
  dividesAt?: Place;
  /** Where this portion was attached to the rest of the train. */
  joinsAt?: Place;
  position?: 'front' | 'middle' | 'rear';
  sector?: string;
  formation?: Formation;
  /** One portion can be cancelled on its own. */
  status?: ServiceStatus;
}

/** What a service does at the board's own station. */
export interface Here {
  /** `passes` is a train that runs through without stopping ("SIN PARADA"). */
  activity?: 'calls' | 'passes' | 'origin' | 'terminus' | 'no-boarding';
  arrival?: EventTime;
  departure?: EventTime;
  /** Platform, or gate. */
  platform?: Platform;
  sector?: string;
  /** Anything else a passenger is sent to: check-in desk, belt, terminal. */
  allocations?: { kind: string; name: string }[];
}

/**
 * One train (or flight, or bus) as seen from one station. A train that divides
 * later is still one Service here, with `portions`.
 */
export interface Service {
  /** Stable within its source. The only required field. */
  id: string;
  mode?: 'rail' | 'metro' | 'tram' | 'bus' | 'air' | 'ferry';
  operator?: Org;
  product?: Product;
  line?: Line;
  /** Train or flight number. */
  number?: string;
  /** Codeshares, double numbering. */
  aliases?: { number: string; operator?: Org }[];
  /** The text the operator wants on the board, when a source has one. */
  headsign?: Text;
  origin?: Place;
  destination?: Place;
  via?: Place[];
  /** Calls before and after this station, in order. */
  callsBefore?: Call[];
  callsAfter?: Call[];
  portions?: Portion[];
  /**
   * Set to the same value on services that a source lists separately but that
   * run coupled through this station. `groupCoupled()` folds them into one.
   */
  coupling?: string;
  here?: Here;
  status?: ServiceStatus;
  /** Where the vehicle is. */
  presence?: 'approaching' | 'at-stop' | 'departed';
  /** Where the passenger process is. */
  boarding?: 'not-open' | 'open' | 'final-call' | 'closed';
  formation?: Formation;
  /** Coded remarks: `semi-fast`, `short-train`, `last-service`, `accessible`... */
  flags?: string[];
  remarks?: Text[];
  /**
   * Source-specific extras, namespaced by source id. Replicas must not read
   * it: that would tie a display to a feed.
   */
  ext?: Record<string, unknown>;
}

export interface Notice {
  text: Text;
  severity?: 'info' | 'warning' | 'disruption';
  scope?: { platforms?: string[]; lines?: string[] };
}

export interface Attribution {
  name: string;
  url?: string;
  license?: string;
}

/**
 * Everything a source knows about one station right now: every upcoming
 * service on every platform. Narrowing it down to what one sign shows is the
 * player's job (see selection.ts), never the source's.
 */
export interface BoardSnapshot {
  /** Leaves room for `journey` snapshots (on-board displays) later. */
  kind: 'board';
  generatedAt: number;
  station?: Place;
  services: Service[];
  notices?: Notice[];
  attribution?: Attribution;
}
