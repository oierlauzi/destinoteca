import { describe, expect, it } from 'vitest';
import {
  lcdSize,
  ledCellPaths,
  ledCells,
  ikusi7x9,
  ikusi7x9Rows,
  IKUSI_7X9_READ,
  IKUSI_7X9_RECONSTRUCTED,
  IKUSI_7X9_SEEN,
  toString,
  type LedCellLook,
} from '../src/lib/hardware';
import type { Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { GLASS } from '../src/lib/replicas/ikusi/modules';
import { lcdLook, ledLook } from '../src/lib/replicas/ikusi-metro-bilbao/parts';
import { BRACKET_END, composeRow, fromFlat, ikusiMetroBilbaoAnden, optionsSchema, toFlat, type BilbaoOptions } from '../src/lib/replicas/ikusi-metro-bilbao-anden/def';
import { BOX, CHARS, CLOCK, layout } from '../src/lib/replicas/ikusi-metro-bilbao-anden/geometry';
import { blank, present } from '../src/lib/replicas/ikusi-metro-bilbao-anden/presenter';
import { renderToString } from '../src/lib/replicas/ikusi-metro-bilbao-anden/render';
import { ikusiMetroBilbaoAvisos, optionsSchema as avisosSchema, RUN_GAP, type AvisosOptions } from '../src/lib/replicas/ikusi-metro-bilbao-avisos/def';
import { layout as avisosLayout } from '../src/lib/replicas/ikusi-metro-bilbao-avisos/geometry';
import { present as presentNotices } from '../src/lib/replicas/ikusi-metro-bilbao-avisos/presenter';
import { lineCells, renderToString as renderNotices } from '../src/lib/replicas/ikusi-metro-bilbao-avisos/render';
import { getReplica } from '../src/lib/replicas/registry';

const NOW = Date.UTC(2026, 10, 18, 9, 0, 0);
const options = defaults(optionsSchema) as BilbaoOptions;
const view = (services: Service[], notices: View['notices'] = []): View => ({
  now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices, placement: { platforms: ['1'], cycle: true },
});
const train = (name: string, minutes: number, extra: Partial<Service> = {}): Service => ({
  id: name,
  destination: { name, localized: { eu: { name: name.replace('Echévarri', 'Etxebarri') } } },
  here: { activity: 'calls', departure: { scheduled: NOW + minutes * 60000 }, platform: { name: '1', confirmed: true } },
  ...extra,
});
const fold = (value: string) => ikusi7x9.fold(value);

describe('the LED characters of Metro Bilbao', () => {
  it('draws every character on a 7 × 9 grid', () => {
    for (const char of [...IKUSI_7X9_SEEN, ...IKUSI_7X9_RECONSTRUCTED]) {
      const rows = ikusi7x9Rows(char)!;
      expect(rows).toHaveLength(9);
      for (const row of rows) expect(row).toHaveLength(7);
    }
  });

  it('keeps what was read and seen apart from what was drawn to match', () => {
    expect(IKUSI_7X9_SEEN.filter((char) => IKUSI_7X9_RECONSTRUCTED.includes(char))).toEqual([]);
    for (const char of IKUSI_7X9_READ) expect(IKUSI_7X9_SEEN).toContain(char);
    expect(IKUSI_7X9_RECONSTRUCTED).toContain('K');
  });

  it('keeps the marks read on the photograph: the S’s single dots, the B’s feet, the narrow I', () => {
    expect(ikusi7x9Rows('S')![2]).toBe('##....#');
    expect(ikusi7x9Rows('B')![0]).toBe('#####..');
    expect(ikusi7x9Rows('I')!.every((row) => row[6] === '.')).toBe(true);
  });

  it('writes capitals without accents, and a blank for what it cannot write', () => {
    expect(ikusi7x9.fold('Ariz €')).toBe('ARIZ  ');
  });
});

describe('the glasses of Metro Bilbao', () => {
  it('are 7 × 9, as large as Ikusi’s other glasses, their dots further apart down than across', () => {
    const look = lcdLook({ uneven: 0, delamination: 0, wearSeed: 1 });
    const size = lcdSize(ikusi7x9, look);
    expect(size.width).toBeCloseTo(GLASS.width);
    expect(size.height).toBeCloseTo(GLASS.height);
    expect(look.pitchY).toBeGreaterThan(look.pitch);
  });

  it('write what the notice boards were photographed writing', () => {
    expect(IKUSI_7X9_SEEN).toContain('*');
    expect(IKUSI_7X9_SEEN).toContain('N');
    // The N is six dots wide, with a single dot at the top of one stem and the foot of the other.
    expect(ikusi7x9Rows('N')!.every((row) => row[6] === '.')).toBe(true);
    expect(ikusi7x9Rows('N')![0]).toBe('#...##.');
    expect(ikusi7x9Rows('N')![8]).toBe('##...#.');
  });
});

describe('LED character cells', () => {
  const look: LedCellLook = { ...ledLook({ uneven: 0, delamination: 0, wearSeed: 1 }) };

  it('are as large as the glasses they replaced', () => {
    expect(look.width).toBe(GLASS.width);
    expect(look.height).toBe(GLASS.height);
    expect(6 * look.pitchX + 2 * look.litRadius).toBeLessThan(look.width);
    expect(8 * look.pitchY + 2 * look.litRadius).toBeLessThan(look.height);
  });

  it('light a character’s dots, and all the dots of a blank cell faintly', () => {
    const at = { x: 0, y: 0 };
    const a = ledCellPaths('A', at, ikusi7x9, look);
    const space = ledCellPaths(' ', at, ikusi7x9, look);
    const dots = (d: string) => (d.match(/M/g) ?? []).length;
    expect(a.blank).toBe(false);
    expect(dots(a.lit) + dots(a.rest)).toBe(63);
    expect(space.blank).toBe(true);
    expect(dots(space.rest)).toBe(63);
    const svg = ledCells([at, { x: 7, y: 0 }], ['A', ' '], ikusi7x9, look).map(toString).join('');
    expect(svg).toContain(`fill="${look.dark}"`);
    expect(svg).toContain(`fill="${look.faint}"`);
  });
});

describe('the platform sign of Metro Bilbao', () => {
  it('is registered under its own id, its size following the code beside it', () => {
    expect(getReplica('ikusi-metro-bilbao-anden')).toBe(ikusiMetroBilbaoAnden);
    expect(ikusiMetroBilbaoAnden.size!({ navilens: true }).width).toBeGreaterThan(ikusiMetroBilbaoAnden.viewBox.width);
    expect(ikusiMetroBilbaoAnden.viewBox.height).toBeCloseTo(BOX.height);
  });

  it('has the clock at one end and the NaviLens code at the other', () => {
    const left = layout('left', true);
    const right = layout('right', true);
    expect(left.clock.cx).toBeLessThan(left.box.x);
    expect(left.plate!.x).toBeCloseTo(left.box.x + BOX.width);
    expect(right.clock.cx).toBeGreaterThan(right.box.x + BOX.width);
    expect(right.plate!.x).toBe(0);
    expect(right.width).toBeCloseTo(left.width);
    expect(left.clock.r * 2).toBe(CLOCK.diameter);
    // The rows write the same way on either hand.
    expect(right.rows[0]!.glasses[0]!.x - right.box.x).toBeCloseTo(left.rows[0]!.glasses[0]!.x - left.box.x);
  });

  it('mounts two rows of 19 characters on rails, one blank module at each end, inside its window', () => {
    const l = layout('left', false);
    expect(l.rows).toHaveLength(2);
    for (const row of l.rows) {
      expect(row.glasses).toHaveLength(CHARS);
      expect(row.modules.filter((module) => module.blank)).toHaveLength(2);
      expect(row.rail.x).toBeCloseTo(l.window.x);
      expect(row.rail.y + row.rail.height).toBeLessThanOrEqual(l.window.y + l.window.height + 1e-9);
    }
    // Twice as much box above the rows as below them.
    const above = l.window.y - l.box.y;
    const below = l.box.y + l.box.height - (l.window.y + l.window.height);
    expect(above).toBeGreaterThan(2 * below);
  });

  it('writes the destination from the left, the bracket and the minutes at the right end', () => {
    expect(composeRow({ destination: 'Basauri', bracket: '5', minutes: '25' }, fold).join('')).toBe('BASAURI      (5) 25');
    expect(composeRow({ destination: 'Larrabasterra', bracket: '', minutes: '04' }, fold).join('')).toBe('LARRABASTERRA    04');
    expect(composeRow({ destination: 'Ongi etorri, Casco Viejo', bracket: '', minutes: '' }, fold).join('')).toBe('ONGI ETORRI, CASCO ');
    expect(composeRow({ destination: 'San Ignacio de Loyola', bracket: '5', minutes: '' }, fold).join('').slice(BRACKET_END - 3)).toBe('(5)   ');
  });

  it('shows the next two trains, in Basque, with their minutes in two digits', () => {
    const frame = present(view([train('Echévarri', 3), train('Basauri', 5, { formation: { cars: [{}, {}, {}, {}, {}] } })]), options);
    expect(frame.rows).toEqual([
      { destination: 'ETXEBARRI', bracket: '', minutes: '03' },
      { destination: 'BASAURI', bracket: '5', minutes: '05' },
    ]);
    expect(frame.clock).toBe(NOW);
    // A train at the platform leaves its minutes blank; four cars, no bracket.
    expect(present(view([train('Plentzia', 0, { formation: { cars: [{}, {}, {}, {}] } })]), options).rows[0]).toEqual({ destination: 'PLENTZIA', bracket: '', minutes: '' });
    expect(blank(view([])).rows).toEqual([
      { destination: '', bracket: '', minutes: '' },
      { destination: '', bracket: '', minutes: '' },
    ]);
  });

  it('crosses the boundary flat, as a form and a URL hold it', () => {
    const frame = { rows: [{ destination: 'A', bracket: '5', minutes: '01' }, { destination: 'B', bracket: '', minutes: '' }], clock: NOW, zone: 'Europe/Madrid' };
    expect(fromFlat(toFlat(frame))).toEqual(frame);
    expect(fromFlat({}).rows).toHaveLength(2);
  });

  it('draws glasses or LED modules, as chosen', () => {
    const frame = fromFlat(defaults(ikusiMetroBilbaoAnden.frame!));
    const lcd = renderToString(frame, options);
    const led = renderToString(frame, { ...options, tech: 'led', navilens: true, side: 'right' });
    expect(lcd.startsWith('<?xml')).toBe(true);
    expect(lcd).toContain('<title>Metro Bilbao · ETXEBARRI 03 · BASAURI (5) 05</title>');
    expect(led).not.toBe(lcd);
    expect(led).toContain('#6cc4ef');
    expect(lcd).not.toContain('#6cc4ef');
    const box = ikusiMetroBilbaoAnden.size!({ navilens: true });
    expect(led).toContain(`viewBox="0 0 ${box.width} ${box.height}"`);
  });
});

describe('the notice board of Metro Bilbao', () => {
  const avisos = defaults(avisosSchema) as AvisosOptions;

  it('is registered under its own id, its size following the code beside it', () => {
    expect(getReplica('ikusi-metro-bilbao-avisos')).toBe(ikusiMetroBilbaoAvisos);
    expect(ikusiMetroBilbaoAvisos.size!({ navilens: 'left' }).width).toBeGreaterThan(ikusiMetroBilbaoAvisos.viewBox.width);
    const left = avisosLayout('left');
    const right = avisosLayout('right');
    expect(left.plate!.x).toBeLessThan(left.box.x);
    expect(right.plate!.x).toBeGreaterThan(right.box.x + right.box.width);
    expect(left.rows.map((row) => row.glasses.length)).toEqual([35, 35, 35]);
  });

  it('leaves a line that fits standing, and runs a longer one a character at a time with a gap', () => {
    expect(lineCells('Deustu/Ariz', 7).join('').trimEnd()).toBe('DEUSTU/ARIZ');
    const long = '** NORAKOA TRENAREN AURREKALDEAN ADIERAZITA **';
    expect(lineCells(long, 0).join('')).toBe(long.slice(0, 35));
    expect(lineCells(long, 1).join('')).toBe(long.slice(1, 36));
    // After the end, eight blanks, and the start again.
    const end = long.length - 20;
    expect(lineCells(long, end).join('')).toBe(`${long.slice(end)}${' '.repeat(RUN_GAP)}${long.slice(0, 35 - 20 - RUN_GAP)}`);
    expect(lineCells(long, long.length + RUN_GAP)).toEqual(lineCells(long, 0));
  });

  it('puts a notice in Basque and in Spanish on the upper rows, and runs the rest on the third', () => {
    const bilingual = { text: { eu: 'Kaleko igogailua hondatua', es: 'Ascensor exterior averiado' } };
    expect(presentNotices(view([], [bilingual, { text: 'Deustu / Ariz' }])).lines).toEqual(['Kaleko igogailua hondatua', 'Ascensor exterior averiado', '** Deustu / Ariz **']);
    const long = { text: 'Acceso a la sala de embarque 30 minutos antes de la salida' };
    expect(presentNotices(view([], [long])).lines).toEqual(['', '', `** ${long.text} **`]);
    expect(presentNotices(view([])).lines).toEqual(['', '', '']);
  });

  it('draws its rows and Ikusi’s logo', () => {
    const svg = renderNotices({ lines: ['KALEKO IGOGAILUA HONDATUA', 'ASCENSOR EXTERIOR AVERIADO', 'DEUSTU/ARIZ'] }, avisos);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).toContain('<title>Metro Bilbao · KALEKO IGOGAILUA HONDATUA · ASCENSOR EXTERIOR AVERIADO · DEUSTU/ARIZ</title>');
  });
});
