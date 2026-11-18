import { describe, expect, it } from 'vitest';
import { LED_COLS } from '../src/lib/replicas/page-iberica-anden-electromagnetico/render';
import type { Placement, Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { andenElectromagnetico } from '../src/lib/replicas/page-iberica-anden-electromagnetico/def';
import { andenDosVias, frameSchema, fromFlat, HEIGHT, toFlat, WIDTH, type DosViasOptions } from '../src/lib/replicas/page-iberica-anden-dos-vias/def';
import { blank, halfPlatforms, present } from '../src/lib/replicas/page-iberica-anden-dos-vias/presenter';
import { describe as describeFrame, renderToString } from '../src/lib/replicas/page-iberica-anden-dos-vias/render';
import { ledRows, panelState } from '../src/lib/replicas/page-iberica-electromagneticos/parts';
import { getReplica } from '../src/lib/replicas/registry';

const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const options = defaults(andenDosVias.options) as DosViasOptions;
const view = (services: Service[], platforms: string[] = []): View => {
  const placement: Placement = { platforms, cycle: true };
  return { now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement };
};
const train = (id: string, destination: string, platform: string, minutes: number): Service => ({
  id,
  destination: { name: destination },
  here: { activity: 'calls', departure: { estimated: NOW + minutes * 60000 }, platform: { name: platform, confirmed: true } },
});

describe('two platform signs in one box', () => {
  it('is registered, as wide as the single sign and one panel taller', () => {
    expect(getReplica('page-iberica-anden-dos-vias')).toBe(andenDosVias);
    expect(WIDTH).toBe(andenElectromagnetico.viewBox.width);
    expect(HEIGHT).toBeCloseTo(andenElectromagnetico.viewBox.height + 67.75975, 6);
  });

  it('gives each half the next train on its own platform', () => {
    const services = [train('a', 'Valladolid', '4', 2), train('b', 'Chamartín', '4', 9), train('c', 'Atocha', '5', 12)];
    const frame = present(view(services, ['5', '4']), options);
    expect(frame.halves.map(({ platform, text, minutes }) => ({ platform, text, minutes }))).toEqual([
      { platform: '5', text: 'ATOCHA', minutes: '12' },
      { platform: '4', text: 'VALLADOLID', minutes: '2' },
    ]);
  });

  it('keeps a half with no train dark, still showing its platform', () => {
    const frame = present(view([train('a', 'Valladolid', '4', 2)], ['5', '4']), options);
    expect(frame.halves[0]).toEqual({ platform: '5', text: '', minutes: '', led: '' });
    expect(blank(view([], ['5', '4']), options).halves.map((half) => half.platform)).toEqual(['5', '4']);
  });

  it('takes the platforms of the next trains when bolted to none', () => {
    const services = [train('a', 'Valladolid', '4', 2), train('b', 'Chamartín', '4', 9), train('c', 'Atocha', '5', 12)];
    expect(halfPlatforms(view(services))).toEqual(['4', '5']);
    expect(halfPlatforms(view([]))).toEqual([undefined, undefined]);
  });

  it('round-trips its frame through flat settings, and decodes its defaults', () => {
    const frame = present(view([train('a', 'Valladolid', '4', 2)], ['5', '4']), options);
    expect(fromFlat(toFlat(frame))).toEqual(frame);
    expect(fromFlat(defaults(frameSchema)).halves[1]).toMatchObject({ platform: '4', text: 'SOL-VALLAD', minutes: '2' });
  });

  it('draws two lines of 16 flip-dot characters, two LED rows and two printed faces', () => {
    const svg = renderToString(fromFlat(defaults(frameSchema)), options);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg.match(/<polygon /g)).toHaveLength(2 * 16 * 5 * 7);
    // Two LED rows of seven rows each, plus the two Cercanías roundels.
    expect(svg.match(/<circle /g)).toHaveLength(2 * LED_COLS * 7 + 2);
    expect(svg.match(/>Vía</g)).toHaveLength(2);
    expect(svg.match(/>min\.</g)).toHaveLength(2);
  });

  it('runs each LED row on its own', () => {
    const rows = ledRows(0, [0, 50], 100);
    const state = panelState(rows, [[1, 2, 3], [4]], [0, 0]);
    expect(state).toHaveLength(2);
    expect(state[0]).toHaveLength(rows.cols);
    expect(state[0]).not.toEqual(state[1]);
  });

  it('describes both halves in words', () => {
    const frame = fromFlat({ via1: '5', text1: '', min1: '', led1: '', via2: '4', text2: 'SOL-VALLAD', min2: '2', led2: '' });
    expect(describeFrame(frame, options)).toBe('Vía 5 / Vía 4 · SOL-VALLAD · 2 min.');
  });
});
