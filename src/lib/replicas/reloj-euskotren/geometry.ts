/**
 * The clock in units where R is the radius of the white face, which is also
 * the inner edge of the dark ring around it. Every proportion below was
 * measured on photographs rectified to a frontal view: the dial that the
 * Museo Vasco del Ferrocarril keeps, and one in service at Atxuri. They are
 * fractions of R, not sizes; no clock has been measured.
 *
 * The two photographs do not agree to better than about a twentieth of R on
 * the hands, so those are a middle reading of the two.
 */
export const R = 100;
export const SIZE = 224;
export const C = SIZE / 2;

export const RADII = {
  /** The outer edge of the dark ring around the face. */
  bezel: 1.058,
  /** The ring the minute dots sit on, a little inside the face's edge. */
  dots: 0.922,
  /** The five-minute mark: cut off square at the outer end, pointed towards the centre. */
  wedgeOuter: 0.938,
  wedgeInner: 0.848,
  /** The middle of the hour numerals. */
  numerals: 0.727,
  /** The middle of the wordmark, above the hands' pivot. */
  wordmark: 0.355,
} as const;

/** A minute dot, across. */
export const DOT = 0.032;

/**
 * A five-minute mark: a bar of this width, cut off square at the outer end,
 * whose sides run straight and then close to a point towards the centre.
 * `tipAngle` is the angle the two sides of that point make with each other,
 * in degrees, and it is what decides how much of the bar is left straight.
 */
export const WEDGE = { width: 0.036, tipAngle: 60 } as const;

/**
 * The numerals, which are only 12, 3, 6 and 9: the height of the figures
 * and the width of one of them. The dial's own are a humanist sans with
 * hooked tails; they are set here in the stack of known widths that the rest
 * of the archive uses, so that they come out the same wherever the page is
 * drawn.
 */
export const NUMERAL = { height: 0.175, width: 0.136 } as const;

/**
 * The wordmark: the height of its capitals and the width of the whole of it,
 * measured on the dial at Atxuri. The two are in the same proportion as in
 * EuskoTren's own artwork, where the lettering is 253 units long and 37 tall.
 *
 * Where «Eusko» ends and «Tren» begins is taken from that artwork: the black
 * word takes the first `black` of the width, and the blue one starts at
 * `blueAt` and runs to the end.
 */
export const WORDMARK = { height: 0.112, width: 0.769, black: 0.577, blueAt: 0.605 } as const;

/**
 * The hands, pointing at 12: a flat bar of even width from `tail` behind the
 * pivot to `tip`, cut off square at the back and closing in front to a
 * point. There are only two; no photograph shows a second hand.
 */
export const HANDS = {
  hour: { tail: 0.17, tip: 0.583, width: 0.083 },
  minute: { tail: 0.17, tip: 0.869, width: 0.066 },
  /**
   * The sides are not quite parallel: the hand is `width` across at the
   * back and this much of it at the shoulder, where the point begins.
   */
  taperTo: 0.88,
  /** The angle the two sides of the point make with each other, in degrees. */
  tipAngle: 85,
} as const;
