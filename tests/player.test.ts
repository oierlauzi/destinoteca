import { describe, expect, it } from 'vitest';
import { FixedClock, StationClock, type BoardSnapshot, type Service, type View } from '../src/lib/model';
import { decode, defaults, encode, sanitize, type ParamSchema, type Values } from '../src/lib/params';
import { RAW, readConfig, writeConfig } from '../src/lib/player/config';
import { ReplicaSession, SourceHub } from '../src/lib/player/session';
import { ManualTicker } from '../src/lib/player/ticker';
import { andenElectromagnetico as anden } from '../src/lib/replicas/page-iberica-anden-electromagnetico/def';
import { present, blank } from '../src/lib/replicas/page-iberica-anden-electromagnetico/presenter';
import type { Frame, ReplicaImpl } from '../src/lib/replicas/types';
import { buildSnapshot } from '../src/lib/sources/manual';
import { buildBoard } from '../src/lib/sources/demo';
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
  it('round-trips', () => {
    for (const query of ['text=HOLA&via=3&speed=20', 'source=demo&via=1%2C2&deadon=2.5', 'source=mitren&station=18000&network=madrid_cercanias&cycle=0']) {
      const config = readConfig(anden, new URLSearchParams(query));
      expect(readConfig(anden, writeConfig(anden, config))).toEqual(config);
    }
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
    id: 'fake', label: '', kind: 'live', config: { fields: [] },
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
  it('builds the same board for the same seed, soonest first', () => {
    const board = buildBoard(42, T0);
    expect(board).toEqual(buildBoard(42, T0));
    expect(board).toHaveLength(6);
    const times = board.map((service) => service.here!.departure!.estimated!);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(times[0]).toBeGreaterThan(T0);
  });
});
