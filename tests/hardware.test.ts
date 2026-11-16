import { describe, expect, it } from 'vitest';
import { cp437, sevenBit, telenormaCp437, DotTransition, garble, hash01, marqueeWindow, overlay, telenorma5x7, textColumns, toCells, toString, h, withStuckDots } from '../src/lib/hardware';

describe('telenorma 5x7 font', () => {
  it('draws a capital A as in the ROM', () => {
    expect(telenorma5x7.columns(0x41)).toEqual([0x7e, 0x09, 0x09, 0x09, 0x7e]);
  });
  it('has the 7-bit ñ and Ñ at 0x24 and 0x25, and a block at 0x23', () => {
    expect(telenorma5x7.columns(0x24)).toEqual([0x7c, 0x09, 0x05, 0x05, 0x78]);
    expect(telenorma5x7.columns(0x25)).toEqual([0x7c, 0x09, 0x11, 0x21, 0x7c]);
    expect(telenorma5x7.columns(0x23)).toEqual([0x7f, 0x7f, 0x7f, 0x7f, 0x7f]);
  });
});

describe('cp437', () => {
  it('maps what a keyboard types', () => {
    expect(cp437.encode('A')).toBe(0x41);
    expect(cp437.encode('Ñ')).toBe(0xa5);
    expect(cp437.encode('♥')).toBe(0x03);
    expect(cp437.encode('Á')).toBe(0x41);
    expect(cp437.encode('漢')).toBe(0x20);
  });
  it('round-trips every code above the control range', () => {
    for (let code = 0x20; code < 0xff; code++) expect(cp437.encode(cp437.decode(code))).toBe(code);
  });
  it('folds to what the sign can spell, sparing Ñ', () => {
    expect(cp437.fold('Príncipe Pío')).toBe('PRINCIPE PIO');
    expect(cp437.fold('Logroño')).toBe('LOGROÑO');
  });
});

describe('telenorma cp437', () => {
  it('names the three codes it changed and leaves standard cp437 alone', () => {
    expect(telenormaCp437.decode(0x23)).toBe('█');
    expect(telenormaCp437.decode(0x24)).toBe('ñ');
    expect(telenormaCp437.decode(0x25)).toBe('Ñ');
    expect(cp437.decode(0x24)).toBe('$');
    expect(cp437.decode(0x25)).toBe('%');
  });
  it('sends ñ and Ñ to the 8-bit codes, or to the low pair on a 7-bit link', () => {
    expect(telenormaCp437.encode('Ñ')).toBe(0xa5);
    expect(sevenBit().encode('Ñ')).toBe(0x25);
    expect(sevenBit().encode('ñ')).toBe(0x24);
    expect(sevenBit().encode('é')).toBe(0x20);
    expect(sevenBit().encode('A')).toBe(0x41);
  });
  it('passes the displaced characters through, as a controller sending ASCII did', () => {
    expect(telenormaCp437.encode('%')).toBe(0x25);
  });
});

describe('character line', () => {
  it('pads and cuts to the number of cells', () => {
    expect(toCells('AB', 4).join('')).toBe('AB  ');
    expect(toCells('ABCDEF', 4).join('')).toBe('ABCD');
  });
  it('writes a right-aligned field over the end', () => {
    expect(overlay(toCells('CHAMARTIN', 16), '12', 'right').join('')).toBe('CHAMARTIN     12');
  });
  it('garbles the same cells for the same message', () => {
    const codes = Array.from({ length: 16 }, () => 0x41);
    const fault = { fraction: 0.25, seed: 7, salt: 99, replacement: 3 };
    expect(garble(codes, fault)).toEqual(garble(codes, fault));
    expect(garble(codes, { ...fault, fraction: 0 })).toEqual(codes);
    expect(garble(codes, { ...fault, fraction: 1 })).toEqual(codes.map(() => 3));
  });
});

describe('marquee', () => {
  const strip = textColumns('AB', telenorma5x7, cp437);
  it('spaces characters by one column', () => {
    expect(strip).toHaveLength(12);
    expect(strip[5]).toBe(0);
  });
  it('centres a text that fits', () => {
    const window = marqueeWindow(strip, 20, 5, 4);
    expect(window.slice(0, 4)).toEqual([0, 0, 0, 0]);
    expect(window.slice(4, 16)).toEqual(strip);
  });
  it('wraps a text that does not, after a gap', () => {
    const window = marqueeWindow(strip, 6, 10, 4);
    expect(window).toEqual([strip[10], strip[11], 0, 0, 0, 0]);
    expect(marqueeWindow(strip, 6, 16, 4)).toEqual(marqueeWindow(strip, 6, 0, 4));
  });
});

describe('defects', () => {
  it('is deterministic and within [0, 1)', () => {
    const roll = hash01(1, 2, 3, 4);
    expect(roll).toBe(hash01(1, 2, 3, 4));
    expect(roll).toBeGreaterThanOrEqual(0);
    expect(roll).toBeLessThan(1);
  });
  it('sticks every dot on or off at the extremes', () => {
    expect(withStuckDots([[0, 0]], 2, 7, { on: 1, off: 0, seed: 1 })).toEqual([[0x7f, 0x7f]]);
    expect(withStuckDots([[0x7f, 0x7f]], 2, 7, { on: 0, off: 1, seed: 1 })).toEqual([[0, 0]]);
  });
});

describe('svg', () => {
  it('escapes text and attributes', () => {
    expect(toString(h('text', { 'data-x': '"<' }, ['a<b&c']))).toBe('<text data-x="&quot;&lt;">a&lt;b&amp;c</text>');
  });
});

describe('transition', () => {
  // Two modules of 2x2 dots; a module starts 100 ms after the previous one,
  // and within a module the wave runs from the top-left corner.
  const make = () => new DotTransition(2, 2, 2, (m, c, r) => m * 100 + (c + r) * 10);
  const full = [[3, 3], [3, 3]];

  it('starts counting at the first frame drawn after the change', () => {
    const transition = make();
    transition.retarget(full);
    expect(transition.at(5000)).toEqual([[1, 0], [0, 0]]);
    expect(transition.at(5010)).toEqual([[3, 1], [0, 0]]);
    expect(transition.at(5020)).toEqual([[3, 3], [0, 0]]);
    expect(transition.at(5100)).toEqual([[3, 3], [1, 0]]);
    expect(transition.settled).toBe(false);
    expect(transition.at(5120)).toEqual(full);
    expect(transition.settled).toBe(true);
  });
  it('continues from what is showing when the content changes again', () => {
    const transition = make();
    transition.retarget(full);
    transition.at(0);
    transition.at(20);
    transition.retarget([[0, 0], [3, 3]]);
    expect(transition.at(1000)).toEqual([[2, 3], [0, 0]]);
  });
  it('spends no time on modules that did not change, when the display works that way', () => {
    const transition = new DotTransition(3, 2, 2, (turn, c, r) => turn * 100 + (c + r) * 10, { differential: true });
    transition.jump([[3, 3], [0, 0], [0, 0]]);
    // Only the last module changes: it is first in the queue.
    transition.retarget([[3, 3], [0, 0], [3, 3]]);
    expect(transition.at(0)).toEqual([[3, 3], [0, 0], [1, 0]]);
    expect(transition.at(20)).toEqual([[3, 3], [0, 0], [3, 3]]);
    expect(transition.settled).toBe(true);
    // Nothing changes: nothing to wait for.
    transition.retarget([[3, 3], [0, 0], [3, 3]]);
    transition.at(100);
    expect(transition.settled).toBe(true);
  });
  it('can skip the animation', () => {
    const transition = make();
    transition.jump(full);
    expect(transition.settled).toBe(true);
    expect(transition.at(0)).toEqual(full);
  });
});
