import { describe, expect, it } from 'vitest';
import { FixedClock, StationClock, type BoardSnapshot, type Service, type View } from '../src/lib/model';
import { decode, defaults, encode, onlyAbout, sanitize, type ParamSchema, type Values } from '../src/lib/params';
import { RAW, readConfig, sourceSchema, writeConfig } from '../src/lib/player/config';
import { loadFresh } from '../src/lib/player/fresh';
import { ReplicaSession, SourceHub } from '../src/lib/player/session';
import { ManualTicker } from '../src/lib/player/ticker';
import { andenElectromagnetico as anden } from '../src/lib/replicas/page-iberica-anden-electromagnetico/def';
import { ikusiEuskotrenAnden as euskotrenAnden } from '../src/lib/replicas/ikusi-euskotren-anden/def';
import { ikusiMetroBilbaoAnden as metroBilbaoAnden } from '../src/lib/replicas/ikusi-metro-bilbao-anden/def';
import { present, blank } from '../src/lib/replicas/page-iberica-anden-electromagnetico/presenter';
import type { Frame, ReplicaImpl } from '../src/lib/replicas/types';
import { buildSnapshot } from '../src/lib/sources/manual';
import { EXAMPLE_ROWS } from '../src/lib/sources/manual/def';
import { create as createDevice, localZone } from '../src/lib/sources/device';
import { getSource, sources, sourcesFor } from '../src/lib/sources/registry';
import { relojCercanias as reloj } from '../src/lib/replicas/reloj-cercanias/def';
import { buildDemoBoard, networkOf, NETWORKS } from '../src/lib/sources/demo';
import { replicas } from '../src/lib/replicas/registry';
import type { SourceDef, SourceHandlers } from '../src/lib/sources/types';

const T0 = Date.UTC(2026, 10, 16, 9, 0, 0);

describe('settings codec', () => {
  const schema: ParamSchema = {
    fields: [
      { key: 'name', type: 'text', label: '', default: 'x', maxLength: 4 },
      { key: 'on', urlKey: 'o', type: 'boolean', label: '', default: true },
      { key: 'tint', type: 'color', label: '', default: '#e2d14a' },
      { key: 'speed', type: 'range', label: '', default: 14, min: 2, max: 30 },
      { key: 'rows', type: 'json', editor: 'x', label: '', default: [] },
    ],
  };
  it('leaves defaults out of the URL and reads them back', () => {
    expect(encode(schema, defaults(schema)).toString()).toBe('');
    const values: Values = { name: 'añ', on: false, tint: '#ff3b2e', speed: 20, rows: [{ dest: 'Coruña' }] };
    const query = encode(schema, values);
    expect(query.get('o')).toBe('0');
    expect(query.get('tint')).toBe('ff3b2e');
    expect(decode(schema, new URLSearchParams(query.toString()))).toEqual(values);
  });
  it('gives form-only switches no value and no place in the URL', () => {
    const withSwitch: ParamSchema = {
      fields: [{ type: 'switch', key: 'worn', label: '', controls: ['speed'], on: { speed: 20 } }, ...schema.fields],
    };
    expect(defaults(withSwitch)).toEqual(defaults(schema));
    expect(decode(withSwitch, new URLSearchParams('worn=1&speed=9'))).toEqual({ ...defaults(schema), speed: 9 });
    expect(encode(withSwitch, { ...defaults(schema), speed: 9, worn: true }).toString()).toBe('speed=9');
  });
  it('keeps only the settings a reader can use, switches and groups included', () => {
    const tagged: ParamSchema = {
      groups: [{ id: 'trains', label: '' }, { id: 'clock', label: '' }],
      fields: [
        { type: 'switch', key: 'rough', label: '', controls: ['speed'], on: { speed: 20 } },
        { key: 'speed', type: 'range', label: '', default: 14, min: 2, max: 30, about: ['services'], group: 'trains' },
        { key: 'hour', type: 'text', label: '', default: '', about: ['time'], group: 'clock' },
        { key: 'both', type: 'boolean', label: '', default: false },
      ],
    };
    const forClock = onlyAbout(tagged, ['time']);
    expect(forClock.fields.map((field) => field.key)).toEqual(['hour', 'both']);
    expect(forClock.groups?.map((group) => group.id)).toEqual(['clock']);
    // What was left out keeps its default and stays out of the URL.
    expect(defaults(forClock)).toEqual({ hour: '', both: false });
    expect(encode(forClock, { hour: '08:15', both: false, speed: 30 }).toString()).toBe('hour=08%3A15');
    // A reader of everything gets the schema untouched, switch and all.
    expect(onlyAbout(tagged, ['services', 'time'])).toBe(tagged);
  });
  it('falls back to defaults on anything unusable, and clamps', () => {
    const query = new URLSearchParams('name=abcdefg&tint=javascript:1&speed=999&rows=%7Bnot-base64');
    expect(decode(schema, query)).toEqual({ name: 'abcd', on: true, tint: '#e2d14a', speed: 30, rows: [] });
    expect(sanitize(schema, { speed: -5, name: 'toolong' })).toMatchObject({ speed: 2, name: 'tool' });
  });
});

describe('player configuration', () => {
  it('reads an embed made for the original replica as hand-typed text', () => {
    const config = readConfig(anden, new URLSearchParams('text=ATOCHA&min=3&via=2&dot=d9e04a&showoff=0&hearts=10'));
    expect(config.source).toBe(RAW);
    expect(config.frame).toMatchObject({ text: 'ATOCHA', minutes: '3', platform: '2' });
    expect(config.options).toMatchObject({ dotColor: '#d9e04a', showOffDots: false, hearts: 10 });
  });
  it('reads an original live embed as the live source, with its platform as the placement', () => {
    const config = readConfig(anden, new URLSearchParams('station=17000&via=4&cycle=0'));
    expect(config.source).toBe('mitren');
    expect(config.sourceConfig).toMatchObject({ station: '17000' });
    expect(config.placement).toEqual({ platforms: ['4'], cycle: false });
  });
  it('shows the original defaults with no parameters at all', () => {
    expect(readConfig(anden, new URLSearchParams()).frame).toMatchObject({ text: 'SIN PARADA', minutes: '1', platform: '1' });
  });
  it('keeps the wear settings of the original embeds, with no key for the switch', () => {
    const config = readConfig(anden, new URLSearchParams('deadon=5&deadoff=3&deadseed=7&hearts=10&deadPixels=0'));
    expect(config.options).toMatchObject({ deadOn: 5, deadOff: 3, deadSeed: 7, hearts: 10 });
    expect(config.options).not.toHaveProperty('deadPixels');
    expect([...writeConfig(anden, config).keys()].sort()).toEqual(['deadoff', 'deadon', 'deadseed', 'hearts']);
    expect(anden.options.fields.find((field) => field.type === 'switch')).toMatchObject({ controls: ['deadOn', 'deadOff'], on: { deadOn: 2, deadOff: 2 } });
  });
  it('starts a display on the feed its own signs carried', () => {
    // A sign of the Metro asks the live source for Metro Bilbao, and says so
    // in its URL only when something else is chosen.
    const bilbao = readConfig(metroBilbaoAnden, new URLSearchParams('source=mitren'));
    expect(bilbao.sourceConfig).toMatchObject({ feed: 'metro-bilbao', station: '' });
    expect([...writeConfig(metroBilbaoAnden, bilbao).keys()]).not.toContain('op');
    expect(readConfig(euskotrenAnden, new URLSearchParams('source=mitren')).sourceConfig).toMatchObject({ feed: 'euskotren' });
    expect(readConfig(anden, new URLSearchParams('source=mitren')).sourceConfig).toMatchObject({ feed: 'cercanias' });
    // What the URL states still wins over the display's own choice.
    const renfe = readConfig(metroBilbaoAnden, new URLSearchParams('source=mitren&op=cercanias&station=17000'));
    expect(renfe.sourceConfig).toMatchObject({ feed: 'cercanias', station: '17000' });
    expect(writeConfig(metroBilbaoAnden, renfe).get('op')).toBe('cercanias');
  });

  it('round-trips', () => {
    for (const query of ['text=HOLA&via=3&speed=20', 'source=demo&via=1%2C2&deadon=2.5', 'source=mitren&station=18000&network=madrid_cercanias&cycle=0']) {
      const config = readConfig(anden, new URLSearchParams(query));
      expect(readConfig(anden, writeConfig(anden, config))).toEqual(config);
    }
  });
});

describe('what a source knows and a display reads', () => {
  it('offers a board every source, and a clock only those that know the time', () => {
    expect(sources.every((source) => source.provides.length > 0)).toBe(true);
    expect(sourcesFor(anden.reads).map((source) => source.id)).toEqual(['demo', 'mitren', 'device', 'manual']);
    // No simulated board and no train feed on a clock: they know nothing it can show.
    expect(sourcesFor(reloj.reads).map((source) => source.id)).toEqual(['device', 'manual']);
  });

  it('asks a clock only about the time, and a board about everything', () => {
    const manual = getSource('manual')!;
    expect(sourceSchema(reloj, manual).fields.map((field) => field.key)).toEqual(['time', 'freeze']);
    expect(sourceSchema(anden, manual).fields.map((field) => field.key)).toContain('services');
    // What a clock cannot use never reaches its URL, however it was set.
    expect([...writeConfig(reloj, { ...readConfig(reloj, new URLSearchParams('source=manual&hora=08%3A15')), sourceConfig: { time: '08:15', services: EXAMPLE_ROWS } }).keys()]).toEqual(['source', 'hora']);
  });

  it('reads an older link that named a train feed as the clock it is', () => {
    // Clocks were once offered the simulation; the address still has to mean something.
    for (const query of ['source=demo&red=air', 'source=mitren&station=17000', 'station=17000']) {
      const config = readConfig(reloj, new URLSearchParams(query));
      expect(config.source, query).toBe('device');
      expect(readConfig(reloj, writeConfig(reloj, config)), query).toEqual(config);
    }
    // And a board still reads both as it always did.
    expect(readConfig(anden, new URLSearchParams('source=demo&red=air')).source).toBe('demo');
    expect(readConfig(anden, new URLSearchParams('station=17000')).source).toBe('mitren');
  });
});

describe('device clock source', () => {
  const start = (config: Values, now = T0) => {
    const times: { at: number; frozen?: boolean }[] = [];
    const boards: BoardSnapshot[] = [];
    const instance = createDevice(config, { clock: new FixedClock(now) });
    instance.start({
      onSnapshot: (snapshot) => void boards.push(snapshot),
      onStatus: () => {},
      onTime: (at, frozen) => void times.push({ at, frozen }),
    });
    instance.stop();
    return { times, boards };
  };

  it('tells the time of the device, in its own zone, and announces no trains', () => {
    const { times, boards } = start(defaults(getSource('device')!.config));
    expect(times).toEqual([]);
    expect(boards).toHaveLength(1);
    expect(boards[0]).toMatchObject({ generatedAt: T0, services: [], station: { timeZone: localZone() } });
  });

  it('keeps a chosen time of day, and carries the whole display with its drift', () => {
    const { times, boards } = start({ zone: 'Europe/Madrid', drift: -2.5 });
    expect(boards[0]!.station!.timeZone).toBe('Europe/Madrid');
    expect(times).toEqual([{ at: T0 - 150000, frozen: undefined }]);
    expect(boards[0]!.generatedAt).toBe(T0 - 150000);
  });
});

/** A replica implementation that records what it is asked to show. */
function recorder(): { impl: ReplicaImpl; frames: Frame[] } {
  const frames: Frame[] = [];
  const impl = {
    present: (view: View, options: Values) => present(view, options as never),
    blank: (view: View, options: Values) => blank(view, options as never),
    renderToString: () => '<svg/>',
    mount: () => ({ setFrame: (frame: Frame) => void frames.push(frame), setOptions: () => {}, destroy: () => {} }),
  } as unknown as ReplicaImpl;
  return { impl, frames };
}

const train = (id: string, dest: string, minutes: number, platform: string): Service => ({
  id,
  destination: { name: dest },
  here: { departure: { estimated: T0 + minutes * 60000 }, platform: { name: platform, confirmed: true } },
});

/** A source driven by hand from the test. */
function fakeSource(): { def: SourceDef; handlers: () => SourceHandlers; focus: string[][]; stopped: () => number } {
  let handlers: SourceHandlers | undefined;
  const focus: string[][] = [];
  let stops = 0;
  const def: SourceDef = {
    id: 'fake', label: '', kind: 'live', provides: ['services'], config: { fields: [] },
    load: async () => ({
      create: () => ({
        start: (h) => void (handlers = h),
        stop: () => void stops++,
        focus: (ids) => void focus.push(ids),
      }),
    }),
  };
  return { def, handlers: () => handlers!, focus, stopped: () => stops };
}

const snapshot = (services: Service[]): BoardSnapshot => ({ kind: 'board', generatedAt: T0, services });

describe('session', () => {
  const setup = async () => {
    const device = new FixedClock(T0);
    const hub = new SourceHub(new StationClock(device));
    const ticker = new ManualTicker();
    const { impl, frames } = recorder();
    const options = defaults(anden.options);
    const session = new ReplicaSession(anden, impl, {} as Element, hub, ticker, { options, placement: { platforms: [], cycle: true } });
    const source = fakeSource();
    await hub.setSource(source.def);
    return { device, hub, ticker, frames, session, source, options };
  };

  it('is dark until the source speaks, then shows the next train', async () => {
    const { ticker, frames, source, session } = await setup();
    expect(session.state.frame).toMatchObject({ text: '' });
    source.handlers().onSnapshot(snapshot([train('b', 'Parla', 9, '2'), train('a', 'Chamartín', 4, '1')]));
    ticker.advance(16);
    expect(frames.at(-1)).toMatchObject({ text: 'CHAMARTIN', minutes: '4', platform: '1' });
    expect(session.state.eligible.map((service) => service.id)).toEqual(['a', 'b']);
  });

  it('counts down on the station clock and steps through trains on the ticker', async () => {
    const { device, ticker, frames, source } = await setup();
    source.handlers().onSnapshot(snapshot([train('a', 'Chamartín', 4, '1'), train('b', 'Parla', 9, '2')]));
    ticker.advance(16);
    device.advance(60000);
    ticker.advance(600);
    expect(frames.at(-1)).toMatchObject({ text: 'CHAMARTIN', minutes: '3' });
    ticker.advance(6000);
    expect(frames.at(-1)).toMatchObject({ text: 'PARLA', minutes: '8', platform: '2' });
    ticker.advance(6000);
    expect(frames.at(-1)).toMatchObject({ text: 'CHAMARTIN' });
  });

  it('does not redraw a frame that has not changed', async () => {
    const { ticker, frames, source } = await setup();
    source.handlers().onSnapshot(snapshot([train('a', 'Chamartín', 4, '1')]));
    ticker.advance(16);
    const drawn = frames.length;
    for (let i = 0; i < 10; i++) ticker.advance(600);
    expect(frames).toHaveLength(drawn);
  });

  it('follows the time its source reports rather than the device', async () => {
    const { device, ticker, frames, source, hub } = await setup();
    // The device is a quarter of an hour fast.
    source.handlers().onTime?.(T0 - 15 * 60000);
    source.handlers().onSnapshot(snapshot([train('a', 'Chamartín', 4, '1')]));
    ticker.advance(16);
    expect(frames.at(-1)).toMatchObject({ minutes: '19' });
    device.advance(60000);
    expect(hub.clock.now()).toBe(T0 - 14 * 60000);
  });

  it('bolts to a platform, holds the next train, and takes hand-typed frames', async () => {
    const { ticker, frames, source, session, options } = await setup();
    source.handlers().onSnapshot(snapshot([train('a', 'Chamartín', 4, '1'), train('b', 'Parla', 9, '2'), train('c', 'Aranjuez', 12, '2')]));
    session.update({ options, placement: { platforms: ['2'], cycle: false } });
    expect(frames.at(-1)).toMatchObject({ text: 'PARLA', platform: '2' });
    ticker.advance(20000);
    expect(frames.at(-1)).toMatchObject({ text: 'PARLA' });
    session.update({ options, placement: { platforms: ['9'], cycle: true } });
    expect(frames.at(-1)).toEqual({ text: '', minutes: '', platform: '9', led: '' });
    session.update({ options, placement: { platforms: [], cycle: true }, raw: { text: 'HOLA', minutes: '', platform: '', led: '' } });
    expect(frames.at(-1)).toMatchObject({ text: 'HOLA' });
    expect(session.state.view).toBeUndefined();
  });

  it('tells the source which trains are on show and coming up', async () => {
    const { ticker, source } = await setup();
    source.handlers().onSnapshot(snapshot(['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => train(id, id, 2 + i, '1'))));
    ticker.advance(16);
    expect(source.focus.at(-1)).toEqual(['a', 'b', 'c', 'd']);
    ticker.advance(6000);
    expect(source.focus.at(-1)).toEqual(['b', 'c', 'd', 'e']);
  });

  it('forgets the previous source, its data and its time, on switching', async () => {
    const { hub, source, session, ticker } = await setup();
    source.handlers().onTime?.(T0 - 3600000);
    source.handlers().onSnapshot(snapshot([train('a', 'Chamartín', 4, '1')]));
    const old = source.handlers();
    await hub.setSource(undefined);
    expect(source.stopped()).toBe(1);
    expect(hub.clock.now()).toBe(T0);
    old.onSnapshot(snapshot([train('z', 'Fantasma', 1, '1')]));
    ticker.advance(600);
    expect(session.state.eligible).toEqual([]);
  });

  it('feeds two replicas from one hub, each with its own view', async () => {
    const { hub, ticker, frames, source } = await setup();
    const other = recorder();
    new ReplicaSession(anden, other.impl, {} as Element, hub, ticker, { options: defaults(anden.options), placement: { platforms: ['2'], cycle: false } });
    source.handlers().onSnapshot(snapshot([train('a', 'Chamartín', 4, '1'), train('b', 'Parla', 9, '2')]));
    ticker.advance(16);
    expect(frames.at(-1)).toMatchObject({ text: 'CHAMARTIN' });
    expect(other.frames.at(-1)).toMatchObject({ text: 'PARLA', platform: '2' });
  });
});

describe('manual source', () => {
  it('turns typed rows into services, with times, delay, state and portions', () => {
    const board = buildSnapshot(
      {
        services: [
          { dest: 'Chamartín', min: 6, via: '1', line: 'C-1', stops: 'Recoletos, Atocha ', delay: 2 },
          { dest: 'Vigo', time: '10:30', split: [{ dest: 'A Coruña', pos: 'rear' }], pos: 'front' },
          { dest: 'Parla', state: 'cancelled', via: '3', conf: false },
        ],
        notice: 'Aviso',
      },
      T0, T0, false,
    );
    const [a, b, c] = board.services;
    expect(a).toMatchObject({ destination: { name: 'Chamartín' }, status: 'delayed', line: { name: 'C-1' } });
    expect(a!.here!.departure).toEqual({ scheduled: T0 + 4 * 60000, estimated: T0 + 6 * 60000 });
    expect(a!.callsAfter!.map((call) => call.place.name)).toEqual(['Recoletos', 'Atocha']);
    // 10:30 in Madrid is 09:30 UTC in November.
    expect(b!.here!.departure).toEqual({ scheduled: T0 + 30 * 60000 });
    expect(b!.portions!.map((portion) => [portion.destination?.name, portion.position])).toEqual([['Vigo', 'front'], ['A Coruña', 'rear']]);
    expect(c).toMatchObject({ status: 'cancelled', here: { platform: { name: '3', confirmed: false } } });
    expect(board.notices).toEqual([{ text: 'Aviso' }]);
  });
  it('keeps saying "6 min" unless asked to count down', () => {
    const rows = { services: [{ dest: 'X', min: 6 }] };
    expect(buildSnapshot(rows, T0 + 120000, T0, false).services[0]!.here!.departure!.scheduled).toBe(T0 + 8 * 60000);
    expect(buildSnapshot({ ...rows, countdown: true }, T0 + 120000, T0, false).services[0]!.here!.departure!.scheduled).toBe(T0 + 6 * 60000);
  });
  it('takes a time already gone as tomorrow’s, unless the board time was set by hand', () => {
    const rows = { services: [{ dest: 'X', time: '08:15' }] };
    const day = 24 * 3600000;
    expect(buildSnapshot(rows, T0, T0, false).services[0]!.here!.departure!.scheduled).toBe(T0 - 105 * 60000 + day);
    expect(buildSnapshot(rows, T0, T0, true).services[0]!.here!.departure!.scheduled).toBe(T0 - 105 * 60000);
  });
});

describe('demo source', () => {
  it('builds the same board for the same seed, soonest first, on every network', () => {
    for (const network of NETWORKS) {
      const board = buildDemoBoard(network, 42, T0);
      expect(board, network.id).toEqual(buildDemoBoard(network, 42, T0));
      expect(board, network.id).toHaveLength(network.count);
      const times = board.map((service) => service.here!.departure!.estimated!);
      expect([...times].sort((a, b) => a - b), network.id).toEqual(times);
      expect(times[0], network.id).toBeGreaterThan(T0);
      // Every service goes somewhere, and belongs to the network it was asked for.
      for (const service of board) {
        expect(service.destination?.name, network.id).toBeTruthy();
        expect(service.mode, network.id).toBe(network.mode);
      }
    }
  });

  it('keeps the values of red= in old URLs, and falls back on one it does not know', () => {
    expect(NETWORKS.map((network) => network.id)).toEqual(['commuter', 'long-distance', 'air', 'metro-bilbao', 'euskotren']);
    expect(networkOf('nope')).toBe(networkOf('commuter'));
  });

  it('starts every replica on a network that exists', () => {
    for (const def of replicas) {
      const asked = def.sourceDefaults?.demo?.network;
      if (asked === undefined) continue;
      expect(NETWORKS.map((network) => network.id), def.id).toContain(asked);
    }
  });

  it('gives an airport flights: airlines, numbers, gates and check-in desks', () => {
    const flights = buildDemoBoard(networkOf('air'), 7, T0);
    for (const flight of flights) {
      expect(flight.operator?.shortName).toMatch(/^[A-Z0-9]{2,3}$/);
      expect(flight.number).toMatch(/^\d{4}$/);
      expect(flight.here?.platform?.name).toMatch(/^[A-Z]\d+$/);
      expect(flight.here?.allocations?.[0]).toMatchObject({ kind: 'check-in' });
      // A flight only departs or only lands: the two times are the same moment.
      expect(flight.here?.arrival?.scheduled).toBe(flight.here?.departure?.scheduled);
      // An arrivals board shows it coming from where the departures board sends it.
      expect(flight.origin?.name).toBe(flight.destination?.name);
    }
    // The first one is at its gate, so that the board says EMBARQUE or LLEGADA.
    expect(flights[0]!.presence).toBe('at-stop');
    expect(flights.some((flight) => flight.status === 'cancelled')).toBe(true);
    expect(flights.some((flight) => flight.status === 'delayed')).toBe(true);
  });

  it('gives Metro Bilbao its two lines, the cars its signs count, and bilingual notices', () => {
    const network = networkOf('metro-bilbao');
    const trains = buildDemoBoard(network, 5, T0);
    expect(new Set(trains.map((train) => train.line?.name))).toEqual(new Set(['L1', 'L2']));
    expect(trains.some((train) => (train.formation?.cars?.length ?? 0) >= 5)).toBe(true);
    expect(network.notices?.[0]?.text).toMatchObject({ eu: expect.any(String), es: expect.any(String) });
  });

  it('gives Euskotren its Basque destinations', () => {
    const trains = buildDemoBoard(networkOf('euskotren'), 11, T0);
    const basque = trains.map((train) => train.destination?.localized?.eu?.name ?? train.destination?.name);
    expect(basque).toContain('Bermeo');
    expect(basque.some((name) => name === 'Bilbo-Atxuri' || name === 'Donostia-Amara' || name === 'Hendaia')).toBe(true);
  });
});

describe('loading code from a redeployed site', () => {
  const env = () => {
    const kept = new Map<string, string>();
    let reloads = 0;
    return {
      storage: { getItem: (key: string) => kept.get(key) ?? null, setItem: (key: string, value: string) => void kept.set(key, value), removeItem: (key: string) => void kept.delete(key) },
      reload: () => void reloads++,
      reloads: () => reloads,
    };
  };
  const gone = () => Promise.reject(new Error('error loading dynamically imported module'));

  it('reloads the page once when a file has gone, then gives up', async () => {
    const page = env();
    let settled = false;
    void loadFresh('source:x', gone, page).then(() => (settled = true), () => (settled = true));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(page.reloads()).toBe(1);
    expect(settled).toBe(false);
    // The reloaded page fails the same way: no second reload, the error surfaces.
    await expect(loadFresh('source:x', gone, page)).rejects.toThrow('dynamically imported');
    expect(page.reloads()).toBe(1);
  });

  it('is ready to recover again after a load that worked', async () => {
    const page = env();
    void loadFresh('source:x', gone, page);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await expect(loadFresh('source:x', async () => 'code', page)).resolves.toBe('code');
    void loadFresh('source:x', gone, page);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(page.reloads()).toBe(2);
  });

  it('is not re-armed by something else loading fine after the reload', async () => {
    const page = env();
    void loadFresh('source:x', gone, page);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await loadFresh('replica:y', async () => 'code', page);
    await expect(loadFresh('source:x', gone, page)).rejects.toThrow();
    expect(page.reloads()).toBe(1);
  });

  it('never reloads where it could not tell a second failure from a first', async () => {
    await expect(loadFresh('source:x', gone, {})).rejects.toThrow();
  });
});
