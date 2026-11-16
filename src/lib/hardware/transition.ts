import type { DotState } from './dot-matrix';

/**
 * How long after a change of content each dot is rewritten, in milliseconds.
 * This is where a display's character shows: a line swept character by
 * character, a wave from one corner, a whole panel at once.
 *
 * `turn` is the module's place in the queue: its index, or, for a display
 * that only rewrites what changed, its index among the modules that changed.
 */
export type DotDelay = (turn: number, col: number, row: number) => number;

export interface DotTransitionOptions {
  /**
   * The display rewrites only the modules whose content changed, and spends
   * no time on the others. A sign that updates one digit does so at once
   * instead of waiting for a sweep to reach it.
   */
  differential?: boolean;
}

/**
 * The state a dot matrix shows on its way from one content to the next. Each
 * dot keeps showing what it showed until its turn comes. Time is whatever the
 * caller passes (the shared ticker), and the clock of a change starts at the
 * first frame drawn after it, so that nothing is skipped while a page loads.
 */
export class DotTransition {
  private from: DotState;
  private to: DotState;
  private shown: DotState;
  private startedAt: number | undefined;
  private running = false;
  private duration = 0;
  /** Each module's place in the queue of the change under way. */
  private turns: number[];

  constructor(
    private readonly modules: number,
    private readonly cols: number,
    private readonly rows: number,
    private readonly delay: DotDelay,
    private readonly options: DotTransitionOptions = {},
  ) {
    const blank: DotState = Array.from({ length: modules }, () => Array.from({ length: cols }, () => 0));
    this.from = this.to = this.shown = blank;
    this.turns = Array.from({ length: modules }, (_, m) => m);
  }

  private differs(module: number): boolean {
    for (let c = 0; c < this.cols; c++) {
      if ((this.from[module]?.[c] ?? 0) !== (this.to[module]?.[c] ?? 0)) return true;
    }
    return false;
  }

  /** Queues the modules of the change from `from` to `to`, and works out how long it takes. */
  private plan(): void {
    let queued = 0;
    let longest = 0;
    for (let m = 0; m < this.modules; m++) {
      const changed = this.differs(m);
      this.turns[m] = this.options.differential ? queued : m;
      if (!changed) continue;
      queued++;
      for (let c = 0; c < this.cols; c++) {
        for (let r = 0; r < this.rows; r++) longest = Math.max(longest, this.delay(this.turns[m]!, c, r));
      }
    }
    this.duration = longest;
  }

  /** True once every dot shows the latest content. */
  get settled(): boolean {
    return !this.running;
  }

  /** New content, reached dot by dot from whatever is showing right now. */
  retarget(target: DotState): void {
    this.from = this.shown;
    this.to = target;
    this.startedAt = undefined;
    this.running = true;
    this.plan();
  }

  /** New content, shown at once. */
  jump(target: DotState): void {
    this.from = this.to = this.shown = target;
    this.running = false;
  }

  /** What to show at `now`. */
  at(now: number): DotState {
    if (!this.running) return this.to;
    if (this.startedAt === undefined) this.startedAt = now;
    const elapsed = now - this.startedAt;
    if (elapsed >= this.duration) {
      this.jump(this.to);
      return this.to;
    }
    const out: DotState = [];
    for (let m = 0; m < this.modules; m++) {
      const columns: number[] = [];
      for (let c = 0; c < this.cols; c++) {
        const before = this.from[m]?.[c] ?? 0;
        const after = this.to[m]?.[c] ?? 0;
        let byte = before;
        if (before !== after) {
          for (let r = 0; r < this.rows; r++) {
            if (elapsed >= this.delay(this.turns[m]!, c, r)) byte = (byte & ~(1 << r)) | (after & (1 << r));
          }
        }
        columns.push(byte);
      }
      out.push(columns);
    }
    this.shown = out;
    return out;
  }
}
