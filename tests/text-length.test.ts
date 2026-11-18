import { describe, expect, it } from 'vitest';
import { bakeTextLength, helveticaWidth } from '../src/lib/hardware';

describe('helveticaWidth', () => {
  it('measures with Helvetica’s widths, regular and bold', () => {
    // O 778, U 722, I 278, G 778, O 778.
    expect(helveticaWidth('OUIGO', 10)).toBeCloseTo(33.34);
    // V 667, I 278, A 722 in bold.
    expect(helveticaWidth('VIA', 10, true)).toBeCloseTo(16.67);
    expect(helveticaWidth('ÑÍ–', 1)).toBeCloseTo(0.722 + 0.278 + 0.556);
  });

  it('counts an unknown character as a digit', () => {
    expect(helveticaWidth('→', 1)).toBeCloseTo(helveticaWidth('0', 1));
  });
});

describe('bakeTextLength', () => {
  it('turns a squeeze into a scale about the anchor', () => {
    const natural = helveticaWidth('OUIGO', 12);
    const out = bakeTextLength(`<text x="10" y="5" font-size="12" textLength="${natural / 2}" lengthAdjust="spacingAndGlyphs">OUIGO</text>`);
    expect(out).toBe('<text x="10" y="5" font-size="12" transform="matrix(0.5 0 0 1 5 0)">OUIGO</text>');
  });

  it('keeps a transform the text already had, outside the scale', () => {
    const natural = helveticaWidth('MD', 10);
    const out = bakeTextLength(`<text transform="rotate(90)" x="0" font-size="10" textLength="${natural * 2}" lengthAdjust="spacingAndGlyphs">MD</text>`);
    expect(out).toContain('transform="rotate(90) matrix(2 0 0 1 0 0)"');
  });

  it('turns a stretch from the start into letter spacing', () => {
    const natural = helveticaWidth('ABCD', 10, true);
    const out = bakeTextLength(`<text x="0" font-size="10" font-weight="700" text-anchor="start" textLength="${natural + 6}" lengthAdjust="spacing">ABCD</text>`);
    expect(out).toBe('<text x="0" font-size="10" font-weight="700" text-anchor="start" letter-spacing="2">ABCD</text>');
  });

  it('measures the text, not its escapes', () => {
    const natural = helveticaWidth('A&B', 10);
    const out = bakeTextLength(`<text x="0" font-size="10" textLength="${natural}" lengthAdjust="spacingAndGlyphs">A&amp;B</text>`);
    expect(out).toBe('<text x="0" font-size="10" transform="matrix(1 0 0 1 0 0)">A&amp;B</text>');
  });

  it('leaves alone what it cannot measure', () => {
    const inherited = '<text x="0" textLength="20" lengthAdjust="spacingAndGlyphs">AB</text>';
    const nested = '<text x="0" font-size="10" textLength="20"><tspan>AB</tspan></text>';
    const plain = '<text x="0" font-size="10">AB</text>';
    expect(bakeTextLength(inherited + nested + plain)).toBe(inherited + nested + plain);
  });
});
