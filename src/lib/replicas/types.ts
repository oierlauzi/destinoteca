import type { SelectionPolicy, View } from '../model';
import type { ParamSchema, Values } from '../params';
import type { Ticker } from '../player/ticker';
import type { Needs } from '../sources/types';

/**
 * What a display shows at one moment, in its own terms: for a text sign, the
 * strings its controller would have sent it. Typing one directly is the
 * "texto libre" mode.
 */
export type Frame = Values;

/** One frame, or several shown in turn (languages, pages). */
export type Presentation<F extends Frame = Frame> = F | { pages: { frame: F; holdMs: number }[] };

export interface ReplicaEnv {
  ticker: Ticker;
}

export interface MountedReplica<F extends Frame = Frame, O extends Values = Values> {
  setFrame(frame: F): void;
  setOptions(options: O): void;
  destroy(): void;
}

/** The code of a replica, loaded only when it is shown. */
export interface ReplicaImpl<F extends Frame = Frame, O extends Values = Values> {
  /** The view a selection policy produced, as this display would show it. */
  present(view: View, options: O): Presentation<F>;
  /** What the display shows with nothing to announce. */
  blank(view: View, options: O): F;
  /** A complete, standalone SVG document of one frame, with nothing moving. */
  renderToString(frame: F, options: O): string;
  /** Draws into `host` and keeps it up to date. */
  mount(host: Element, options: O, env: ReplicaEnv): MountedReplica<F, O>;
}

/** What the site knows about a replica without loading it. */
export interface ReplicaDef {
  /** Appears in embed URLs on other people's pages: never rename. */
  id: string;
  /** Intrinsic size, for layout before the code arrives. */
  viewBox: { width: number; height: number };
  /** The size with these options, for a display whose shape depends on them (boards hung together). Defaults to `viewBox`. */
  size?(options: Values): { width: number; height: number };
  /** Settings of a source that suit this display better than the source's own defaults, by source id. */
  sourceDefaults?: Record<string, Values>;
  /** `none` is a display that needs no data, such as a clock. */
  accepts: 'board' | 'none';
  needs: Needs;
  /** Appearance and defects. */
  options: ParamSchema;
  /** The frame's fields, when it makes sense to type one by hand. */
  frame?: ParamSchema;
  selection(options: Values): SelectionPolicy;
  load(): Promise<ReplicaImpl>;
}
