/**
 * The clock in units where R is the outer edge of the white ring printed on
 * the glass, which is also the inner edge of the dark one. Every proportion
 * below was measured on a frontal photograph, from the centre of a circle
 * fitted to the bezel; they are fractions of R, not sizes.
 */
export const R = 100;
export const SIZE = 264;
export const C = SIZE / 2;

export const RADII = {
  /** The silver bezel, outer and inner edge. */
  bezel: 1.298,
  bezelInner: 1.262,
  /** A darker line where the print meets the bezel. */
  printEdge: 1.235,
  /** The white ring of bars: from here out to 1. */
  bars: 0.721,
  /** Where the dark mark of every fifth minute starts, leaving the slot's inner end clear. */
  fiveMinute: 0.77,
  /** The centres of the numerals, in the middle of the dark ring. */
  numerals: 1.15,
} as const;

/** Of every minute's sixth of a turn, the share the transparent slot takes; the white bar takes the rest. */
export const SLOT_SHARE = 0.34;

/**
 * The numerals, outside of their stroke: their height and the stroke's
 * width. A digit is about a quarter as wide as it is tall.
 */
export const NUMERAL = { height: 0.17, stroke: 0.0146 } as const;

/**
 * The hands, pointing at 12: from `tail` behind the centre to `tip`, and
 * their width at each end. The red ones narrow very slightly towards the
 * tip at the same rate; the minute hand reaches almost to the dark ring,
 * under the white one.
 */
export const HANDS = {
  hour: { tail: 0.29, tip: 0.57, tailWidth: 0.078, tipWidth: 0.056 },
  minute: { tail: 0.29, tip: 0.94, tailWidth: 0.078, tipWidth: 0.047 },
  second: { tail: 0.28, tip: 0.64, tailWidth: 0.038, tipWidth: 0.028 },
  /** The red disc at the end of the second hand, centred on its tip. */
  nib: 0.05,
} as const;
