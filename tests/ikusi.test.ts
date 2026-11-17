import { describe, expect, it } from 'vitest';
import { IKUSI_RECONSTRUCTED, IKUSI_SEEN, ikusiLcd, ikusiRows, lcdBlot, lcdModules, lcdShades, lcdSize, toString, type LcdLook } from '../src/lib/hardware';
import type { Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { ikusiAndenAtocha, optionsSchema, type IkusiOptions } from '../src/lib/replicas/ikusi-anden-atocha/def';
import { BEZEL, CELL, FILLER, FILLERS, GLASS, LINE_X, logoAt, openings, HEIGHT, LOGO_HEIGHT, LINE, STRIP, TIME, WIDTH, labelSpan, lineModules, lineRow, timeModules, timeRow } from '../src/lib/replicas/ikusi-anden-atocha/geometry';
import { ikusiLogoWidth } from '../src/lib/replicas/ikusi-anden-atocha/ikusi-logo';
import { blank, present } from '../src/lib/replicas/ikusi-anden-atocha/presenter';
import { describe as describeFrame, lcdLook, renderToString } from '../src/lib/replicas/ikusi-anden-atocha/render';
import { getReplica } from '../src/lib/replicas/registry';

const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const options = defaults(optionsSchema) as IkusiOptions;
const view = (services: Service[], platforms: string[] = []): View => ({
  now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms, cycle: true },
});
const train = (extra: Partial<Service> = {}): Service => ({
  id: 't',
  destination: { name: 'Alcalá de Henares' },
  here: { activity: 'calls', departure: { scheduled: NOW + 7 * 60000 }, platform: { name: '3', confirmed: true } },
  ...extra,
});

describe('the Ikusi liquid-crystal font', () => {
  it('draws every character on a 7 × 11 grid', () => {
    for (const char of [...IKUSI_SEEN, ...IKUSI_RECONSTRUCTED]) {
      const rows = ikusiRows(char)!;
      expect(rows).toHaveLength(11);
      for (const row of rows) expect(row).toHaveLength(7);
    }
    expect(ikusiLcd.glyph('H')).toHaveLength(7);
  });

  it('keeps what was seen apart from what was drawn to match', () => {
    expect(IKUSI_SEEN.filter((char) => IKUSI_RECONSTRUCTED.includes(char))).toEqual([]);
    expect(IKUSI_RECONSTRUCTED).toContain('Q');
  });

  it('writes capitals without accents, but keeps the Ñ, and a blank for what it cannot write', () => {
    expect(ikusiLcd.fold('Alcalá de Henares')).toBe('ALCALA DE HENARES');
    expect(ikusiLcd.fold('Señal€')).toBe('SEÑAL ');
    expect(ikusiLcd.glyph('€').every((bits) => bits === 0)).toBe(true);
  });
});

describe('liquid-crystal modules', () => {
  const look: LcdLook = { pitch: 1, dot: 0.9, pad: 0.2, lit: '#ffff00', litAged: '#00ff00', blank: '#00aa00', blankDull: '#003300', uneven: 0.5, delamination: 0, seed: 3 };

  it('are as large as their dots and their glass', () => {
    expect(lcdSize({ cols: 7, rows: 11 }, look)).toEqual({ width: 6 + 0.9 + 0.4, height: 10 + 0.9 + 0.4 });
  });

  it('keep their glow under a character, and each its own shade', () => {
    const svg = lcdModules([{ x: 0, y: 0 }, { x: 10, y: 0 }], ['A', ' '], ikusiLcd, look).map(toString).join('');
    expect(svg.match(/<rect /g)).toHaveLength(2);
    expect(lcdShades(0, look)).toEqual(lcdShades(0, look));
    expect(lcdShades(0, look)).not.toEqual(lcdShades(1, look));
    // New, every character is lit alike; the glasses glow a little apart even then.
    expect(lcdShades(0, { ...look, uneven: 0 }).lit).toBe('#ffff00');
    expect(lcdShades(5, { ...look, uneven: 0 }).lit).toBe('#ffff00');
  });

  it('come apart only where the seed says, and within their glass', () => {
    const size = lcdSize({ cols: 7, rows: 11 }, look);
    expect(lcdBlot(0, { x: 0, y: 0 }, size, look)).toBeUndefined();
    const all = { ...look, delamination: 1 };
    const blot = lcdBlot(4, { x: 5, y: 5 }, size, all)!;
    const numbers = blot.match(/-?\d+(\.\d+)?/g)!.map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThanOrEqual(5);
      expect(numbers[i]).toBeLessThanOrEqual(5 + size.width);
      expect(numbers[i + 1]).toBeGreaterThanOrEqual(5);
      expect(numbers[i + 1]).toBeLessThanOrEqual(5 + size.height);
    }
    expect(lcdBlot(4, { x: 5, y: 5 }, size, all)).toBe(blot);
  });
});

describe('the Ikusi platform sign', () => {
  it('is registered under its own id', () => {
    expect(getReplica('ikusi-anden-atocha')).toBe(ikusiAndenAtocha);
    expect(ikusiAndenAtocha.viewBox).toEqual({ width: WIDTH, height: HEIGHT });
  });

  it('is a mirror image on the right of the pole, but writes the same way', () => {
    // The full rows are centred, so the destination is where it is on either side.
    expect(WIDTH - (LINE_X + STRIP.width)).toBeCloseTo(LINE_X);
    expect(lineModules()[0]!.x).toBeLessThan(lineModules()[LINE - 1]!.x);
    // The time is at the outer end, «VIA» towards the pole.
    expect(timeModules('left')[0]!.x).toBe(LINE_X);
    expect(timeModules('right')[4]!.x).toBeCloseTo(lineModules()[LINE - 1]!.x);
    const left = labelSpan('left');
    const right = labelSpan('right');
    expect(right.from).toBeCloseTo(WIDTH - left.to);
    expect(left.to).toBeGreaterThan(LINE_X + STRIP.width);
    expect(FILLER).toBeCloseTo(3 * CELL);
  });

  it('mounts each row on a rail, one module per character and two blank ones at each end', () => {
    const line = lineRow();
    expect(line.modules).toHaveLength(LINE + 2 * FILLERS);
    expect(line.modules.filter((module) => module.blank)).toHaveLength(2 * FILLERS);
    expect(line.rail.x).toBeCloseTo(BEZEL);
    expect(line.rail.x + line.rail.width).toBeCloseTo(WIDTH - BEZEL);
    for (const side of ['left', 'right'] as const) {
      const time = timeRow(side);
      expect(time.modules).toHaveLength(TIME + 2 * FILLERS);
      expect(time.modules[0]!.blank && time.modules[1]!.blank && !time.modules[2]!.blank).toBe(true);
    }
  });

  it('has one opening per row, and prints «VIA» on the sheet beside the time’s', () => {
    for (const side of ['left', 'right'] as const) {
      const open = openings(side);
      const label = labelSpan(side);
      expect(open.time.x + open.time.width < label.from || open.time.x > label.to).toBe(true);
      for (const module of timeModules(side)) {
        expect(module.x).toBeGreaterThan(open.time.x);
        expect(module.x + GLASS.width).toBeLessThan(open.time.x + open.time.width);
      }
      expect(open.time.y + open.time.height).toBeLessThan(open.line.y);
      expect(open.line.y + open.line.height).toBeLessThan(open.strip.y);
      expect(open.strip.x).toBeLessThan(STRIP.x);
    }
  });

  it('carries its logo on the sheet under the end of the red strip', () => {
    for (const side of ['left', 'right'] as const) {
      const strip = openings(side).strip;
      const logo = logoAt(side);
      expect(logo.x).toBeGreaterThan(STRIP.x + STRIP.width);
      expect(logo.y).toBeGreaterThan(strip.y + strip.height);
      expect(logo.x + ikusiLogoWidth(LOGO_HEIGHT)).toBeLessThan(WIDTH);
      expect(logo.y + LOGO_HEIGHT).toBeLessThan(HEIGHT);
    }
  });

  it('shows the scheduled time and the destination of the next train', () => {
    expect(present(view([train()], ['3']))).toEqual({ time: '10:07', text: 'ALCALA DE HE', platform: '3' });
    expect(present(view([train({ destination: { name: 'Parla' } })]))).toEqual({ time: '10:07', text: 'PARLA', platform: '3' });
    expect(present(view([train({ here: { activity: 'passes', departure: { scheduled: NOW }, platform: { name: '3' } } })], ['3'])).text).toBe('SIN PARADA');
    expect(blank(view([], ['4']))).toEqual({ time: '', text: '', platform: '4' });
  });

  it('draws one glass per character, and the red strip lit', () => {
    const svg = renderToString({ time: '18:47', text: 'ALCALA', platform: '3' }, options);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg.match(/<rect [^>]*width="5\.54"[^>]*fill="#/g)).toHaveLength(5 + 12);
    expect(svg).toContain('#ff2b1c');
    expect(svg).toContain('>VIA<');
    expect(describeFrame({ time: '18:47', text: 'ALCALA', platform: '3' })).toBe('Vía 3 · 18:47 · ALCALA');
  });

  it('ages as asked, and the same for the same seed', () => {
    const frame = { time: '', text: 'MOSTOL/SOTO', platform: '8' };
    const worn = { ...options, delamination: 50, wearSeed: 7 };
    expect(renderToString(frame, worn)).toBe(renderToString(frame, worn));
    expect(renderToString(frame, worn)).toContain('#56543c');
    expect(renderToString(frame, options)).not.toContain('#56543c');
    expect(lcdLook({ ...options, uneven: 0 }).uneven).toBe(0);
  });
});
