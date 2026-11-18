import { describe, expect, it } from 'vitest';
import { ikusiLcd, ikusiRows } from '../src/lib/hardware';
import type { Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { readConfig, replicaSize, writeConfig } from '../src/lib/player/config';
import { columnLegend, columnSpans, composeRow, flightText, LAYOUTS, layoutOf, splitFlight, TITLES, type BoardRow } from '../src/lib/replicas/ikusi-aeropuerto/columns';
import { fromFlat, ikusiAeropuerto as def, toFlat, type AirportFrame, type AirportOptions } from '../src/lib/replicas/ikusi-aeropuerto/def';
import impl from '../src/lib/replicas/ikusi-aeropuerto/index';
import { boardRow, boardSize, clockLayout, glassX, HEADER_BOTTOM, shapeOf } from '../src/lib/replicas/ikusi-aeropuerto/geometry';
import { blank, flightOf, present, REMARKS_HOLD_MS } from '../src/lib/replicas/ikusi-aeropuerto/presenter';
import { describe as describeFrame, renderToString, rowChars } from '../src/lib/replicas/ikusi-aeropuerto/render';
import { CELL, FILLERS } from '../src/lib/replicas/ikusi/modules';
import { getReplica } from '../src/lib/replicas/registry';
import { FixedClock, StationClock } from '../src/lib/model';
import { ReplicaSession, SourceHub } from '../src/lib/player/session';
import { ManualTicker } from '../src/lib/player/ticker';
import type { Frame, ReplicaImpl } from '../src/lib/replicas/types';
import type { SourceDef, SourceHandlers } from '../src/lib/sources/types';

const options = defaults(def.options) as AirportOptions;
const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });
const row = (extra: Partial<BoardRow>): BoardRow => ({ time: '', place: '', flight: '', counter: '', second: '', gate: '', remarks: '', ...extra });
const text = (chars: string[]): string => chars.join('');

describe('the rows', () => {
  it('are 51 modules on most boards, with two blank ones at each end', () => {
    expect(shapeOf(options)).toEqual({ rows: 12, cells: 51 });
    const first = boardRow(0, 51);
    expect(first.glasses).toHaveLength(51);
    expect(first.modules).toHaveLength(51 + 2 * FILLERS);
    expect(first.modules.filter((module) => module.blank)).toHaveLength(2 * FILLERS);
    expect(first.rail.x + first.rail.width).toBeCloseTo(boardSize({ rows: 12, cells: 51 }).width - first.rail.x);
  });

  it('write each column where the layout puts it, one blank module between two', () => {
    const valencia = row({ flight: 'UX 4004', place: 'P.MALLORCA', time: '09:05', second: '08:40', gate: 'R54', remarks: 'UL.LLAMAD' });
    expect(text(composeRow(valencia, LAYOUTS.valencia, 'departures', 51))).toBe('UX  4004 P.MALLORCA 09:05 08:40       R54 UL.LLAMAD');
    const tenerife = row({ time: '10:45', place: 'TENERIFE N', flight: 'UX 2107', counter: '08-08', second: '11:05', gate: '9', remarks: 'CANCELADO' });
    expect(text(composeRow(tenerife, LAYOUTS.canarias, 'departures', 51))).toBe('10:45 TENERIFE N UX  2107 08-08 11:05 9  CANCELADO ');
    const barajas = row({ time: '12:20', place: 'PARIS-CDG', flight: 'REU8301', counter: '423-431', second: '12:00', gate: 'E75', remarks: 'RETRASADO' });
    expect(text(composeRow(barajas, LAYOUTS.barajas, 'departures', 52))).toBe('12:20 PARIS-CDG  REU8301 423-431 12:00 E75 RETRASADO');
    // A row too short for its columns loses what does not fit.
    expect(composeRow(barajas, LAYOUTS.barajas, 'departures', 30)).toHaveLength(30);
  });

  it('give the remarks whatever the row has left', () => {
    const spans = columnSpans(LAYOUTS.canarias.departures, 51);
    expect(spans.at(-1)).toEqual({ key: 'remarks', start: 41, width: 10 });
    expect(columnSpans(LAYOUTS.canarias.arrivals, 51).at(-1)).toEqual({ key: 'remarks', start: 32, width: 19 });
  });

  it('write the flight as each airport does', () => {
    expect(splitFlight('UX 4004')).toEqual({ airline: 'UX', number: '4004' });
    expect(splitFlight('REU8301')).toEqual({ airline: 'REU', number: '8301' });
    expect(splitFlight('A3687')).toEqual({ airline: 'A3', number: '687' });
    expect(flightText('nt 608', 'spaced', 8)).toBe('NT   608');
    expect(flightText('SK 3341', 'compact', 7)).toBe('SK 3341');
    expect(flightText('A3 687', 'compact', 7)).toBe('A3  687');
    expect(flightText('AVE18205', 'spaced', 8)).toBe('AVE18205');
  });

  it('keep a small a between the numbers of two desks, and fold the rest to capitals', () => {
    expect(ikusiLcd.foldKeepingRanges('07a08')).toBe('07a08');
    expect(ikusiLcd.foldKeepingRanges('Málaga')).toBe('MALAGA');
    expect(ikusiLcd.fold('07a08')).toBe('07A08');
    expect(ikusiRows('a')).toHaveLength(11);
    // The W is closed at the bottom, a U with a stem up the middle.
    expect(ikusiRows('W')!.at(-2)).toBe('#######');
  });
});

describe('the header', () => {
  it('prints the legend of each column over its first character', () => {
    const svg = renderToString(fromFlat(defaults(def.frame!)), options);
    for (const span of columnSpans(LAYOUTS.valencia.departures, 51)) {
      const legend = columnLegend(span.key, 'departures', false);
      expect(svg).toContain(`x="${Math.round(glassX(span.start) * 100) / 100}"`);
      expect(svg).toContain(`>${legend.es}<`);
      expect(svg).toContain(`>${legend.regional.va}<`);
    }
    expect(svg).toContain('>Eixides<');
    expect(svg).toContain('>Salidas<');
  });

  it('has the other language over English and Spanish, or none', () => {
    const plain = renderToString(fromFlat({}), { ...options, regional: '' });
    expect(plain).not.toContain('>Eixides<');
    expect(plain).toContain('>Departures<');
    const german = renderToString(fromFlat({}), { ...options, regional: 'de', mode: 'arrivals', layout: 'canarias' });
    expect(german).toContain(`>${TITLES.arrivals.regional.de}<`);
    expect(german).toContain('>Erwartet<');
    expect(german).toContain('>Procedencia<');
  });

  it('carries a clock and a yellow line on the later boards, with «Zona/Puerta» printed smaller to fit', () => {
    const later = { ...options, model: 'reloj' as const, regional: '' as const, terminal: 'T2', layout: 'barajas' as const, cells: 52 };
    const svg = renderToString(fromFlat({ clock: '12:01' }), later);
    expect(svg).toContain('stroke="#c9a53c"');
    expect(svg).toContain('>T2<');
    expect(svg).toContain('>Zona/Puerta<');
    const sizes = [...svg.matchAll(/font-size="([\d.]+)"[^>]*>Zona\/Puerta</g)].map((m) => Number(m[1]));
    expect(sizes[0]).toBeLessThan(0.76 * CELL);
    // The clock's five glasses, besides those of the rows.
    expect(svg.match(/<rect [^>]*width="5\.54"[^>]*fill="#/g)).toHaveLength(12 * 52 + 5);
    expect(clockLayout().window.y + clockLayout().window.height).toBeLessThan(HEADER_BOTTOM - 2 * CELL);
    expect(renderToString(fromFlat({}), options)).not.toContain('stroke="#c9a53c"');
  });

  it('has the symbol of the logo in green on the aluminium frames only', () => {
    expect(renderToString(fromFlat({}), { ...options, frame: 'plata' })).toContain('fill="#06ab54"');
    expect(renderToString(fromFlat({}), options)).not.toContain('fill="#06ab54"');
  });
});

describe('the Ikusi airport board', () => {
  it('is registered, and grows with its rows and its modules', () => {
    expect(getReplica('ikusi-aeropuerto')).toBe(def);
    const base = replicaSize(def, options);
    expect(base).toEqual(def.viewBox);
    expect(replicaSize(def, { ...options, rows: 13 }).height).toBeGreaterThan(base.height);
    expect(replicaSize(def, { ...options, cells: 52 }).width - base.width).toBeCloseTo(CELL);
    expect(replicaSize(def, { ...options, regional: 'de' })).toEqual(base);
  });

  it('decodes settings it does not know into something sensible', () => {
    expect(shapeOf({ rows: 99, cells: 'x' })).toEqual({ rows: 16, cells: 51 });
    expect(layoutOf('nowhere')).toBe(LAYOUTS.valencia);
    // The green glass was dropped: Bilbao's are olive too, and old links show them so.
    expect(readConfig(def, new URLSearchParams('cristal=verde')).options.glass).toBe('oliva');
    const svg = renderToString(fromFlat({}), { ...options, frame: 'oro' as never, glass: 'azul' as never, picto: 'enorme' as never });
    expect(svg.startsWith('<?xml')).toBe(true);
  });

  it('round-trips a hand-typed frame through its URL', () => {
    const config = readConfig(def, new URLSearchParams('h1=10:45&d1=TENERIFE%20N&v1=UX%202107&m1=08-08&e1=11:05&p1=9&o1=CANCELADO&reloj=12:01&modo=departures&columnas=canarias&lengua=de&filas=10&marco=plata'));
    expect(config.frame.h1).toBe('10:45');
    expect(config.options.layout).toBe('canarias');
    expect(config.options.rows).toBe(10);
    expect(readConfig(def, writeConfig(def, config))).toEqual(config);
    const frame = fromFlat(config.frame);
    expect(frame.rows[0]).toEqual({ time: '10:45', place: 'TENERIFE N', flight: 'UX 2107', counter: '08-08', second: '11:05', gate: '9', remarks: 'CANCELADO' });
    expect(toFlat(frame)).toMatchObject({ h1: '10:45', clock: '12:01' });
  });

  it('draws one glass per module, and as many rows as it has', () => {
    const svg = renderToString(fromFlat(defaults(def.frame!)), { ...options, rows: 8 });
    expect(svg.match(/<rect [^>]*width="5\.54"[^>]*fill="#/g)).toHaveLength(8 * 51);
    expect(rowChars(fromFlat(defaults(def.frame!)), options)).toHaveLength(12);
    expect(describeFrame(fromFlat(defaults(def.frame!)), options)).toMatch(/^Salidas · UX 4004 P\.MALLORCA 09:05 08:40 R54 UL\.LLAMAD · /);
  });

  it('shows trains as flights: the time, where to, the product and number, the platform as the gate', () => {
    const train: Service = {
      id: 'a',
      product: { name: 'AVE', shortName: 'AVE' },
      number: '02109',
      destination: { name: 'Barcelona Sants', names: ['BARCELONA'] },
      here: { departure: { scheduled: NOW + 10 * 60_000, estimated: NOW + 22 * 60_000 }, platform: { name: '4', confirmed: true }, allocations: [{ kind: 'check-in', name: '35-36' }] },
    };
    const shown = pagesOf(present(view([train, { ...train, id: 'b', status: 'cancelled' }]), options));
    const frame = shown[0]!.frame;
    expect(frame.rows[0]).toEqual({ time: '10:10', place: 'BARCELONA', flight: 'AVE 2109', counter: '35-36', second: '', gate: '4', remarks: 'RETRASADO' });
    expect(frame.rows[1]!.remarks).toBe('CANCELADO');
    expect(frame.clock).toBe('10:00');
    expect(flightOf({ id: 'f', operator: { name: 'Iberia', shortName: 'IB' }, number: '3910' })).toBe('IB 3910');
    const arriving: Service = { ...train, origin: { name: 'Madrid' }, here: { arrival: { scheduled: NOW, estimated: NOW + 4 * 60_000 } } };
    // With nothing to remark, there is nothing to go round: one frame.
    const arrivals = present(view([arriving]), { ...options, mode: 'arrivals' }) as AirportFrame;
    expect(arrivals.rows[0]).toMatchObject({ time: '10:00', place: 'MADRID', second: '10:04', remarks: '' });
    expect(blank(view([])).rows.every((r) => r.time === '')).toBe(true);
  });

  it('goes round Spanish, English and the board’s other language in the remarks, and changes nothing else', () => {
    const late: Service = { id: 'l', operator: { name: 'Iberia', shortName: 'IB' }, number: '3910', destination: { name: 'Madrid' }, here: { departure: { scheduled: NOW, estimated: NOW + 30 * 60_000 } } };
    const gone: Service = { ...late, id: 'c', status: 'cancelled' };
    const remarksOf = (o: AirportOptions) => pagesOf(present(view([late, gone]), o)).map((page) => page.frame.rows.slice(0, 2).map((r) => r.remarks));
    expect(remarksOf(options)).toEqual([['RETRASADO', 'CANCELADO'], ['DELAYED', 'CANCELLED'], ['RETARDAT', 'CANCELLAT']]);
    expect(remarksOf({ ...options, regional: 'de' })[2]).toEqual(['VERSPATET', 'ANNULLIERT']);
    expect(remarksOf({ ...options, regional: '' })).toHaveLength(2);
    const pages = pagesOf(present(view([late, gone]), options));
    expect(pages.every((page) => page.holdMs === REMARKS_HOLD_MS)).toBe(true);
    const others = (frame: AirportFrame) => frame.rows.map((r) => ({ ...r, remarks: '' }));
    expect(others(pages[1]!.frame)).toEqual(others(pages[0]!.frame));
    // Through the replica's boundary, each page is a flat frame.
    const flat = impl.present(view([late]), options as never) as { pages: { frame: Record<string, unknown> }[] };
    expect(flat.pages.map((page) => page.frame.o1)).toEqual(['RETRASADO', 'DELAYED', 'RETARDAT']);
  });
});

describe('the remarks on a running board', () => {
  it('change language every few seconds through the player', async () => {
    const hub = new SourceHub(new StationClock(new FixedClock(NOW)));
    const ticker = new ManualTicker();
    const frames: Frame[] = [];
    const recording = { ...impl, mount: () => ({ setFrame: (frame: Frame) => void frames.push(frame), setOptions: () => {}, destroy: () => {} }) } as ReplicaImpl;
    new ReplicaSession(def, recording, {} as Element, hub, ticker, { options: { ...options, regional: 'eu' }, placement: { platforms: [], cycle: true } });
    let handlers: SourceHandlers | undefined;
    const source: SourceDef = { id: 'fake', label: '', kind: 'live', config: { fields: [] }, load: async () => ({ create: () => ({ start: (h) => void (handlers = h), stop: () => {} }) }) };
    await hub.setSource(source);
    const gone: Service = { id: 'c', status: 'cancelled', operator: { name: 'Iberia', shortName: 'IB' }, number: '3910', destination: { name: 'Madrid' }, here: { departure: { scheduled: NOW + 600_000 } } };
    handlers!.onSnapshot({ kind: 'board', generatedAt: NOW, services: [gone] });
    const seen: unknown[] = [];
    for (let t = 0; t < 4; t++) {
      ticker.advance(t === 0 ? 16 : REMARKS_HOLD_MS);
      seen.push(frames.at(-1)!.o1);
    }
    expect(seen).toEqual(['CANCELADO', 'CANCELLED', 'EZEZTATUTA', 'CANCELADO']);
  });
});

function pagesOf(shown: unknown): { frame: AirportFrame; holdMs: number }[] {
  const pages = (shown as { pages?: { frame: AirportFrame; holdMs: number }[] }).pages;
  if (!pages) throw new Error('expected pages');
  return pages;
}
