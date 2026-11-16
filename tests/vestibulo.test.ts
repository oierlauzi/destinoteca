import { describe, expect, it } from 'vitest';
import type { Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { readConfig, writeConfig } from '../src/lib/player/config';
import { vestibulo2, vestibulo4, type VestibuloOptions } from '../src/lib/replicas/page-iberica-vestibulo/def';
import { boardGeometry } from '../src/lib/replicas/page-iberica-vestibulo/geometry';
import { implementation } from '../src/lib/replicas/page-iberica-vestibulo/index';
import { rowCells } from '../src/lib/replicas/page-iberica-vestibulo/render';
import { andenElectromagnetico } from '../src/lib/replicas/page-iberica-anden-electromagnetico/def';

const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const options = defaults(vestibulo4.options) as VestibuloOptions;
const train = (id: string, dest: string, minutes: number, platform: string, confirmed = true): Service => ({
  id,
  destination: { name: dest },
  callsAfter: [{ place: { name: 'Nuevos Ministerios' } }, { place: { name: 'Atocha Cercanías', names: ['Atocha'] } }],
  here: { departure: { estimated: NOW + minutes * 60000 }, platform: { name: platform, confirmed } },
});
const view = (services: Service[]): View => ({
  now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true },
});

describe('concourse board layout', () => {
  it('puts the platform in the first two cells, the destination after, the minutes at the end', () => {
    expect(rowCells({ platform: '2', destination: 'CHAMARTIN', minutes: '8' }, options).join('')).toBe(' 2CHAMARTIN        8');
    expect(rowCells({ platform: '12', destination: 'X', minutes: '' }, options).join('')).toBe('12X                 ');
  });

  it('is the same width for both sizes and taller with more lines', () => {
    const two = boardGeometry(2);
    const four = boardGeometry(4);
    expect(two.width).toBe(four.width);
    expect(four.height).toBeGreaterThan(two.height);
    expect(vestibulo2.viewBox).toEqual({ width: two.width, height: two.height });
    // The LED row is a little wider than the lines, which are centred over it on their own.
    expect(two.led.x).toBeLessThan(two.linesX);
    const lineEnd = two.minX - 0.76992;
    expect(two.linesX - two.led.x).toBeCloseTo(two.led.x + two.led.width - lineEnd, 6);
    expect(two.minX + 8.4).toBeLessThan(two.panel.x + two.panel.width);
  });
});

describe('concourse board presenter', () => {
  const impl = implementation(4);

  it('lists the next trains of the whole station, one per line', () => {
    const frame = impl.present(view([train('a', 'Chamartín', 8, '2'), train('b', 'Colmenar Viejo', 13, '1', false)]), options);
    expect(frame).toMatchObject({
      via1: '2', dest1: 'CHAMARTIN', min1: '8',
      via2: '', dest2: 'COLMENAR VIEJO', min2: '13',
      via3: '', dest3: '', min3: '',
      led: '',
    });
  });

  it('fits a long name between the platform and the minutes', () => {
    const frame = impl.present(view([train('a', 'Alcobendas-San Sebastián de los Reyes', 22, '1')]), options);
    expect(String((frame as Record<string, unknown>).dest1).length).toBeLessThanOrEqual(20 - 2 - 3);
  });

  it('keeps the LED row dark, notices included, but shows what is typed by hand', () => {
    const withNotice = { ...view([train('a', 'Chamartín', 8, '2')]), notices: [{ text: 'Aviso' }] };
    expect(impl.present(withNotice, { ...options, ledIdle: 'X' })).toMatchObject({ led: '' });
    const svg = (led: string) => impl.renderToString({ ...(impl.blank(view([]), options) as Record<string, unknown>), led }, options);
    expect(svg('').match(/fill="#ff3b2e"/g)).toBeNull();
    expect(svg('HOLA').match(/fill="#ff3b2e"/g)?.length).toBeGreaterThan(20);
  });

  it('goes blank with nothing to show', () => {
    expect(impl.blank(view([]), options)).toMatchObject({ via1: '', dest1: '', min4: '', led: '' });
  });

  it('draws every flap of every line', () => {
    const svg = impl.renderToString(impl.present(view([train('a', 'Chamartín', 8, '2')]), options), options);
    expect(svg.match(/<polygon /g)).toHaveLength(4 * 20 * 5 * 7);
    expect(svg.match(/>min\.</g)).toHaveLength(4);
    expect(svg).toContain('>Destino<');
    expect(svg).toContain('>Próxima<');
    // The 2-line board photographed at Tres Cantos has no "Próxima Llegada".
    expect(implementation(2, false).renderToString(implementation(2, false).blank(view([]), options), options)).not.toContain('Próxima');
  });

  it('leaves room under each line for its tube', () => {
    const g = boardGeometry(4);
    const step = g.lineTops[1]! - g.lineTops[0]!;
    expect(step / 11.181).toBeGreaterThan(1.8);
    expect(step / 11.181).toBeLessThan(2.2);
  });
});

describe('concourse board settings', () => {
  it('takes a hand-typed board from the URL, row by row', () => {
    const config = readConfig(vestibulo2, new URLSearchParams('via1=1&dest1=ATOCHA&min1=4&deadon=2'));
    expect(config.frame).toMatchObject({ via1: '1', dest1: 'ATOCHA', min1: '4', dest2: 'COLMENAR VIEJO' });
    expect(readConfig(vestibulo2, writeConfig(vestibulo2, config))).toEqual(config);
  });

  it('shares appearance and faults with the platform sign, less the LED idle text', () => {
    const keys = (fields: { key: string }[]) => fields.map((field) => field.key);
    expect(keys(vestibulo2.options.fields)).toEqual(keys(andenElectromagnetico.options.fields).filter((key) => key !== 'ledIdle'));
    expect(vestibulo2.needs.calls).toBe(false);
    expect(vestibulo4.selection(options)).toMatchObject({ platforms: 'any', window: { size: 4, mode: 'top' } });
  });
});
