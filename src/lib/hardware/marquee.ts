/**
 * A strip of columns seen through a window `cols` wide. A strip that fits is
 * centred and stands still; a longer one runs right to left and starts again
 * after `gap` blank columns.
 */
export function marqueeWindow(strip: number[], cols: number, offset: number, gap: number): number[] {
  const out: number[] = [];
  if (strip.length <= cols) {
    const pad = Math.floor((cols - strip.length) / 2);
    for (let c = 0; c < cols; c++) out.push(strip[c - pad] ?? 0);
    return out;
  }
  const total = strip.length + gap;
  const start = ((Math.floor(offset) % total) + total) % total;
  for (let c = 0; c < cols; c++) out.push(strip[(start + c) % total] ?? 0);
  return out;
}

/** Whether a strip is too long for its window and so has to move. */
export function scrolls(strip: number[], cols: number): boolean {
  return strip.length > cols;
}

/**
 * Keeps track of how far a marquee has run. Time comes from the shared ticker,
 * and a new text is read from its beginning while a mere redraw is not.
 */
export class MarqueeRun {
  private startedAt: number | undefined;
  private key: string | undefined;

  /** Columns travelled at `now` (ms) for the text identified by `key`, at `speed` columns per second. */
  offset(now: number, key: string, speed: number): number {
    if (this.startedAt === undefined || key !== this.key) {
      this.startedAt = now;
      this.key = key;
    }
    return Math.floor(((now - this.startedAt) * speed) / 1000);
  }

  reset(): void {
    this.startedAt = undefined;
  }
}
