/**
 * The one animation clock shared by everything on a page. Displays subscribe
 * to it instead of owning timers, so that motion can be paused when the tab
 * is hidden, frozen for an export, or stepped by hand in a test.
 *
 * Callbacks get a monotonic time in milliseconds.
 */
export interface Ticker {
  subscribe(fn: (now: number) => void): () => void;
}

/** Driven by requestAnimationFrame; stops asking for frames while nobody listens or the page is hidden. */
export class FrameTicker implements Ticker {
  private readonly listeners = new Set<(now: number) => void>();
  private handle: number | undefined;

  subscribe(fn: (now: number) => void): () => void {
    this.listeners.add(fn);
    this.schedule();
    return () => {
      this.listeners.delete(fn);
    };
  }

  private schedule(): void {
    if (this.handle !== undefined || this.listeners.size === 0) return;
    this.handle = requestAnimationFrame((now) => {
      this.handle = undefined;
      for (const fn of [...this.listeners]) fn(now);
      this.schedule();
    });
  }
}

/** Advanced by hand. For tests and for rendering one exact instant. */
export class ManualTicker implements Ticker {
  private readonly listeners = new Set<(now: number) => void>();
  private at = 0;

  subscribe(fn: (now: number) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  advance(ms: number): void {
    this.at += ms;
    for (const fn of [...this.listeners]) fn(this.at);
  }
}
