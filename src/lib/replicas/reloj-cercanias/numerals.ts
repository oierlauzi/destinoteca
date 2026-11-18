/**
 * The hour numerals printed on the glass: tall, narrow figures drawn with a
 * single thin line, in the manner of art deco display faces. They are read
 * from photographs of the clock, not taken from a typeface, and drawn as
 * the centre line of the stroke.
 *
 * A glyph's box is 10 units tall (the stroke's centre line, from top to
 * bottom) and `WIDTH` wide; the 1 is a bare upright and takes no width. In
 * a two-digit numeral the digits stand `GAP` apart.
 */
export const WIDTH = 2.4;
export const GAP = 1.75;

const ellipse = (cx: number, cy: number, rx: number, ry: number): string => {
  const k = 0.5523;
  const f = (n: number): string => String(+n.toFixed(3));
  return (
    `M${f(cx)},${f(cy - ry)}C${f(cx + k * rx)},${f(cy - ry)} ${f(cx + rx)},${f(cy - k * ry)} ${f(cx + rx)},${f(cy)}` +
    `C${f(cx + rx)},${f(cy + k * ry)} ${f(cx + k * rx)},${f(cy + ry)} ${f(cx)},${f(cy + ry)}` +
    `C${f(cx - k * rx)},${f(cy + ry)} ${f(cx - rx)},${f(cy + k * ry)} ${f(cx - rx)},${f(cy)}` +
    `C${f(cx - rx)},${f(cy - k * ry)} ${f(cx - k * rx)},${f(cy - ry)} ${f(cx)},${f(cy - ry)}Z`
  );
};

/** A short flag at the top running into a loop three quarters of the height. Turned upside down, it is the 9. */
const SIX = `M1.5,0C1,1 0.3,2.6 0.19,4.3${ellipse(1.2, 6.3, 1.2, 3.7)}`;
const turned = (d: string): string =>
  d.replace(/(-?[\d.]+),(-?[\d.]+)/g, (_, x: string, y: string) => `${+(WIDTH - Number(x)).toFixed(3)},${+(10 - Number(y)).toFixed(3)}`);

export const GLYPHS: Record<string, { width: number; d: string }> = {
  '0': { width: 2.5, d: ellipse(1.25, 5, 1.25, 5) },
  '1': { width: 0, d: 'M0,0L0,10' },
  // A short round hook, the right side straight down for a third of the height, a long diagonal and a flat foot.
  '2': { width: 2.3, d: 'M0.05,1C0.15,0.35 0.6,0 1.15,0C1.85,0 2.3,0.45 2.3,1.25L2.3,3.2C2.3,4.8 0.2,7.4 0.2,8.8L0.2,10L2.55,10' },
  // A small round top meeting a tall lower bowl, flat at the bottom, at a point a quarter of the way down.
  '3': { width: WIDTH, d: 'M0.1,0.9C0.3,0.3 0.7,0 1.15,0C1.7,0 2.05,0.45 2.05,1.1C2.05,1.9 1.6,2.5 0.8,2.5C1.8,2.5 2.4,3.2 2.4,4.4L2.4,8.4C2.4,9.4 1.9,10 1.2,10L0.55,10C0.3,10 0.1,9.85 0.05,9.55' },
  // Closed at the top, with the bar low, ending at the stem.
  '4': { width: WIDTH, d: 'M2.1,10L2.1,0L0,7.8L2.4,7.8' },
  // A short stem under the top bar and a tall bowl.
  '5': { width: WIDTH, d: 'M2.15,0.2L0.05,0.2L0.05,1.9C0.4,1.75 0.9,1.8 1.4,2.2C2.1,2.8 2.4,3.6 2.4,4.6L2.4,8.5C2.4,9.5 1.9,10 1.2,10C0.6,10 0.2,9.8 0.05,9.4' },
  '6': { width: WIDTH, d: SIX },
  // The stem runs down from the end of the bar, almost straight, to the middle of the foot.
  '7': { width: 2.6, d: 'M0,0.2L2.6,0.2C1.9,2.8 1.2,6 1,10' },
  // The upper loop about a quarter of the height and narrower than the lower.
  '8': { width: WIDTH, d: `${ellipse(1.2, 1.35, 0.95, 1.35)}${ellipse(1.2, 6.35, 1.2, 3.65)}` },
  '9': { width: WIDTH, d: turned(SIX) },
};

/** Every digit appears on the dial (the 0 in the 10), and each was drawn from photographs of it. */
export const SEEN = new Set(Object.keys(GLYPHS));
/** None had to be made up. */
export const RECONSTRUCTED = new Set<string>();

/** The digits of a numeral, each with its offset from the numeral's centre, in glyph units. */
export function layout(text: string): { d: string; x: number }[] {
  const glyphs = [...text].map((char) => GLYPHS[char]!);
  const width = glyphs.reduce((sum, glyph) => sum + glyph.width, 0) + GAP * (glyphs.length - 1);
  let x = -width / 2;
  return glyphs.map((glyph) => {
    const placed = { d: glyph.d, x };
    x += glyph.width + GAP;
    return placed;
  });
}
