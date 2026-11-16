import type { Attribution, BoardSnapshot, Clock } from '../model';
import type { Lookup, ParamSchema, Values } from '../params';

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
  kind: 'manual' | 'simulated' | 'live';
  attribution?: Attribution;
  config: ParamSchema;
  load(): Promise<SourceModule>;
}
