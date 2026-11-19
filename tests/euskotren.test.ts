import { describe, expect, it } from 'vitest';
import type { Service, View } from '../src/lib/model';
import { ikusi7x9Rows, IKUSI_7X9_READ, IKUSI_7X9_SEEN } from '../src/lib/hardware';
import { defaults } from '../src/lib/params';
import { ikusiEuskotrenAnden, optionsSchema, type EuskotrenOptions } from '../src/lib/replicas/ikusi-euskotren-anden/def';
import { CHARS, CORNER, HEIGHT, LINE, PLATE, TEXT, WIDTH, WINDOW, row } from '../src/lib/replicas/ikusi-euskotren-anden/geometry';
import { blank, present } from '../src/lib/replicas/ikusi-euskotren-anden/presenter';
import { renderToString, rowChars } from '../src/lib/replicas/ikusi-euskotren-anden/render';
import { getReplica } from '../src/lib/replicas/registry';
import { readConfig } from '../src/lib/player/config';
import { buildDemoBoard, networkOf } from '../src/lib/sources/demo';

const NOW = Date.UTC(2009, 5, 14, 9, 50, 0);
const options = defaults(optionsSchema) as EuskotrenOptions;
const view = (services: Service[], platforms = ['2']): View => ({
  now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms, cycle: true },
});
const train = (name: string, eu: string, minutes: number): Service => ({
  id: name,
  destination: { name, localized: { eu: { name: eu } } },
  here: { activity: 'calls', departure: { scheduled: NOW + minutes * 60000 }, platform: { name: '2', confirmed: true } },
});

describe('the platform sign of Euskotren', () => {
  it('is registered under its own id', () => {
    expect(getReplica('ikusi-euskotren-anden')).toBe(ikusiEuskotrenAnden);
    expect(ikusiEuskotrenAnden.viewBox).toEqual({ width: WIDTH, height: HEIGHT });
  });

  it('mounts one row of 21 characters with two blank modules at each end, inside its window, right of the plate', () => {
    const r = row();
    expect(r.glasses).toHaveLength(CHARS);
    expect(r.modules.filter((module) => module.blank)).toHaveLength(4);
    expect(r.modules.slice(0, 2).every((module) => module.blank)).toBe(true);
    expect(r.rail.x).toBeCloseTo(WINDOW.x);
    expect(r.rail.width).toBeCloseTo(WINDOW.width);
    expect(PLATE.x + PLATE.width).toBeLessThan(WINDOW.x);
    expect(WINDOW.x + WINDOW.width).toBeLessThan(WIDTH);
  });

  it('has its plate’s corners concentric with the box’s, and its top level with the printed line', () => {
    expect(PLATE.y).toBeCloseTo(PLATE.x);
    expect(HEIGHT - (PLATE.y + PLATE.height)).toBeCloseTo(PLATE.x);
    expect(PLATE.corner).toBeCloseTo(CORNER - PLATE.x);
    expect(PLATE.y).toBeCloseTo(LINE.y);
    expect(PLATE.stroke).toBeCloseTo(LINE.width);
  });

  it('writes the time in the first five characters and the destination from the seventh', () => {
    expect(rowChars({ time: '11:57', text: 'Donostia' }).join('')).toBe('11:57 DONOSTIA       ');
    expect(rowChars({ time: '', text: 'LUTXANA' }).join('')).toBe('      LUTXANA        ');
    expect(rowChars({ time: '10:00', text: 'A'.repeat(30) })).toHaveLength(CHARS);
  });

  it('announces the next train by its time and its Basque name, under the printed number', () => {
    const frame = present(view([train('San Sebastián', 'Donostia', 7), train('Bermeo', 'Bermeo', 20)]));
    expect(frame).toEqual({ time: '11:57', text: 'DONOSTIA', platform: '2' });
    expect(frame.text.length).toBeLessThanOrEqual(TEXT);
  });

  it('keeps its printed number with nothing to announce', () => {
    expect(blank(view([], ['3']))).toEqual({ time: '', text: '', platform: '3' });
    expect(blank(view([], [])).platform).toBe('');
  });

  it('renders a standalone SVG with the legends in both languages', () => {
    const svg = renderToString({ time: '11:57', text: 'DONOSTIA', platform: '2' }, options);
    expect(svg).toContain('<svg');
    for (const word of ['Ordua', 'Hora', 'Norako', 'Destino']) expect(svg).toContain(`>${word}<`);
    expect(svg).toContain('Euskotren · Vía 2 · 11:57 · DONOSTIA');
  });
});

describe('the characters read at Atxuri', () => {
  it('draw the 1 with a one-dot flag and a foot one past the stem on each side, the stem in the colon’s columns', () => {
    const one = ikusi7x9Rows('1')!;
    expect(one[0]).toBe('..##...');
    expect(one[1]).toBe('.###...');
    expect(one[8]).toBe('.####..');
    expect(ikusi7x9Rows(':')![2]).toBe(one[0]);
    expect(IKUSI_7X9_READ).toContain('1');
  });

  it('end the 5’s hook in a single dot and give the D serifs', () => {
    expect(ikusi7x9Rows('5')![6]).toBe('#....##');
    expect(ikusi7x9Rows('D')![0]).toBe('######.');
    expect(ikusi7x9Rows('D')![1]).toBe('.######');
    expect(ikusi7x9Rows('D')![8]).toBe('######.');
    expect(IKUSI_7X9_SEEN).toContain('D');
  });
});

describe('what the simulation puts on it', () => {
  it('starts on Euskotren’s own trains, named in Basque', () => {
    expect(readConfig(ikusiEuskotrenAnden, new URLSearchParams('source=demo')).sourceConfig.network).toBe('euskotren');
    const trains = buildDemoBoard(networkOf('euskotren'), 3, NOW).filter((service) => service.here?.platform?.name === '2');
    const frame = present(view(trains));
    expect(frame.time).toMatch(/^\d\d:\d\d$/);
    expect(frame.text).toMatch(/^[A-ZÑ.\- ]+$/);
    expect(frame.platform).toBe('2');
    // Every destination of the network is one of its own ends of line, written as the sign wrote it.
    const names = networkOf('euskotren').runs.map((run) => (run.eu?.name ?? run.name).toUpperCase());
    expect(names).toContain('BERMEO');
    expect(names).toContain('HENDAIA');
  });
});
