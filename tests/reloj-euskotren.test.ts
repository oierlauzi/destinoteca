import { describe, expect, it } from 'vitest';
import { bakeTextLength } from '../src/lib/hardware';
import { defaults } from '../src/lib/params';
import { relojEuskotren as def, type RelojEuskotrenOptions } from '../src/lib/replicas/reloj-euskotren/def';
import { HANDS, NUMERAL, RADII } from '../src/lib/replicas/reloj-euskotren/geometry';
import { renderToString } from '../src/lib/replicas/reloj-euskotren/render';

const options = defaults(def.options) as RelojEuskotrenOptions;
const subpaths = (svg: string, nth: number): number => {
  const d = [...svg.matchAll(/<path d="([^"]*)" fill="#2f7cb8"/g)][nth]?.[1] ?? '';
  return d.split('M').length - 1;
};

describe('the Euskotren clock', () => {
  it('shows station time from any board, and rests at 10:10 with none', async () => {
    const impl = await def.load();
    const view = { now: Date.UTC(2026, 10, 16, 9, 12, 0), timeZone: 'Europe/Madrid', services: [], total: 0, notices: [], placement: { platforms: [], cycle: true } };
    expect(impl.present(view, options)).toEqual({ time: view.now, zone: 'Europe/Madrid' });
    expect(impl.blank({ ...view, now: 0 }, options)).toEqual({});
    expect(renderToString({}, options)).toContain('Reloj de Euskotren: 10:10');
    expect(renderToString({ time: view.now, zone: 'Europe/Madrid' }, options)).toContain('10:12');
  });

  it('prints a dot at every minute and a pointed bar at every fifth', () => {
    const svg = renderToString({}, options);
    expect(subpaths(svg, 0)).toBe(48);
    expect(subpaths(svg, 1)).toBe(12);
  });

  it('has two hands and no second hand, both clear of what they pass over', () => {
    const svg = renderToString({}, options);
    expect([...svg.matchAll(/<g transform="rotate\(/g)]).toHaveLength(2);
    // The minute hand stops short of the dots, but reaches in over the five-minute
    // bars; the hour hand stops short of the numerals.
    expect(HANDS.minute.tip).toBeLessThan(RADII.dots);
    expect(HANDS.minute.tip).toBeGreaterThan(RADII.wedgeInner);
    expect(HANDS.hour.tip).toBeLessThan(RADII.numerals - NUMERAL.height / 2);
    // They are lifted off the dial, so one crossing a bar still reads as a hand.
    expect(svg).toContain('feDropShadow');
  });

  it('prints only the numerals the dial carries, each set to its own width', () => {
    const svg = renderToString({}, options);
    const numerals = [...svg.matchAll(/<text[^>]*textLength[^>]*>(\d+)<\/text>/g)].map((m) => m[1]);
    expect(numerals).toEqual(['12', '3', '6', '9']);
  });

  it('prints the wordmark in two colours, and leaves it off when asked', () => {
    const svg = renderToString({}, options);
    expect(svg).toContain('>Eusko<');
    expect(svg).toContain('>Tren<');
    expect(svg.indexOf('#1b1b1b')).toBeGreaterThan(0);
    const bare = renderToString({}, { ...options, logo: false });
    expect(bare).not.toContain('>Eusko<');
    expect(bare).not.toContain('>Tren<');
  });

  it('sets every text so that the rasteriser of the social pictures can bake it', () => {
    const baked = bakeTextLength(renderToString({}, options));
    expect(baked).not.toContain('textLength');
    expect(baked).toContain('>Eusko<');
    expect(baked).toContain('>12<');
  });
});
