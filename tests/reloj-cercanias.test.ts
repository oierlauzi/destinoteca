import { describe, expect, it } from 'vitest';
import { defaults } from '../src/lib/params';
import { relojCercanias as def, type RelojCercaniasOptions } from '../src/lib/replicas/reloj-cercanias/def';
import { HANDS, RADII } from '../src/lib/replicas/reloj-cercanias/geometry';
import { GLYPHS, layout, RECONSTRUCTED, SEEN } from '../src/lib/replicas/reloj-cercanias/numerals';
import { renderToString } from '../src/lib/replicas/reloj-cercanias/render';

const options = defaults(def.options) as RelojCercaniasOptions;
const subpaths = (svg: string, fill: string): number => {
  const d = new RegExp(`<path d="([^"]*)" fill="${fill}"`).exec(svg)?.[1] ?? '';
  return d.split('M').length - 1;
};

describe('the Cercanías clock', () => {
  it('shows station time from any board, and rests at 10:10 with none', async () => {
    const impl = await def.load();
    const view = { now: Date.UTC(2026, 10, 16, 9, 12, 0), timeZone: 'Europe/Madrid', services: [], total: 0, notices: [], placement: { platforms: [], cycle: true } };
    expect(impl.present(view, options)).toEqual({ time: view.now, zone: 'Europe/Madrid' });
    expect(impl.blank({ ...view, now: 0 }, options)).toEqual({});
    expect(renderToString({}, options)).toContain('Reloj de Cercanías: 10:10');
    expect(renderToString({ time: view.now, zone: 'Europe/Madrid' }, options)).toContain('10:12');
  });

  it('prints sixty white bars on the glass, and a grey mark in every fifth slot', () => {
    const svg = renderToString({}, options);
    expect(subpaths(svg, '#fbfbf8')).toBe(60);
    expect(subpaths(svg, '#353d40')).toBe(12);
  });

  it('puts the hands under the glass, the minute hand reaching in under the white ring', () => {
    const svg = renderToString({}, options);
    expect(svg.indexOf('fill="#fbfbf8"')).toBeGreaterThan(svg.indexOf('fill="#d2282b"'));
    expect(HANDS.minute.tip).toBeGreaterThan(RADII.fiveMinute);
    expect(HANDS.minute.tip).toBeLessThan(1);
    // The hour hand and the second hand with its disc stay clear of the ring.
    expect(HANDS.hour.tip).toBeLessThan(RADII.bars);
    expect(HANDS.second.tip + HANDS.nib).toBeLessThan(RADII.bars);
  });

  it('turns its numerals so that none is upside down', () => {
    const svg = renderToString({}, options);
    const turns = [...svg.matchAll(/rotate\((-?\d+)\) scale/g)].map((m) => Number(m[1]));
    // From 1 to 12: tops out from 9 through 12 to 3, in from 4 to 8.
    expect(turns).toEqual([30, 60, 90, -60, -30, 0, 30, 60, -90, -60, -30, 0]);
  });

  it('draws only digits read from photographs', () => {
    for (let hour = 1; hour <= 12; hour++) for (const digit of String(hour)) expect(SEEN.has(digit)).toBe(true);
    expect([...RECONSTRUCTED].filter((digit) => SEEN.has(digit))).toEqual([]);
    expect(Object.keys(GLYPHS).sort()).toEqual([...SEEN, ...RECONSTRUCTED].sort());
    // A numeral is centred on its place.
    const [one, two] = layout('12');
    expect(one!.x + two!.x + GLYPHS['2']!.width).toBeCloseTo(0);
  });
});
