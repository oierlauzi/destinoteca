/**
 * Deterministic pseudo-random number in [0, 1) for a seed and three
 * coordinates. Faults in a display (a stuck dot, a garbled cell) must stay
 * where they are from one redraw to the next, so they are derived from this
 * instead of being rolled each time.
 */
export function hash01(seed: number, x: number, y: number, z: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 2654435761) >>> 0;
  h = Math.imul(h ^ x, 2246822519) >>> 0;
  h = Math.imul(h ^ y, 3266489917) >>> 0;
  h = Math.imul(h ^ z, 668265263) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** A stable number for a piece of text, to seed faults that change with the message. */
export function hashText(text: string): number {
  let h = 0;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0;
  return h;
}
