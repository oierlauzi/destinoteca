import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FixedClock, nameLadder as placeLadder, type BoardSnapshot, type Service } from '../src/lib/model';
import { decode, encode } from '../src/lib/params';
import { mitrenDef } from '../src/lib/sources/mitren/def';
import {
  create,
  defaultNetwork,
  FEEDS,
  feedOf,
  findStation,
  findStationByName,
  identityOf,
  lookups,
  mapArrivals,
  mitrenExt,
  nameLadder,
  networkForCode,
  networksOf,
  remainingStops,
  searchStations,
  stationLookup,
  stationPlace,
  stationUrl,
  type SocketLike,
} from '../src/lib/sources/mitren';
import { DATA_TIMEOUT_MS, PING_MS, REFUSAL_HOLD_MS, SUBSCRIBE_GAP_MS } from '../src/lib/sources/mitren/client';
import type { SourceStatus } from '../src/lib/sources/types';
import arrivals from './fixtures/mitren/arrivals_update.json';
import metroArrivals from './fixtures/mitren/arrivals_metro_bilbao.json';
import euskotrenArrivals from './fixtures/mitren/arrivals_euskotren.json';
import trainUpdate from './fixtures/mitren/train_update.json';

const NETWORK = 'madrid_cercanias';
const chamartin = findStation(NETWORK, '17000');

describe('station list', () => {
  it('finds a station by network and code', () => {
    expect(chamartin?.name).toBe('Chamartín-Clara Campoamor');
    expect(findStation(NETWORK, '00000')).toBeUndefined();
  });

  it('finds the network of a bare code, for old embeds', () => {
    expect(networkForCode('17000')).toBe(NETWORK);
    expect(networkForCode(' 13200 ')).toBe('bilbao_aldiriak');
    expect(networkForCode('00000')).toBeUndefined();
  });

  it('searches without accents or case', () => {
    expect(searchStations('alcala henares')[0]?.name).toBe('Alcalá de Henares');
    expect(searchStations('CHAMARTIN')[0]?.code).toBe('17000');
    expect(searchStations('')).toEqual([]);
    expect(searchStations('zzzz')).toEqual([]);
  });

  it('searches by code prefix, exact code first', () => {
    const found = searchStations('1700', { limit: 20 });
    expect(found.length).toBeGreaterThan(1);
    expect(found.every((station) => station.code.startsWith('1700'))).toBe(true);
    expect(searchStations('17000')[0]?.code).toBe('17000');
  });

  it('matches towns and aliases, after names', () => {
    expect(searchStations('puerta de atocha')[0]?.code).toBe('18000');
    expect(searchStations('terminal 4')[0]?.name).toBe('Aeropuerto T4');
  });

  it('floats the preferred network up', () => {
    const anywhere = searchStations('san', { limit: 50 });
    const networks = new Set(anywhere.map((station) => station.network));
    expect(networks.size).toBeGreaterThan(1);
    const other = [...networks].find((network) => network !== anywhere[0]!.network)!;
    expect(searchStations('san', { network: other })[0]?.network).toBe(other);
  });

  it('gives every spelling of a name, longest first', () => {
    expect(nameLadder('Bilbao-Abando-Indalecio Prieto')).toEqual(['Bilbao-Abando-Indalecio Prieto', 'Bilbao-Abando', 'Abando']);
    // By any of its spellings, accents optional.
    expect(nameLadder('bilbao abando')[0]).toBe('Bilbao-Abando-Indalecio Prieto');
    expect(nameLadder('Ninguna Parte')).toEqual(['Ninguna Parte']);
  });

  it('links to the station on mitren.app', () => {
    expect(stationUrl(NETWORK, '17000')).toBe('https://mitren.app/madrid/cercanias/stations/17000');
    expect(stationUrl('nowhere', '17000')).toBe('https://mitren.app/');
  });
});

describe('feeds', () => {
  it("groups mitren.app's networks into the three the source offers", () => {
    expect([...FEEDS]).toEqual(['cercanias', 'euskotren', 'metro-bilbao']);
    expect(networksOf('metro-bilbao').map((network) => network.id)).toEqual(['bilbao_metro']);
    expect(networksOf('euskotren').map((network) => network.id)).toEqual([
      'donostia_euskotren',
      'bilbao_euskotren',
      'bilbao_tranbia',
      'vitoria-gasteiz_tranbia',
    ]);
    expect(networksOf('cercanias').length).toBeGreaterThan(15);
    expect(FEEDS.every((feed) => feedOf(defaultNetwork(feed)) === feed)).toBe(true);
  });

  it('tells which feed a network belongs to, and reads an unknown one as Cercanías', () => {
    expect(feedOf('bilbao_metro')).toBe('metro-bilbao');
    expect(feedOf('bilbao_tranbia')).toBe('euskotren');
    expect(feedOf('bilbao_aldiriak')).toBe('cercanias');
    expect(feedOf('nowhere')).toBe('cercanias');
  });

  it('looks a bare code up inside its own feed', () => {
    // Metro Bilbao numbers from 1, Euskotren has four digits, Renfe five.
    expect(networkForCode('10', 'metro-bilbao')).toBe('bilbao_metro');
    expect(networkForCode('10', 'cercanias')).toBeUndefined();
    expect(networkForCode('2577', 'euskotren')).toBe('bilbao_euskotren');
    expect(networkForCode('17000', 'cercanias')).toBe(NETWORK);
    expect(networkForCode('17000', 'metro-bilbao')).toBeUndefined();
    // Where two networks of one feed share a code, its default network wins.
    expect(networkForCode('2581', 'euskotren')).toBe('bilbao_euskotren');
  });

  it('searches one feed at a time: three operators serve a San Mamés', () => {
    expect(searchStations('san mames', { feed: 'cercanias' })[0]?.code).toBe('13208');
    expect(searchStations('san mames', { feed: 'metro-bilbao' })[0]?.code).toBe('10');
    expect(searchStations('san mames', { feed: 'euskotren' })[0]?.network).toBe('bilbao_tranbia');
    expect(searchStations('chamartin', { feed: 'metro-bilbao' })).toEqual([]);
  });

  it('reads a name within the feed of the network that is open', () => {
    expect(findStationByName('Basauri', 'bilbao_metro')?.code).toBe('51');
    expect(findStationByName('Basauri', 'bilbao_aldiriak')?.code).toBe('13112');
    // Another network of the same feed, for a destination off the board.
    expect(findStationByName('Zazpikaleak/Casco Viejo', 'bilbao_tranbia')?.network).toBe('bilbao_euskotren');
  });

  it('files a station code under the scheme it belongs to', () => {
    expect(stationPlace(findStation(NETWORK, '17000')!).codes).toEqual({ adif: '17000' });
    expect(stationPlace(findStation('bilbao_metro', '10')!).codes).toEqual({ 'metro-bilbao': '10' });
    expect(stationPlace(findStation('bilbao_euskotren', '2577')!).codes).toEqual({ euskotren: '2577' });
  });

  it('links to the station on mitren.app under the mode of its network', () => {
    expect(stationUrl('bilbao_metro', '10')).toBe('https://mitren.app/bilbao/metro/stations/10');
    expect(stationUrl('bilbao_euskotren', '2577')).toBe('https://mitren.app/bilbao/suburbano/stations/2577');
    expect(stationUrl('bilbao_tranbia', '1470')).toBe('https://mitren.app/bilbao/tranvia/stations/1470');
  });

  it('says whose trains a network carries', () => {
    expect(identityOf('bilbao_metro')).toMatchObject({ mode: 'metro', operator: { name: 'Metro Bilbao' } });
    expect(identityOf('bilbao_euskotren')).toMatchObject({ mode: 'rail', product: { name: 'Euskotren Trena' } });
    expect(identityOf('bilbao_tranbia')).toMatchObject({ mode: 'tram', product: { name: 'Euskotren Tranbia' } });
    expect(identityOf(NETWORK)).toMatchObject({ mode: 'rail', operator: { name: 'Renfe' } });
  });
});

describe('station lookup', () => {
  it('is the lookup the config schema names', () => {
    const field = mitrenDef.config.fields.find((f) => f.key === 'station');
    expect(field?.type === 'lookup' && lookups[field.lookup]).toBe(stationLookup);
  });

  it('returns items that bring their network along', () => {
    const [first] = stationLookup.search('chamartin', 3);
    expect(first).toMatchObject({
      value: '17000',
      label: 'Chamartín-Clara Campoamor',
      detail: 'Madrid · Cercanías Madrid',
      url: 'https://mitren.app/madrid/cercanias/stations/17000',
      set: { network: NETWORK },
    });
  });

  it('prefers the network already chosen', () => {
    const [first] = stationLookup.search('san', 5, { network: 'barcelona_rodalies' });
    expect(first?.set).toEqual({ network: 'barcelona_rodalies' });
  });

  it('searches the feed its settings name, and resolves a code within it', () => {
    const [first] = stationLookup.search('casco viejo', 3, { feed: 'metro-bilbao', network: '' });
    expect(first).toMatchObject({ value: '6', label: 'Zazpikaleak/Casco Viejo', set: { network: 'bilbao_metro' } });
    expect(stationLookup.search('chamartin', 3, { feed: 'euskotren', network: '' })).toEqual([]);
    expect(stationLookup.resolve('10', { feed: 'metro-bilbao', network: '' })?.label).toBe('San Mamés');
    expect(stationLookup.resolve('10', { feed: 'cercanias', network: '' })).toBeUndefined();
  });

  it('resolves a code with or without its network', () => {
    expect(stationLookup.resolve('17000')?.label).toBe('Chamartín-Clara Campoamor');
    expect(stationLookup.resolve('13200', { network: 'bilbao_aldiriak' })?.label).toBe('Bilbao-Abando-Indalecio Prieto');
    expect(stationLookup.resolve('17000', { network: 'bilbao_aldiriak' })).toBeUndefined();
    expect(stationLookup.resolve('')).toBeUndefined();
  });

  it('accepts a bare code it does not list, of any feed\'s length', () => {
    expect(stationLookup.accepts?.('99999')).toBe(true);
    expect(stationLookup.accepts?.('9999')).toBe(true);
    // Metro Bilbao numbers its stations from 1.
    expect(stationLookup.accepts?.('9')).toBe(true);
    expect(stationLookup.accepts?.('123456')).toBe(false);
    expect(stationLookup.accepts?.('Chamartín')).toBe(false);
  });

  it('round-trips its config through an embed URL, legacy keys included', () => {
    const legacy = decode(mitrenDef.config, new URLSearchParams('station=17000'));
    expect(legacy).toEqual({ feed: 'cercanias', station: '17000', network: '' });
    const query = encode(mitrenDef.config, { feed: 'cercanias', station: '13200', network: 'bilbao_aldiriak' });
    expect(query.toString()).toBe('station=13200&network=bilbao_aldiriak');
    const bilbao = encode(mitrenDef.config, { feed: 'metro-bilbao', station: '10', network: 'bilbao_metro' });
    expect(bilbao.toString()).toBe('op=metro-bilbao&station=10&network=bilbao_metro');
  });
});

describe('mapArrivals', () => {
  const services = mapArrivals(arrivals, chamartin, NETWORK)!;
  const byNumber = (number: string): Service => services.find((service) => service.number === number)!;

  it('keeps every usable row and drops those without a time', () => {
    expect(services).toHaveLength(6);
    expect(services.some((service) => service.number === '99999')).toBe(false);
    expect(new Set(services.map((service) => service.id)).size).toBe(6);
  });

  it('returns null for a message without a board', () => {
    expect(mapArrivals({ type: 'arrivals_update' }, chamartin, NETWORK)).toBeNull();
  });

  it('maps a live train at its confirmed platform', () => {
    expect(byNumber('23545')).toMatchObject({
      mode: 'rail',
      operator: { id: 'renfe', name: 'Renfe' },
      product: { id: 'cercanias', name: 'Cercanías', shortName: 'CERC', category: 'commuter' },
      line: { name: 'C4', color: '#2C2A86', textColor: '#FFFFFF' },
      number: '23545',
      destination: { id: 'madrid_cercanias/37012', name: 'Parla', codes: { adif: '37012' }, country: 'es' },
      here: {
        activity: 'calls',
        departure: { estimated: 1794826920000 },
        platform: { name: '8', confirmed: true },
      },
      presence: 'at-stop',
      ext: { mitren: { technicalId: 'C4-23545', realtime: true } },
    });
    // The board has no plan to compare against, so no schedule is invented.
    expect(byNumber('23545').here?.departure?.scheduled).toBeUndefined();
    expect(byNumber('23545').status).toBeUndefined();
    expect(byNumber('23412').presence).toBe('approaching');
  });

  it('gives the destination its ladder of shorter names', () => {
    const destination = byNumber('23412').destination!;
    expect(placeLadder(destination)).toEqual(['Alcobendas-San Sebastián de los Reyes', 'Alcobendas-S.S. Reyes']);
  });

  it('maps a timetabled train with a predicted platform', () => {
    const service = byNumber('21117');
    expect(service.here).toMatchObject({
      activity: 'origin',
      departure: { scheduled: 1794827400000 },
      platform: { name: '3', confirmed: false, candidates: ['3', '4'] },
    });
    expect(service.here?.departure?.estimated).toBeUndefined();
    // A timetabled row's "technical id" is a locator no train channel answers to.
    expect(mitrenExt(service)).toEqual({ technicalId: null, realtime: false });
  });

  it('keeps a train ending here, marked as a terminus', () => {
    const service = byNumber('28078');
    expect(service.here?.activity).toBe('terminus');
    expect(service.destination?.id).toBe('madrid_cercanias/17000');
  });

  it('keeps a cancelled train, marked as cancelled', () => {
    const service = byNumber('28081');
    expect(service.status).toBe('cancelled');
    expect(service.here?.platform).toBeUndefined();
  });

  it('copes with a row that has little more than a destination', () => {
    const service = services.find((s) => s.destination?.name === 'Colmenar Viejo')!;
    expect(service.line).toEqual({ name: 'C4' });
    expect(service.number).toBeUndefined();
    expect(service.here?.platform).toBeUndefined();
    expect(service.id).toBeTruthy();
  });

  it('keeps ids stable across updates, and through going live', () => {
    const later = structuredClone(arrivals);
    const row = later.arrivals.find((r) => r.identity?.public_number === '21117')!;
    row.is_realtime = true;
    row.epoch = Number(row.epoch) + 120;
    row.identity = { public_number: '21117', technical_id: 'C1-21117' };
    const again = mapArrivals(later, chamartin, NETWORK)!;
    expect(again.map((service) => service.id)).toEqual(services.map((service) => service.id));
  });
});

describe('mapArrivals of the other feeds', () => {
  it('maps a Metro Bilbao board: its own operator, mode and unit numbers', () => {
    const here = findStation('bilbao_metro', '10');
    const services = mapArrivals(metroArrivals, here, 'bilbao_metro')!;
    expect(services).toHaveLength(5);
    const [first] = services;
    expect(first).toMatchObject({
      mode: 'metro',
      operator: { id: 'metro-bilbao', name: 'Metro Bilbao' },
      product: { name: 'Metro' },
      line: { name: 'L2' },
      destination: { name: 'Basauri', id: 'bilbao_metro/51' },
    });
    // No public number on the Metro: the id falls back to the train channel's.
    expect(first!.number).toBeUndefined();
    expect(first!.id).toBe('t:515');
    expect(first!.here?.platform).toEqual({ name: '2', confirmed: true });
    expect(first!.here?.departure?.estimated).toBe(1795123459000);
  });

  it('maps a Euskotren board, with the line and the long form of the destination', () => {
    const here = findStation('bilbao_euskotren', '2577');
    const services = mapArrivals(euskotrenArrivals, here, 'bilbao_euskotren')!;
    expect(services).toHaveLength(3);
    expect(services[0]).toMatchObject({
      mode: 'rail',
      operator: { id: 'euskotren', name: 'Euskotren' },
      product: { name: 'Euskotren Trena' },
      line: { name: 'E3' },
      number: '15442420',
      destination: { name: 'Lezama' },
    });
    // Matiko is "Matiko-Bilbao" in full, and a narrow sign may show either.
    expect(services[1]!.destination).toMatchObject({ name: 'Matiko-Bilbao', names: ['Matiko'] });
  });
});

describe('remainingStops', () => {
  it('lists the calls after this station, without skipped ones', () => {
    const calls = remainingStops(trainUpdate.data, '17000', NETWORK)!;
    expect(calls.map((call) => call.place.name)).toEqual(['Universidad-Cantoblanco', 'Alcobendas-San Sebastián de los Reyes']);
    // The feed's own short name leads the ladder; the list's follow.
    expect(calls[0]!.place.names).toEqual(['Univ. Cantoblanco']);
    expect(calls[1]!.place.names).toEqual(['Alcobendas-S.S. Reyes']);
    expect(calls[1]!.place.id).toBe('madrid_cercanias/19003');
  });

  it('finds the station by stop id as well', () => {
    const calls = remainingStops({ stops: [{ stop_id: '17000', name: 'Aquí' }, { name: 'Allí' }] }, '17000', NETWORK);
    expect(calls?.map((call) => call.place.name)).toEqual(['Allí']);
  });

  it('is empty at the last stop', () => {
    expect(remainingStops(trainUpdate.data, '19003', NETWORK)).toEqual([]);
  });

  it('is null when the station is not on the list, or there is no list', () => {
    expect(remainingStops(trainUpdate.data, '70103', NETWORK)).toBeNull();
    expect(remainingStops(undefined, '17000', NETWORK)).toBeNull();
    expect(remainingStops({}, '17000', NETWORK)).toBeNull();
  });
});

/** Stands in for the browser's WebSocket; the test plays the server. */
class FakeSocket implements SocketLike {
  static all: FakeSocket[] = [];
  static get last(): FakeSocket {
    return FakeSocket.all[FakeSocket.all.length - 1]!;
  }

  readyState = 0;
  sent: Record<string, unknown>[] = [];
  closedWith: number | undefined;
  private listeners: Record<string, ((event: any) => void)[]> = {};

  constructor(readonly url: string) {
    FakeSocket.all.push(this);
  }

  addEventListener(type: string, listener: (event: any) => void): void {
    (this.listeners[type] ??= []).push(listener);
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data));
  }

  close(code?: number): void {
    this.closedWith = code;
    this.readyState = 3;
  }

  private fire(type: string, event: unknown): void {
    for (const listener of this.listeners[type] ?? []) listener(event);
  }

  accept(): void {
    this.readyState = 1;
    this.fire('open', {});
  }

  receive(message: unknown): void {
    this.fire('message', { data: JSON.stringify(message) });
  }

  drop(code: number): void {
    this.readyState = 3;
    this.fire('close', { code });
  }

  get subscriptions(): Record<string, unknown>[] {
    return this.sent.filter((message) => message['type'] === 'subscriptions');
  }
}

describe('session', () => {
  const clock = new FixedClock(1794826800000);
  let statuses: [SourceStatus, string | undefined][];
  let snapshots: BoardSnapshot[];
  const handlers = {
    onSnapshot: (snapshot: BoardSnapshot) => snapshots.push(snapshot),
    onStatus: (status: SourceStatus, detail?: string) => statuses.push([status, detail]),
  };
  const open = (config: Record<string, unknown> = { station: '17000', network: NETWORK }) =>
    create(config, { clock }, { WebSocket: FakeSocket, random: () => 0.5 });
  const lastSnapshot = () => snapshots[snapshots.length - 1]!;
  const idOf = (number: string) => lastSnapshot().services.find((service) => service.number === number)!.id;

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
    const source = open({ station: '', network: '' });
    source.start(handlers);
    expect(statuses).toEqual([['idle', 'mitren.needStation']]);
    expect(FakeSocket.all).toHaveLength(0);
    source.stop();
  });

  it('looks the network up for a bare station code', () => {
    open({ station: '13200' }).start(handlers);
    expect(FakeSocket.last.url).toBe('wss://mitren.app/api/ws/trains/bilbao_aldiriak?listing=0');
  });

  it('opens the socket of the feed that is chosen', () => {
    open({ station: '10', feed: 'metro-bilbao' }).start(handlers);
    expect(FakeSocket.last.url).toBe('wss://mitren.app/api/ws/trains/bilbao_metro?listing=0');
    open({ station: '2577', feed: 'euskotren' }).start(handlers);
    expect(FakeSocket.last.url).toBe('wss://mitren.app/api/ws/trains/bilbao_euskotren?listing=0');
    // The network named wins over the feed, so an old embed still opens its own.
    open({ station: '13200', feed: 'metro-bilbao', network: 'bilbao_aldiriak' }).start(handlers);
    expect(FakeSocket.last.url).toBe('wss://mitren.app/api/ws/trains/bilbao_aldiriak?listing=0');
  });

  it('falls back to the default network of the feed for a code it does not list', () => {
    open({ station: '999', feed: 'metro-bilbao' }).start(handlers);
    expect(FakeSocket.last.url).toBe('wss://mitren.app/api/ws/trains/bilbao_metro?listing=0');
  });

  it('subscribes, reports a board, follows trains and lays their calls on', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    expect(socket.url).toBe('wss://mitren.app/api/ws/trains/madrid_cercanias?listing=0');
    expect(statuses).toEqual([['connecting', undefined]]);

    socket.accept();
    expect(socket.sent).toEqual([]);
    socket.receive({ type: 'subscribed', nucleus: NETWORK, station_id: null });
    expect(socket.subscriptions).toEqual([{ type: 'subscriptions', station_ids: ['17000'], train_ids: [] }]);

    socket.receive(arrivals);
    expect(statuses[statuses.length - 1]).toEqual(['live', undefined]);
    expect(snapshots).toHaveLength(1);
    expect(lastSnapshot()).toMatchObject({
      kind: 'board',
      generatedAt: clock.now(),
      station: {
        id: 'madrid_cercanias/17000',
        codes: { adif: '17000' },
        name: 'Chamartín-Clara Campoamor',
        names: ['Chamartín'],
        town: 'Madrid',
        country: 'es',
        timeZone: 'Europe/Madrid',
      },
      attribution: { name: '¿Dónde está mi tren? (mitren.app)', url: 'https://mitren.app/' },
    });
    expect(lastSnapshot().services).toHaveLength(6);

    // A board for another station is not ours.
    socket.receive({ ...arrivals, station_id: '18000' });
    expect(snapshots).toHaveLength(1);

    // The first trains after the station-only opening are asked for at once.
    // A timetabled train (21117) has no channel to follow.
    source.focus?.([idOf('23412'), idOf('21117'), idOf('23545')], { services: 1, calls: true });
    expect(socket.subscriptions[1]).toEqual({
      type: 'subscriptions',
      station_ids: ['17000'],
      train_ids: ['C4-23412', 'C4-23545'],
    });

    // The same trains in another order are no change.
    source.focus?.([idOf('23545'), idOf('23412')], { services: 1, calls: true });
    vi.advanceTimersByTime(SUBSCRIBE_GAP_MS * 2);
    expect(socket.subscriptions).toHaveLength(2);

    socket.receive(trainUpdate);
    expect(snapshots).toHaveLength(2);
    const followed = lastSnapshot().services.find((service) => service.number === '23412')!;
    expect(followed.callsAfter?.map((call) => call.place.name)).toEqual([
      'Universidad-Cantoblanco',
      'Alcobendas-San Sebastián de los Reyes',
    ]);
    expect(lastSnapshot().services.find((service) => service.number === '23545')!.callsAfter).toBeUndefined();

    // A train nobody asked about is ignored.
    socket.receive({ ...trainUpdate, train_id: 'C9-1' });
    expect(snapshots).toHaveLength(2);

    // Calls survive the next board, and go when the train stops running.
    socket.receive(arrivals);
    expect(lastSnapshot().services.find((service) => service.number === '23412')!.callsAfter).toHaveLength(2);
    socket.receive({ type: 'train_removed', train_id: 'C4-23412' });
    expect(lastSnapshot().services.find((service) => service.number === '23412')!.callsAfter).toBeUndefined();

    source.stop();
    expect(socket.closedWith).toBe(1000);
  });

  it('spaces out changes to the followed set', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    socket.accept();
    socket.receive({ type: 'subscribed', nucleus: NETWORK, station_id: null });
    socket.receive(arrivals);
    source.focus?.([idOf('23545')], { services: 1, calls: true });
    expect(socket.subscriptions).toHaveLength(2);

    source.focus?.([idOf('23412')], { services: 1, calls: true });
    expect(socket.subscriptions).toHaveLength(2);
    vi.advanceTimersByTime(SUBSCRIBE_GAP_MS - 1);
    expect(socket.subscriptions).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(socket.subscriptions[2]?.['train_ids']).toEqual(['C4-23412']);

    // A display that shows no calling points follows no trains.
    source.focus?.([idOf('23412')], { services: 1, calls: false });
    vi.advanceTimersByTime(SUBSCRIBE_GAP_MS);
    expect(socket.subscriptions[3]?.['train_ids']).toEqual([]);
    source.stop();
  });

  it('follows no more trains than the server allows', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    socket.accept();
    socket.receive({ type: 'subscribed', nucleus: NETWORK, station_id: null, max_trains: 1 });
    socket.receive(arrivals);
    source.focus?.([idOf('23545'), idOf('23412')], { services: 2, calls: true });
    expect(socket.subscriptions[1]?.['train_ids']).toEqual(['C4-23545']);
    source.stop();
  });

  it('survives a refused change of subscriptions', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    socket.accept();
    socket.receive({ type: 'subscribed', nucleus: NETWORK, station_id: null });
    socket.receive(arrivals);
    source.focus?.([idOf('23545')], { services: 1, calls: true });
    socket.receive({ type: 'error', message: 'Subscription rate limit exceeded' });
    expect(statuses[statuses.length - 1]).toEqual(['live', undefined]);
    vi.advanceTimersByTime(REFUSAL_HOLD_MS - 1);
    expect(socket.subscriptions).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(socket.subscriptions).toHaveLength(3);
    expect(socket.subscriptions[2]?.['train_ids']).toEqual(['C4-23545']);
    source.stop();
  });

  it('pings, and reports a station that never answers', () => {
    const source = open();
    source.start(handlers);
    const socket = FakeSocket.last;
    socket.accept();
    socket.receive({ type: 'subscribed', nucleus: NETWORK, station_id: null });
    vi.advanceTimersByTime(DATA_TIMEOUT_MS);
    expect(statuses[statuses.length - 1]).toEqual(['nodata', 'mitren.nodata']);
    vi.advanceTimersByTime(PING_MS - DATA_TIMEOUT_MS);
    expect(socket.sent.filter((message) => message['type'] === 'ping')).toHaveLength(1);
    source.stop();
  });

  it('reconnects with a growing wait', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.accept();
    FakeSocket.last.drop(1006);
    expect(statuses[statuses.length - 1]).toEqual(['error', 'mitren.error.lost']);

    vi.advanceTimersByTime(1999);
    expect(FakeSocket.all).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.all).toHaveLength(2);
    expect(statuses[statuses.length - 1]).toEqual(['connecting', undefined]);

    FakeSocket.last.drop(1006);
    vi.advanceTimersByTime(3999);
    expect(FakeSocket.all).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.all).toHaveLength(3);

    // Being subscribed again resets the wait.
    FakeSocket.last.accept();
    FakeSocket.last.receive({ type: 'subscribed', nucleus: NETWORK, station_id: null });
    FakeSocket.last.drop(1006);
    vi.advanceTimersByTime(2000);
    expect(FakeSocket.all).toHaveLength(4);

    source.stop();
    FakeSocket.last.drop(1006);
    vi.advanceTimersByTime(120000);
    expect(FakeSocket.all).toHaveLength(4);
  });

  it('waits at least a minute when the server is full', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.accept();
    FakeSocket.last.receive({ type: 'error', message: 'Server busy: too many connections' });
    expect(statuses[statuses.length - 1]).toEqual(['error', 'mitren.error.busy']);
    FakeSocket.last.drop(1000);
    // The specific failure is not overwritten by a generic one.
    expect(statuses[statuses.length - 1]).toEqual(['error', 'mitren.error.busy']);
    vi.advanceTimersByTime(59999);
    expect(FakeSocket.all).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.all).toHaveLength(2);

    FakeSocket.last.drop(1013);
    vi.advanceTimersByTime(59999);
    expect(FakeSocket.all).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.all).toHaveLength(3);
    source.stop();
  });

  it('can be stopped and started again, as when a tab is hidden', () => {
    const source = open();
    source.start(handlers);
    FakeSocket.last.accept();
    source.stop();
    source.start(handlers);
    expect(FakeSocket.all).toHaveLength(2);
    const socket = FakeSocket.last;
    socket.accept();
    socket.receive({ type: 'subscribed', nucleus: NETWORK, station_id: null });
    socket.receive(arrivals);
    expect(snapshots).toHaveLength(1);
    // The old socket's late messages and close are nobody's business now.
    FakeSocket.all[0]!.receive(arrivals);
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
      expect(statuses[statuses.length - 1]).toEqual(['error', 'mitren.error.unsupported']);
    } finally {
      (globalThis as { WebSocket?: unknown }).WebSocket = had;
    }
  });
});

describe('definition', () => {
  it('offers the three feeds, and drops the station when another is picked', () => {
    const field = mitrenDef.config.fields.find((candidate) => candidate.key === 'feed');
    expect(field?.type).toBe('select');
    if (field?.type !== 'select') throw new Error('the feed field is a select');
    expect(field.choices.map((choice) => choice.value)).toEqual([...FEEDS]);
    expect(field.default).toBe('cercanias');
    expect(field.resets).toEqual(['station', 'network']);
  });

  it('describes the source without loading it', async () => {
    expect(mitrenDef).toMatchObject({ id: 'mitren', kind: 'live', label: 'mitren.label' });
    const module = await mitrenDef.load();
    expect(typeof module.create).toBe('function');
    expect(module.lookups?.['station']).toBe(stationLookup);
  });
});
