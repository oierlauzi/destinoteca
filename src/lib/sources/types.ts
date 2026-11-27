import type { Attribution, BoardSnapshot, Clock } from '../model';
import type { Lookup, ParamSchema, Values } from '../params';

/**
 * A kind of data a source can know and a display can read. It is what decides
 * which sources suit a display: a board announces trains (`services`), a clock
 * shows only the time of day (`time`), so a train feed is no use to a clock
 * and the time can come from anywhere.
 *
 * Settings can be tagged with it too (`about` in a ParamSchema field), so that
 * a source serving a display that reads part of what it knows asks only for
 * the part that display can use.
 */
export type DataKind = 'services' | 'time';

/** Whether what one side offers and the other reads meet at all. */
export const sharesData = (a: readonly DataKind[], b: readonly DataKind[]): boolean => a.some((kind) => b.includes(kind));

/** `idle` before start, `nodata` when connected but the station sends nothing. */
export type SourceStatus = 'idle' | 'connecting' | 'live' | 'nodata' | 'error';

/** What the displays on a page can actually use, so a source does no more work than that. */
export interface Needs {
  /** How many services are on show at once. */
  services: number;
  /** Whether any display shows calling points. */
  calls: boolean;
}

export interface SourceEnv {
  clock: Clock;
}

export interface SourceHandlers {
  /** A complete, fresh picture of the station. Never a delta. */
  onSnapshot(snapshot: BoardSnapshot): void;
  onStatus(status: SourceStatus, detail?: string): void;
  /**
   * What time it is where the data comes from. A source that knows (a server
   * clock, a hand-set board time) says so, and the display's whole notion of
   * "now" follows it instead of the viewer's device, so that a countdown, a
   * clock face and the data always agree. `frozen` stops time there.
   */
  onTime?(now: number, frozen?: boolean): void;
}

export interface SourceInstance {
  start(handlers: SourceHandlers): void;
  stop(): void;
  /**
   * The services currently on show, soonest first. Lets a source spend a
   * limited budget (mitren.app follows a handful of trains for their calling
   * points) on what is being looked at.
   */
  focus?(serviceIds: string[], needs: Needs): void;
}

/** The code of a source, loaded only when the source is used. */
export interface SourceModule {
  create(config: Values, env: SourceEnv): SourceInstance;
  /** Searches behind the `lookup` fields of the config schema, by name. */
  lookups?: Record<string, Lookup>;
}

/** What the site knows about a source without loading it. */
export interface SourceDef {
  id: string;
  /** i18n keys. */
  label: string;
  description?: string;
  /** `device` is the viewer's own machine, with nobody to connect to. */
  kind: 'manual' | 'simulated' | 'live' | 'device';
  /**
   * What this source is chosen for. The time a feed reports along the way is
   * not an offer of `time`: nobody picks a train feed to know the hour.
   */
  provides: readonly DataKind[];
  attribution?: Attribution;
  /**
   * i18n key of a line crediting where the data comes from, shown under the
   * source's settings. It is the site's own text, with links in it.
   */
  credit?: string;
  config: ParamSchema;
  load(): Promise<SourceModule>;
}
