import { describe, expect, it } from 'vitest';
import { pageIbericaThin7, pageIbericaThin7Own, textStrip } from '../src/lib/hardware';
import type { Service, View } from '../src/lib/model';
import { defaults, type ParamSchema } from '../src/lib/params';
import { readConfig, writeConfig } from '../src/lib/player/config';
import { fromFlat, LINE_COUNT, pasarelaAtocha, toFlat } from '../src/lib/replicas/page-iberica-pasarela-atocha/def';
import { COLS, MINUTES_RIGHT } from '../src/lib/replicas/page-iberica-pasarela-atocha/geometry';
import { present } from '../src/lib/replicas/page-iberica-pasarela-atocha/presenter';
import { minutesStrip, renderToString } from '../src/lib/replicas/page-iberica-pasarela-atocha/render';

const NOW = Date.UTC(2026, 10, 17, 9, 0, 0);
const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });
const train = (i: number): Service => ({
  id: `t${i}`,
  destination: { name: i % 2 ? 'Chamartín' : 'Cercedilla' },
  here: { departure: { scheduled: NOW + (i + 1) * 60000 }, platform: { name: String(1 + (i % 10)), confirmed: true } },
});
const options = defaults(pasarelaAtocha.options) as never;

describe('Atocha Cercanías gangway board', () => {
  it('has ten lines, five on each face, from the whole station', () => {
    expect(LINE_COUNT).toBe(10);
    const policy = pasarelaAtocha.selection({});
    expect(policy.platforms).toBe('any');
    expect(policy.window.size).toBe(10);
  });

  it('writes platform, destination and minutes on each line, the left face first', () => {
    const frame = present(view(Array.from({ length: 12 }, (_, i) => train(i))), options);
    expect(frame.lines).toHaveLength(10);
    expect(frame.lines[0]).toEqual({ platform: '1', text: 'CERCEDILLA', minutes: '1' });
    expect(frame.lines[9]).toEqual({ platform: '10', text: 'CHAMARTIN', minutes: '10' });
  });

  it('writes the minutes as "2min", the lowercase pressed to the figure', () => {
    // One blank column between the figure and "min", as between any two letters: no space.
    expect(minutesStrip('2')).toEqual([...textStrip('2', pageIbericaThin7), 0, ...textStrip('min', pageIbericaThin7Own)]);
    expect(minutesStrip('12').length).toBeLessThan(MINUTES_RIGHT);
    expect(MINUTES_RIGHT).toBe(COLS - 3);
  });

  it('draws ten flip-dot lines and one LED row', () => {
    const frame = fromFlat(defaults(pasarelaAtocha.frame as ParamSchema));
    const svg = renderToString(frame, options);
    expect(svg).toContain('1 CHAMARTIN 2 min');
    expect(svg.match(/>Destino</g)).toHaveLength(2);
  });

  it('carries a hand-typed board in the URL', () => {
    const config = readConfig(pasarelaAtocha, new URLSearchParams('v1=4&d1=P.PIO-VILLAL&m1=2&v6=9&d6=SIN%20SERVICIO&m6=7'));
    expect(config.frame).toMatchObject({ v1: '4', d1: 'P.PIO-VILLAL', m1: '2', v6: '9' });
    expect(readConfig(pasarelaAtocha, writeConfig(pasarelaAtocha, config))).toEqual(config);
    const frame = fromFlat(config.frame);
    expect(fromFlat(toFlat(frame))).toEqual(frame);
  });
});
