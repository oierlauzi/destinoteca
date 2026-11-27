import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { destinationsOf, FixedClock, text, type BoardSnapshot, type Service } from '../src/lib/model';
import { decode, encode } from '../src/lib/params';
import { sourceSchema } from '../src/lib/player/config';
import { andenElectromagnetico } from '../src/lib/replicas/page-iberica-anden-electromagnetico/def';
import { mpElectronicsAdif } from '../src/lib/replicas/mp-electronics-adif/def';
import { adifDef } from '../src/lib/sources/adif/def';
import {
  adifExt,
  create,
  findStation,
  identitiesFor,
  lookups,
  mapBoard,
  nameLadder,
  normalCode,
  readProduct,
  readTraffic,
  searchStations,
  stationUrl,
  type AdifBoard,
} from '../src/lib/sources/adif';
import { DATA_TIMEOUT_MS, PING_MS, SNAPSHOT_RETRY_MS, STALE_MS } from '../src/lib/sources/adif/client';
import type { SourceStatus } from '../src/lib/sources/types';
import chamartinBoard from './fixtures/adif/chamartin.json';
import atochaBoard from './fixtures/adif/puerta-de-atocha.json';
import jaenBoard from './fixtures/adif/jaen.json';

const chamartin = chamartinBoard as AdifBoard;
const atocha = atochaBoard as AdifBoard;
const jaen = jaenBoard as AdifBoard;
const at = (iso: string) => Date.parse(iso);

describe('station list', () => {
  it('reads a code with or without its leading zero', () => {
    expect(normalCode('3100')).toBe('03100');
    expect(normalCode(' 17000 ')).toBe('17000');
    expect(normalCode('')).toBe('');
    expect(findStation('3100')?.name).toBe('Jaén');
    expect(findStation('03100')?.code).toBe('03100');
    expect(findStation('00000')).toBeUndefined();
  });

  it("names stations as ADIF's own boards do, with their shorter forms", () => {
    const station = findStation('17000')!;
    expect(station.name).toBe('Madrid Chamartín Clara Campoamor');
    expect(station.names[0]).toBe('Madrid Chamartín Cl. Campoamor');
    expect(station.town).toBe('Madrid');
  });

  it('lists Cercanías stations that Renfe\'s register lacks', () => {
    expect(findStation('98305')?.name).toBe('Aeropuerto T4');
    expect(findStation('13208')?.name).toBe('San Mamés');
  });

  it('searches by name without accents, by town, and by code', () => {
    expect(searchStations('chamartin')[0]?.code).toBe('17000');
    expect(searchStations('JAEN')[0]?.code).toBe('03100');
    expect(searchStations('3100')[0]?.code).toBe('03100');
    expect(searchStations('17000')[0]?.code).toBe('17000');
    expect(searchStations('collado villalba').map((station) => station.code)).toContain('10200');
    expect(searchStations('')).toEqual([]);
    expect(searchStations('zzzz')).toEqual([]);
  });

  it("links to the station's board on info.adif.es", () => {
    expect(stationUrl('3100')).toBe('https://info.adif.es/?s=03100');
    expect(stationUrl('abc')).toBe('https://info.adif.es/');
  });
});

describe('station lookup', () => {
  const lookup = lookups['station']!;

  it('returns items that link to ADIF', () => {
    const [first] = lookup.search('chamartin', 5);
    expect(first).toMatchObject({ value: '17000', label: 'Madrid Chamartín Clara Campoamor', url: 'https://info.adif.es/?s=17000', urlLabel: 'adif.viewOnAdif' });
    expect(first?.detail).toContain('Madrid');
  });

  it('resolves a code with or without the zero, and accepts any five digits', () => {
    expect(lookup.resolve('3100')?.label).toBe('Jaén');
    expect(lookup.resolve('99999')).toBeUndefined();
    expect(lookup.accepts?.('99999')).toBe(true);
    expect(lookup.accepts?.('Jaén')).toBe(false);
  });
});

describe('products', () => {
  it('reads the line out of a Cercanías product, with its colour', () => {
    expect(readProduct('C04CERMAD', { C04CERMAD: '#2D2C86' })).toEqual({
      product: { id: 'cercanias', name: 'Cercanías', shortName: 'CERC', category: 'commuter' },
      line: { id: 'C04CERMAD', name: 'C-4', color: '#2D2C86' },
    });
    expect(readProduct('C4ACERMAD').line?.name).toBe('C-4A');
    expect(readProduct('C10CERMAD').line?.name).toBe('C-10');
    expect(readProduct('C03ALDBIL').product?.id).toBe('cercanias');
    // White is what ADIF gives a product with no line colour.
    expect(readProduct('C01CERMAD', { C01CERMAD: '#FFFFFF' }).line?.color).toBeUndefined();
  });

  it("reads Catalonia's lines, which carry no hyphen", () => {
    expect(readProduct('R2SRODBCN')).toMatchObject({ product: { id: 'rodalies' }, line: { name: 'R2S' } });
    expect(readProduct('R11MDCAT')).toMatchObject({ product: { id: 'md', category: 'regional' }, line: { name: 'R11' } });
    expect(readProduct('R13REXCAT').product?.id).toBe('regional-expres');
    expect(readProduct('RL3REGLLE').line?.name).toBe('RL3');
    expect(readProduct('RL1FGC')).toMatchObject({ product: { id: 'fgc' }, line: { name: 'RL1' } });
    expect(readProduct('C06RODVAL').product?.name).toBe('Rodalia');
    expect(readProduct('T01TRACAD').line?.name).toBe('T-1');
  });

  it('marks a Civis as semi-fast', () => {
    expect(readProduct('C8BCIVMAD')).toMatchObject({ product: { id: 'civis' }, line: { name: 'C-8B' }, flags: ['semi-fast'] });
  });

  it('names the brands with the ids the simulation uses, and passes unknown ones through', () => {
    expect(readProduct('AVE').product).toEqual({ id: 'ave', name: 'AVE', shortName: 'AVE', category: 'high-speed' });
    expect(readProduct('ICITY').product).toMatchObject({ id: 'intercity', shortName: 'INTCITY', category: 'long-distance' });
    expect(readProduct('REG').product?.category).toBe('regional');
    expect(readProduct('XYZ').product).toEqual({ id: 'xyz', name: 'XYZ', shortName: 'XYZ' });
    expect(readProduct('')).toEqual({});
  });

  it('keeps the identities a board of each kind shows, as ADIF does', () => {
    const ids = [
      { numbers: ['05080'], product: 'AVE', restricted: 'none' },
      { numbers: ['34080'], product: 'AVANT', restricted: 'destination' },
    ];
    expect(identitiesFor(ids, 'departures')).toEqual([{ product: 'AVE', numbers: ['05080'] }]);
    expect(identitiesFor(ids, 'arrivals')).toHaveLength(2);
    // Never all of them, and numbers of one product together, once each.
    expect(identitiesFor([{ numbers: ['1'], product: 'AVE', restricted: 'destination' }], 'departures')).toEqual([{ product: 'AVE', numbers: ['1'] }]);
    expect(identitiesFor([{ numbers: ['75007', '75007'], product: 'C8ACERMAD', restricted: 'commercial' }], 'departures')).toEqual([{ product: 'C8ACERMAD', numbers: ['75007'] }]);
    expect(identitiesFor(undefined, 'departures')).toEqual([]);
  });
});

describe('names', () => {
  it("puts ADIF's forms in order and drops one that only loses a space", () => {
    expect(nameLadder(['Madrid Chamartín Clara Campoamor', 'Madrid ChamartínClara Campoamor', 'Madrid Chamartín Cl. C.', 'Madrid Chamartín Cl.C.'])).toEqual([
      'Madrid Chamartín Clara Campoamor',
      'Madrid Chamartín Cl. C.',
    ]);
    expect(nameLadder(['Villalba de Guadarrama', 'Villalba de Guadarr.', 'Villalba de Guadarrama'])).toEqual(['Villalba de Guadarrama', 'Villalba de Guadarr.']);
    expect(nameLadder('Irun')).toEqual(['Irun']);
    expect(nameLadder(undefined)).toEqual([]);
  });
});

describe('mapBoard', () => {
  const board = mapBoard(chamartin)!;
  const byId = (id: string): Service => board.services.find((service) => service.id === id)!;

  it('keeps every train, and names the station', () => {
    expect(board.services).toHaveLength(11);
    expect(board.station).toMatchObject({ id: 'adif/17000', codes: { adif: '17000' }, name: 'Madrid Chamartín Clara Campoamor', timeZone: 'Europe/Madrid' });
    expect(new Set(board.services.map((service) => service.id)).size).toBe(11);
  });

  it('maps a late Cercanías at its platform: timetable and expected times, line, calls', () => {
    const service = byId('397488');
    expect(service).toMatchObject({
      mode: 'rail',
      operator: { id: 'renfe' },
      product: { id: 'cercanias' },
      line: { name: 'C-4', color: '#2D2C86' },
      number: '20326',
      destination: { name: 'Parla', codes: { adif: '37012' } },
    });
    // The times on the board are the timetable's; the delay comes apart.
    expect(service.here).toEqual({
      activity: 'calls',
      arrival: { scheduled: at('2026-11-27T22:29:00+01:00'), estimated: at('2026-11-27T23:00:00+01:00') },
      departure: { scheduled: at('2026-11-27T22:30:00+01:00'), estimated: at('2026-11-27T23:00:00+01:00') },
      platform: { confirmed: true, name: '2' },
    });
    expect(service.callsAfter).toHaveLength(9);
    expect(service.callsAfter![0]).toEqual({
      place: expect.objectContaining({ codes: { adif: '18002' } }),
      arrival: { scheduled: at('2026-11-27T22:34:30+01:00'), estimated: at('2026-11-27T23:04:30+01:00') },
    });
    expect(service.callsBefore?.map((call) => call.place.codes?.['adif'])).toEqual(['19003', '19002', '19001', '17009', '17001']);
    expect(service.formation).toEqual({ units: 2 });
    expect(adifExt(service)).toEqual({ id: '397488', traffic: 'C', products: ['C04CERMAD'] });
  });

  it('leaves a train that is not running yet without an estimate, and its usual platforms as a guess', () => {
    const service = byId('397646');
    expect(service.here?.departure).toEqual({ scheduled: at('2026-11-28T05:12:00+01:00') });
    expect(service.here?.platform).toEqual({ confirmed: false, candidates: ['4', '5'] });
  });

  it('keeps a cancelled train ending here, marked, with no departure and no range of platforms', () => {
    const service = byId('397513');
    expect(service.status).toBe('cancelled');
    expect(service.here?.activity).toBe('terminus');
    expect(service.here?.departure).toBeUndefined();
    expect(service.here?.arrival?.scheduled).toBe(at('2026-11-27T23:04:00+01:00'));
    expect(service.here?.platform).toBeUndefined();
    expect(service.callsAfter).toBeUndefined();
  });

  it('reads the platform a train arrives at, and who runs it', () => {
    const service = byId('397496');
    expect(service).toMatchObject({ operator: { id: 'iryo', name: 'IRYO' }, product: { id: 'iryo' } });
    expect(service.here?.platform).toEqual({ confirmed: true, name: '17' });
    expect(byId('397502').operator).toEqual({ id: 'ouigo', name: 'OUIGO' });
  });

  it('gives a train with two destinations one portion each, and every number it runs under', () => {
    const service = byId('397765');
    expect(service).toMatchObject({ number: '35432', aliases: [{ number: '75604' }], product: { id: 'regional' }, line: { name: 'C-8' } });
    expect(destinationsOf(service).map((place) => place.name)).toEqual(['Guadalajara', 'Almazán Villa']);

    const divides = byId('397710');
    expect(divides).toMatchObject({ number: '04087', aliases: [{ number: '04187' }], product: { id: 'intercity' } });
    expect(destinationsOf(divides).map((place) => place.name)).toEqual(['Bilbao Abando-Indalecio Prieto', 'Irun']);
    expect(destinationsOf(divides)[0]?.names).toContain('Bilbao Abando-I. Prieto');
  });

  it('leaves out of a departure the identity that only holds before this station', () => {
    const service = byId('397790');
    expect(service.number).toBe('05080');
    expect(service.aliases).toBeUndefined();
    const three = byId('397820');
    expect([three.number, ...(three.aliases ?? []).map((alias) => alias.number)]).toEqual(['05092', '32601']);
    expect(three.remarks).toEqual(['Tren Turístico Paleontológico y del Patrimonio de Cuenca.']);
  });

  it('starts the calls of a train starting here after this station', () => {
    const service = byId('397710');
    expect(service.here?.activity).toBe('origin');
    expect(service.here?.arrival).toBeUndefined();
    expect(service.callsBefore).toBeUndefined();
    expect(service.origin?.codes?.['adif']).toBe('17000');
  });

  it("takes the line from whichever identity names one, and a Civis's semi-fast flag", () => {
    const service = byId('397800');
    expect(service).toMatchObject({ number: '17123', product: { id: 'regional' }, line: { name: 'C-8B' }, flags: ['semi-fast'] });
    expect(service.here?.platform).toEqual({ confirmed: false, candidates: ['10', '11'] });
  });

  it('keeps only the traffic asked for', () => {
    const commuter = mapBoard(chamartin, ['C'])!;
    expect(commuter.services.every((service) => adifExt(service)?.traffic === 'C')).toBe(true);
    expect(commuter.services.length).toBeGreaterThan(0);
    const long = mapBoard(chamartin, ['R', 'L'])!;
    expect(long.services.length + commuter.services.length).toBe(11);
  });

  it('reads a station alert, in every language it comes in, for the traffic it is about', () => {
    const mapped = mapBoard(atocha)!;
    expect(mapped.notices).toHaveLength(1);
    expect(mapped.notices[0]?.severity).toBe('info');
    expect(text(mapped.notices[0]!.text, 'es')).toMatch(/^Los trenes Madrid - Ciudad Real - Puertollano salen de Atocha Cercanías/);
    expect(text(mapped.notices[0]!.text, 'en')).toMatch(/^Trains between Madrid/);
    // It is addressed to regional and long-distance trains only.
    expect(mapBoard(atocha, ['C'])!.notices).toEqual([]);
  });

  it('gives a train joined from two origins one portion each', () => {
    const service = mapBoard(atocha)!.services.find((candidate) => candidate.id === '126044')!;
    expect(service.portions?.map((portion) => portion.origin?.name)).toEqual(['Logroño', 'Pamplona/Iruña']);
    expect([service.number, ...(service.aliases ?? []).map((alias) => alias.number)]).toEqual(['00764', '00600']);
    expect(service.here?.activity).toBe('terminus');
  });

  it('finds the names of a board that drops the leading zero', () => {
    const mapped = mapBoard(jaen)!;
    expect(mapped.station).toMatchObject({ codes: { adif: '03100' }, name: 'Jaén' });
    expect(mapped.services.length).toBe(12);
    for (const service of mapped.services) {
      expect(service.destination?.name).toBeTruthy();
      expect(service.destination?.name).not.toMatch(/^\d+$/);
    }
  });

  it('maps every recorded train it can place in time, and nothing it cannot', () => {
    for (const recorded of [chamartin, atocha, jaen]) {
      const mapped = mapBoard(recorded)!;
      expect(mapped.services).toHaveLength(recorded.trains!.length);
      for (const service of mapped.services) expect(service.here?.departure ?? service.here?.arrival).toBeDefined();
    }
    expect(mapBoard({ trains: [{ id: 'x', class_stop: 'intermediate' }] })!.services).toEqual([]);
    expect(mapBoard({} as AdifBoard)).toBeNull();
  });
});

const RS = '\x1e';

class FakeSocket {
  static all: FakeSocket[] = [];
  static get last(): FakeSocket {
    return FakeSocket.all[FakeSocket.all.length - 1]!;
  }

  readyState = 0;
  sent: Record<string, unknown>[] = [];
  private listeners: Record<string, ((event: any) => void)[]> = {};

  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }

  addEventListener(type: string, listener: (event: any) => void): void {
    (this.listeners[type] ??= []).push(listener);
  }

  send(data: string): void {
    expect(data.endsWith(RS)).toBe(true);
    this.sent.push(JSON.parse(data.slice(0, -1)));
  }

  close(): void {
    this.readyState = 3;
  }

  private fire(type: string, event: unknown): void {
    for (const listener of this.listeners[type] ?? []) listener(event);
  }

  accept(): void {
    this.readyState = 1;
    this.fire('open', {});
  }

  /** Raw text, as one frame. */
  frame(data: string): void {
    this.fire('message', { data });
  }

  receive(...messages: unknown[]): void {
    this.frame(messages.map((message) => JSON.stringify(message) + RS).join(''));
  }

  /** The handshake, accepted. */
  handshake(): void {
    this.accept();
    this.receive({});
  }

  board(board: AdifBoard): void {
    this.receive({ type: 1, target: 'ReceiveMessage', arguments: [JSON.stringify(board)] });
  }

  drop(code = 1006): void {
    this.readyState = 3;
    this.fire('close', { code });
  }

  invocations(target?: string): Record<string, unknown>[] {
    return this.sent.filter((message) => message['type'] === 1 && (!target || message['target'] === target));
  }
}

describe('session', () => {
  const clock = new FixedClock(at('2026-11-27T23:00:00+01:00'));
  let statuses: [SourceStatus, string | undefined][];
  let snapshots: BoardSnapshot[];
  const handlers = {
    onSnapshot: (snapshot: BoardSnapshot) => snapshots.push(snapshot),
    onStatus: (status: SourceStatus, detail?: string) => statuses.push([status, detail]),
  };
  const open = (config: Record<string, unknown> = { station: '3100' }) => create(config, { clock }, { WebSocket: FakeSocket, random: () => 0.5 });
  const lastStatus = () => statuses[statuses.length - 1];

  beforeEach(() => {
    vi.useFakeTimers();
    FakeSocket.all = [];
    statuses = [];
    snapshots = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens nothing without a station', () => {
    open({ station: '' }).start(handlers);
    expect(statuses).toEqual([['idle', 'adif.needStation']]);
    expect(FakeSocket.all).toHaveLength(0);
  });

  it('speaks the hub protocol without negotiating, and reports the board', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    // No connection id: one that did not come from negotiate is refused.
    expect(socket.url).toBe('wss://info.adif.es/InfoStation');
    expect(statuses).toEqual([['connecting', undefined]]);
    socket.accept();
    expect(socket.sent).toEqual([{ protocol: 'json', version: 1 }]);
    socket.receive({});
    // The group needs the code's leading zero.
    expect(socket.invocations().map((call) => [call['target'], call['arguments']])).toEqual([
      ['JoinInfo', ['PRO-ECM-03100']],
      ['GetLastMessage', ['PRO-ECM-03100']],
    ]);
    socket.receive({ type: 3, invocationId: '0', result: null });
    socket.board(jaen);
    expect(lastStatus()).toEqual(['live', undefined]);
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      kind: 'board',
      generatedAt: clock.now(),
      station: { name: 'Jaén' },
      attribution: { name: 'Adif (info.adif.es)', url: 'https://info.adif.es/' },
    });
    expect(snapshots[0]!.services).toHaveLength(12);
    source.stop();
  });

  it('reads records split across frames and frames carrying several', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    socket.accept();
    socket.frame('{}' + RS + '{"type":6}' + RS + '{"type":1,"target":"Receive');
    expect(snapshots).toHaveLength(0);
    socket.frame(`Message","arguments":[${JSON.stringify(JSON.stringify(jaen))}]}${RS}`);
    expect(snapshots).toHaveLength(1);
    source.stop();
  });

  it('does not read again a board that comes again unchanged', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.handshake();
    FakeSocket.last.board(jaen);
    FakeSocket.last.board(jaen);
    expect(snapshots).toHaveLength(1);
    FakeSocket.last.board({ ...jaen, trains: jaen.trains!.slice(1) });
    expect(snapshots).toHaveLength(2);
    expect(snapshots[1]!.services).toHaveLength(11);
    source.stop();
  });

  it('keeps the traffic its settings ask for', () => {
    const source = open({ station: '17000', traffic: 'C' });
    source.start(handlers);
    FakeSocket.last.handshake();
    FakeSocket.last.board(chamartin);
    expect(snapshots[0]!.services.every((service) => adifExt(service)?.traffic === 'C')).toBe(true);
    source.stop();
  });

  it("ignores another station's board", () => {
    const source = open({ station: '17000' });
    source.start(handlers);
    FakeSocket.last.handshake();
    FakeSocket.last.board(jaen);
    expect(snapshots).toHaveLength(0);
    FakeSocket.last.board(chamartin);
    expect(snapshots).toHaveLength(1);
    source.stop();
  });

  it('asks again for a board the hub failed to produce, without giving up the feed', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    socket.handshake();
    socket.receive({ type: 3, invocationId: '1', error: 'HybridCache failure' });
    expect(lastStatus()).toEqual(['connecting', undefined]);
    vi.advanceTimersByTime(SNAPSHOT_RETRY_MS - 1);
    expect(socket.invocations('GetLastMessage')).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(socket.invocations('GetLastMessage')).toHaveLength(2);
    socket.board(jaen);
    expect(lastStatus()).toEqual(['live', undefined]);
    source.stop();
  });

  it('reports a refused subscription', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.handshake();
    FakeSocket.last.receive({ type: 3, invocationId: '0', error: 'Not allowed' });
    expect(lastStatus()).toEqual(['error', 'Not allowed']);
    source.stop();
  });

  it('pings, reports a station without a board, and asks again when the hub goes quiet', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    socket.handshake();
    vi.advanceTimersByTime(PING_MS);
    expect(socket.sent.filter((message) => message['type'] === 6)).toHaveLength(1);
    vi.advanceTimersByTime(DATA_TIMEOUT_MS - PING_MS);
    expect(lastStatus()).toEqual(['nodata', 'adif.nodata']);
    socket.board(jaen);
    expect(lastStatus()).toEqual(['live', undefined]);
    const asked = socket.invocations('GetLastMessage').length;
    vi.advanceTimersByTime(STALE_MS - 1);
    expect(socket.invocations('GetLastMessage')).toHaveLength(asked);
    vi.advanceTimersByTime(1);
    expect(socket.invocations('GetLastMessage')).toHaveLength(asked + 1);
    source.stop();
  });

  it('tells a refused connection from a lost one, and reconnects with a growing wait', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.accept();
    FakeSocket.last.drop();
    expect(lastStatus()).toEqual(['error', 'adif.error.refused']);
    vi.advanceTimersByTime(1999);
    expect(FakeSocket.all).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.all).toHaveLength(2);

    FakeSocket.last.drop();
    vi.advanceTimersByTime(3999);
    expect(FakeSocket.all).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.all).toHaveLength(3);

    // A handshake resets the wait.
    FakeSocket.last.handshake();
    FakeSocket.last.drop();
    expect(lastStatus()).toEqual(['error', 'adif.error.lost']);
    vi.advanceTimersByTime(2000);
    expect(FakeSocket.all).toHaveLength(4);

    source.stop();
    FakeSocket.last.drop();
    vi.advanceTimersByTime(120000);
    expect(FakeSocket.all).toHaveLength(4);
  });

  it('reports the hub closing the connection, and does not overwrite it', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.handshake();
    FakeSocket.last.receive({ type: 7, error: 'Server shutting down', allowReconnect: true });
    FakeSocket.last.drop(1000);
    expect(lastStatus()).toEqual(['error', 'Server shutting down']);
    source.stop();
  });

  it('can be stopped and started again, as when a tab is hidden', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.accept();
    source.stop();
    source.start(handlers);
    expect(FakeSocket.all).toHaveLength(2);
    FakeSocket.last.handshake();
    FakeSocket.last.board(jaen);
    expect(snapshots).toHaveLength(1);
    // The old socket's late messages and close are nobody's business now.
    FakeSocket.all[0]!.receive({});
    FakeSocket.all[0]!.board(jaen);
    FakeSocket.all[0]!.drop(1000);
    expect(snapshots).toHaveLength(1);
    vi.advanceTimersByTime(120000);
    expect(FakeSocket.all).toHaveLength(2);
    source.stop();
  });

  it('reports a browser without WebSocket', () => {
    const had = (globalThis as { WebSocket?: unknown }).WebSocket;
    (globalThis as { WebSocket?: unknown }).WebSocket = undefined;
    try {
      create({ station: '17000' }, { clock }).start(handlers);
      expect(lastStatus()).toEqual(['error', 'adif.error.unsupported']);
    } finally {
      (globalThis as { WebSocket?: unknown }).WebSocket = had;
    }
  });
});

describe('definition', () => {
  it('describes the source without loading it', async () => {
    expect(adifDef).toMatchObject({ id: 'adif', kind: 'live', label: 'adif.label', credit: 'adif.credit', provides: ['services'] });
    const module = await adifDef.load();
    expect(typeof module.create).toBe('function');
    expect(module.lookups?.['station']).toBe(lookups['station']);
  });

  it('reads the kinds of traffic to keep', () => {
    expect(readTraffic('CRL')).toEqual([]);
    expect(readTraffic('LR')).toEqual(['R', 'L']);
    expect(readTraffic('c')).toEqual(['C']);
    expect(readTraffic('')).toEqual([]);
    expect(readTraffic(undefined)).toEqual([]);
  });

  it('round-trips its settings through an embed URL', () => {
    const values = { station: '03100', traffic: 'RL' };
    const query = encode(adifDef.config, values);
    expect(query.toString()).toBe('station=03100&trafico=RL');
    expect(decode(adifDef.config, query)).toEqual(values);
    expect(encode(adifDef.config, { station: '17000', traffic: 'CRL' }).toString()).toBe('station=17000');
  });

  it('starts a Cercanías sign on Cercanías trains, and a long-distance board on the rest', () => {
    const fieldOf = (schema: ReturnType<typeof sourceSchema>) => schema.fields.find((field) => field.key === 'traffic');
    expect(fieldOf(sourceSchema(andenElectromagnetico, adifDef))).toMatchObject({ default: 'C' });
    expect(fieldOf(sourceSchema(mpElectronicsAdif, adifDef))).toMatchObject({ default: 'RL' });
  });
});
