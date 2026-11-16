import { describe, expect, it } from 'vitest';
import { mpElectronicsAdif as font, MP_SEEN_IN_PHOTOGRAPHS, textStrip, toString } from '../src/lib/hardware';
import { mpLogo } from '../src/lib/replicas/mp-electronics-adif/mp-logo';
import type { Service, View } from '../src/lib/model';
import { defaults, type ParamSchema } from '../src/lib/params';
import { readConfig, replicaSize, writeConfig } from '../src/lib/player/config';
import { AMBER, fromFlat, GREEN, mpElectronicsAdif as def, toFlat, type AdifOptions } from '../src/lib/replicas/mp-electronics-adif/def';
import { BOARD_WIDTH, CELLS, FIELD_X, layout } from '../src/lib/replicas/mp-electronics-adif/geometry';
import { idleText } from '../src/lib/replicas/mp-electronics-adif/labels';
import { blank, present, trainText } from '../src/lib/replicas/mp-electronics-adif/presenter';
import { cellText, renderToString, runsPath } from '../src/lib/replicas/mp-electronics-adif/render';
import { buildLongDistanceBoard } from '../src/lib/sources/demo/index';

const options = defaults(def.options) as AdifOptions;
const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });

describe('the typeface', () => {
  it('has 7-column characters on 11 rows, which capitals fill', () => {
    for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:./-áéíóúàèòïüçñ') {
      const glyph = font.glyph(char)!;
      expect(glyph, char).toHaveLength(7);
      expect(Math.max(...glyph), char).toBeLessThan(1 << 11);
    }
    // The L: a stem two dots thick down the whole panel, a foot one dot thick.
    const l = font.glyph('L')!;
    expect(l[0]).toBe(0b11111111111);
    expect(l[1]).toBe(0b11111111111);
    expect(l[6]).toBe(1 << 10);
    // A small letter leaves its two top rows to its mark.
    expect(font.glyph('ñ')!.some((byte) => byte & 0b11)).toBe(true);
    expect(font.glyph('o')).toBeUndefined();
    expect(MP_SEEN_IN_PHOTOGRAPHS).toEqual(expect.arrayContaining(['L', 'ó', '0']));
  });

  it('writes accented vowels small, keeps Ñ, and blanks what it lacks without moving the rest', () => {
    expect(font.fold('Castelló de la Plana')).toBe('CASTELLó DE LA PLANA');
    expect(font.fold('A Coruña')).toBe('A CORUñA');
    expect(font.fold('MÁLAGA')).toBe('MáLAGA');
    expect(font.fold('a€b')).toBe('A B');
    // Every character advances 8 columns, a space too.
    expect(textStrip('AB C', font)).toHaveLength(4 * 8 - 1);
  });
});

describe('the board', () => {
  it('fits the photographed texts in their fields', () => {
    expect('MADRID PTA. ATOCHA'.length).toBe(CELLS.place);
    expect('A 03073/34073'.length).toBe(CELLS.train);
    expect('ESTIMADO 15:41'.length).toBe(CELLS.remarks);
    expect(cellText('train', 'IRYO 06110')).toBe('IRYO    06110');
    expect(cellText('train', 'A 03073/34073')).toBe('A 03073/34073');
    expect(cellText('platform', '3')).toBe('   3');
    expect(cellText('time', '10:45')).toBe('10:45');
  });

  it('grows with the boards hung together, whatever its languages', () => {
    expect(replicaSize(def, { ...options, regional: 'ca' })).toEqual(replicaSize(def, options));
    expect(layout().rowY(1) - layout().rowY(0)).toBe(16);
    // The wide row starts with the place field and ends about the middle of the remarks.
    const wide = layout().wide;
    expect(wide.x).toBe(FIELD_X.place);
    expect(Math.abs(wide.x + wide.cols - (FIELD_X.remarks + CELLS.remarks * 4))).toBeLessThanOrEqual(4);
    const one = replicaSize(def, { ...options, regional: '' });
    const four = replicaSize(def, { ...options, regional: '', across: 2, down: 2 });
    expect(one.width).toBe(BOARD_WIDTH);
    expect(four.width).toBeGreaterThan(2 * one.width);
    expect(four.height).toBeGreaterThan(2 * one.height);
    expect(def.selection({ ...options, across: 2, down: 2 }).window.size).toBe(28);
  });

  it('draws runs of lit dots as rectangles', () => {
    expect(runsPath([0b1, 0b1, 0, 0b1], 10, 20)).toBe('M10,20h2v1h-2zM13,20h1v1h-1z');
  });

  it('renders legends in the regional language and the lit LEDs in the chosen colour', () => {
    const frame = defaults(def.frame as ParamSchema);
    const svg = renderToString(fromFlat(frame), { ...options, regional: 'ca', color: GREEN });
    expect(svg).toContain('>Sortides<');
    expect(svg).toContain('>Destinació<');
    expect(svg).toContain(`fill="${GREEN}"`);
    // The maker's logo is drawn as outlines, not as text.
    expect(svg).not.toContain('>MP ELECTRONICS<');
    expect(svg).toContain(toString(mpLogo(BOARD_WIDTH - 12, layout().height - 4, 1.9, '#8a8e90')));
    const plain = renderToString(fromFlat(frame), options);
    expect(plain).not.toContain('Sortides');
    expect(plain).toContain(`fill="${AMBER}"`);
  });

  it('loses whole rows of a panel when LED rows fail, the same ones for the same seed', () => {
    const frame = fromFlat(defaults(def.frame as ParamSchema));
    const healthy = renderToString(frame, options);
    const faulty = renderToString(frame, { ...options, deadRows: 20 });
    expect(faulty.length).toBeLessThan(healthy.length);
    expect(renderToString(frame, { ...options, deadRows: 20 })).toBe(faulty);
  });

  it('carries a frame flat and back, with rows past the first board', () => {
    const frame = { rows: Array.from({ length: 14 }, (_, i) => ({ time: `1${i % 10}:00`, place: 'TOLEDO', train: 'AVANT 08100', platform: '1', remarks: '' })), wide: 'AVISO' };
    expect(fromFlat(toFlat(frame))).toEqual(frame);
  });
});

describe('presenter', () => {
  const train: Service = {
    id: 't',
    product: { name: 'Iryo', shortName: 'IRYO' },
    number: '6110',
    origin: { name: 'Barcelona Sants' },
    destination: { name: 'Madrid Puerta de Atocha', names: ['Madrid Pta. Atocha'] },
    status: 'delayed',
    here: { departure: { scheduled: NOW + 45 * 60000, estimated: NOW + 74 * 60000 }, arrival: { scheduled: NOW + 40 * 60000 }, platform: { name: '3', confirmed: true } },
  };

  it('shows time, destination, train, platform and the estimated time', () => {
    const frame = present(view([train]), options);
    expect(frame.rows[0]).toEqual({ time: '10:45', place: 'MADRID PTA. ATOCHA', train: 'IRYO 06110', platform: '3', remarks: 'ESTIMADO 11:14' });
    expect(frame.rows).toHaveLength(7);
    expect(frame.wide).toBe(idleText('departures'));
  });

  it('says it in Catalan on Catalan boards', () => {
    expect(present(view([train]), { ...options, regional: 'ca' }).rows[0]!.remarks).toBe('ESTIMAT 11:14');
    expect(present(view([{ ...train, status: 'cancelled' }]), { ...options, regional: 'ca' }).rows[0]!.remarks).toBe('SUPRIMIT');
    expect(present(view([{ ...train, status: 'cancelled' }]), options).rows[0]!.remarks).toBe('CANCELADO');
  });

  it('shows where an arriving train comes from, at its arrival time, and "-" before a platform is set', () => {
    const row = present(view([{ ...train, here: { ...train.here, platform: { name: '3', confirmed: false } } }]), { ...options, mode: 'arrivals' }).rows[0]!;
    expect(row).toMatchObject({ time: '10:40', place: 'BARCELONA SANTS', platform: '-' });
  });

  it('writes both numbers of two trains running coupled, and as much of the product as fits', () => {
    const coupled: Service = { ...train, product: { name: 'Alvia', shortName: 'ALVIA' }, portions: [{ number: '3073' }, { number: '34073' }] };
    expect(trainText(coupled)).toBe('A 03073/34073');
  });

  it('fills a stack of boards, and keeps notices for the wide row', () => {
    const services = buildLongDistanceBoard(3, NOW);
    const frame = present({ ...view(services), notices: [{ text: 'Acceso a la sala de embarque' }] }, { ...options, across: 2 });
    expect(frame.rows).toHaveLength(14);
    expect(frame.rows.filter((row) => row.time).length).toBe(Math.min(14, services.length));
    expect(frame.wide).toBe('Acceso a la sala de embarque');
    expect(blank(view([]), { ...options, across: 2, down: 3 }).rows).toHaveLength(42);
  });
});

describe('settings', () => {
  it('reads a hand-typed board and its appearance from the URL and writes them back', () => {
    const config = readConfig(def, new URLSearchParams('h1=08:15&d1=VALENCIA%20EST.%20NORD&t1=EUROMED%2001081&v1=-&o1=POR%20HUELGA&lengua=ca&cabecera=tab&ancho=2'));
    expect(config.frame).toMatchObject({ h1: '08:15', d1: 'VALENCIA EST. NORD', t1: 'EUROMED 01081', o1: 'POR HUELGA' });
    expect(config.options).toMatchObject({ regional: 'ca', header: 'tab', across: 2 });
    expect(readConfig(def, writeConfig(def, config))).toEqual(config);
  });

  it('starts the demo on long-distance trains, unless the URL says otherwise', () => {
    expect(readConfig(def, new URLSearchParams('source=demo')).sourceConfig.network).toBe('long-distance');
    const commuter = readConfig(def, new URLSearchParams('source=demo&red=commuter'));
    expect(commuter.sourceConfig.network).toBe('commuter');
    expect(readConfig(def, writeConfig(def, commuter))).toEqual(commuter);
  });
});
