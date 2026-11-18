import { helveticaWidth } from './fonts/helvetica';
import { num } from './svg';

/*
 * librsvg, which turns SVG into the PNG pictures that social networks show,
 * ignores `textLength`: a train type squeezed into its flap overflows it, and
 * a stretched station name falls short. This bakes each such text into what
 * librsvg does draw, from the widths of the font the replicas name (they set
 * their text in Helvetica, Arial or Liberation Sans):
 *
 * - `spacingAndGlyphs`: a horizontal scale about the text's anchor;
 * - `spacing`, from a start anchor: the letter spacing that fills the length.
 *
 * Only plain text with its size on the element itself is touched; anything
 * else is left as it was. The replicas' own SVG is never changed: this is for
 * a copy on its way to the rasteriser.
 */

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const decode = (text: string): string =>
  text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (whole, ref: string) => {
    if (ref[0] === '#') return String.fromCodePoint(ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10));
    return ENTITIES[ref] ?? whole;
  });

const single = (value: string | undefined): number | undefined => {
  if (value === undefined || !/^\s*-?[\d.]+(px)?\s*$/.test(value)) return undefined;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : undefined;
};

export function bakeTextLength(svg: string): string {
  return svg.replace(/<text(\s[^>]*?\btextLength="[^"]*"[^>]*)>([^<]*)<\/text>/g, (whole, attrs: string, content: string) => {
    const read = (name: string): string | undefined => new RegExp(`\\s${name}="([^"]*)"`).exec(attrs)?.[1];
    const length = single(read('textLength'));
    const size = single(read('font-size'));
    const x = single(read('x') ?? '0');
    const text = decode(content);
    const count = Array.from(text).length;
    if (length === undefined || size === undefined || x === undefined || count === 0) return whole;
    const weight = read('font-weight');
    const bold = weight === 'bold' || weight === 'bolder' || (weight !== undefined && Number(weight) >= 600);
    const spacing = single(read('letter-spacing')) ?? 0;
    const natural = helveticaWidth(text, size, bold) + spacing * (count - 1);
    if (natural <= 0) return whole;

    let kept = attrs.replace(/\s(textLength|lengthAdjust)="[^"]*"/g, '');
    const anchor = read('text-anchor') ?? 'start';
    if (read('lengthAdjust') === 'spacing' && anchor === 'start' && count > 1) {
      kept = kept.replace(/\sletter-spacing="[^"]*"/, '');
      return `<text${kept} letter-spacing="${num(spacing + (length - natural) / (count - 1))}">${content}</text>`;
    }
    // Scaled about x, whatever the anchor: start, middle and end all stay put.
    const k = length / natural;
    const squeeze = `matrix(${num(k)} 0 0 1 ${num(x * (1 - k))} 0)`;
    const transform = read('transform');
    kept = kept.replace(/\stransform="[^"]*"/, '');
    return `<text${kept} transform="${transform ? `${transform} ${squeeze}` : squeeze}">${content}</text>`;
  });
}
