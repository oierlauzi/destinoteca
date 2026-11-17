import { describe, expect, it } from 'vitest';
import {
  atTimeOfDay,
  bestTime,
  clockTime,
  delayMinutes,
  destinationsOf,
  eligible,
  expandPortions,
  fitName,
  fitNames,
  FixedClock,
  groupCoupled,
  minutesUntil,
  platformDigits,
  portionsOf,
  select,
  StationClock,
  windowOf,
  type BoardSnapshot,
  type Placement,
  type SelectionPolicy,
  type Service,
} from '../src/lib/model';

const upper = (value: string): string => value.toUpperCase();
const T0 = Date.UTC(2026, 10, 16, 9, 0, 0);
const min = (n: number): number => T0 + n * 60000;

describe('times', () => {
  it('prefers what happened over what was expected over what was planned', () => {
    expect(bestTime({ scheduled: 1, estimated: 2, actual: 3 })).toBe(3);
    expect(bestTime({ scheduled: 1, estimated: 2 })).toBe(2);
    expect(bestTime({ scheduled: 1 })).toBe(1);
    expect(bestTime(undefined)).toBeUndefined();
  });
  it('knows a delay only when it has a plan to compare with', () => {
    expect(delayMinutes({ scheduled: min(0), estimated: min(4) })).toBe(4);
    expect(delayMinutes({ scheduled: min(4), estimated: min(2) })).toBe(-2);
    expect(delayMinutes({ estimated: min(4) })).toBeUndefined();
    expect(delayMinutes({ scheduled: min(4) })).toBeUndefined();
  });
  it('counts whole minutes and never below zero', () => {
    expect(minutesUntil(min(6), T0)).toBe(6);
    expect(minutesUntil(T0 + 29000, T0)).toBe(0);
    expect(minutesUntil(T0 - 90000, T0)).toBe(0);
  });
  it('reads and finds times of day in the station zone', () => {
    // 09:00 UTC in mid-November is 10:00 in Madrid.
    expect(clockTime(T0, 'Europe/Madrid')).toBe('10:00');
    expect(clockTime(atTimeOfDay(T0, '08:15', 'Europe/Madrid')!, 'Europe/Madrid')).toBe('08:15');
    expect(atTimeOfDay(T0, '10:05', 'Europe/Madrid')).toBe(min(5));
    expect(atTimeOfDay(T0, 'soon', 'Europe/Madrid')).toBeUndefined();
  });
});

describe('station clock', () => {
  it('follows its base until someone who knows better anchors it', () => {
    const device = new FixedClock(T0);
    const clock = new StationClock(device);
    expect(clock.now()).toBe(T0);
    clock.anchor(min(-45));
    device.advance(60000);
    expect(clock.now()).toBe(min(-44));
    clock.anchor(min(100), true);
    device.advance(60000);
    expect(clock.now()).toBe(min(100));
    clock.release();
    expect(clock.now()).toBe(min(2));
  });
});

describe('fitting names', () => {
  const bilbao = { name: 'Bilbao-Abando Indalecio Prieto', names: ['Bilbao-Abando', 'Bilbao'] };
  it('takes the longest of a place’s own forms that fits', () => {
    expect(fitName(bilbao, 30, upper)).toBe('BILBAO-ABANDO INDALECIO PRIETO');
    expect(fitName(bilbao, 14, upper)).toBe('BILBAO-ABANDO');
    expect(fitName(bilbao, 8, upper)).toBe('BILBAO');
  });
  it('cuts the shortest form when none fits, without a dangling hyphen', () => {
    expect(fitName({ name: 'Bilbao-Abando' }, 7, upper)).toBe('BILBAO');
    expect(fitName({ name: 'Alcalá de Henares' }, 10)).toBe('Alcalá de');
  });
  it('fits two destinations of a train that divides', () => {
    const vigo = { name: 'Vigo-Guixar', names: ['Vigo'] };
    const coruna = { name: 'A Coruña-San Cristóbal', names: ['A Coruña', 'Coruña'] };
    expect(fitNames([vigo, coruna], 16, '/', upper)).toBe('VIGO/A CORUÑA');
    expect(fitNames([vigo, coruna], 11, '/', upper)).toBe('VIGO/CORUÑA');
    expect(fitNames([vigo, coruna], 7, '/', upper)).toBe('VIG/COR');
    expect(fitNames([vigo], 16, '/', upper)).toBe('VIGO-GUIXAR');
  });
  it('reads the number out of however a platform is written', () => {
    expect(platformDigits('04')).toBe('4');
    expect(platformDigits('PLATF.(4)')).toBe('4');
    expect(platformDigits('B')).toBeUndefined();
  });
});

const train = (id: string, dest: string, at: number, platform: string, extra: Partial<Service> = {}): Service => ({
  id,
  destination: { name: dest },
  here: { activity: 'calls', departure: { scheduled: at }, platform: { name: platform, confirmed: true } },
  ...extra,
});

const board = (services: Service[]): BoardSnapshot => ({ kind: 'board', generatedAt: T0, services });

const sign: SelectionPolicy = {
  events: 'departures', platforms: 'one', portions: 'merge', sortBy: 'expected', keepAfterMs: 30000, includeCancelled: false,
  window: { size: 1, mode: 'rotate', dwellMs: 6000, depth: 12 },
};
const concourse: SelectionPolicy = { ...sign, platforms: 'any', window: { size: 4, mode: 'page', dwellMs: 8000 } };
const anywhere: Placement = { platforms: [], cycle: true };

describe('selection', () => {
  const snapshot = board([
    train('c', 'Villalba', min(12), '2'),
    train('a', 'Chamartín', min(3), '1'),
    train('gone', 'Atocha', T0 - 31000, '1'),
    train('leaving', 'Aranjuez', T0 - 20000, '1'),
    train('b', 'Parla', min(7), '2', { status: 'cancelled' }),
    train('end', 'Here', min(5), '1', { here: { activity: 'terminus', arrival: { scheduled: min(5) }, platform: { name: '1' } } }),
    train('d', 'Guadalajara', min(15), '3', { here: { departure: { scheduled: min(15) }, platform: { name: '3', confirmed: false } } }),
    train('e', 'El Escorial', min(20), '1'),
    train('f', 'Humanes', min(25), '4'),
  ]);
  const ids = (services: Service[]): string[] => services.map((service) => service.id);

  it('orders by time, drops trains gone past their grace, terminating ones and cancelled ones', () => {
    expect(ids(eligible(snapshot, concourse, anywhere, T0))).toEqual(['leaving', 'a', 'c', 'd', 'e', 'f']);
    expect(ids(eligible(snapshot, { ...concourse, includeCancelled: true }, anywhere, T0))).toContain('b');
    expect(ids(eligible(snapshot, { ...concourse, events: 'arrivals' }, anywhere, T0))).toContain('end');
  });

  it('gives a platform sign the trains of its platform, one at a time', () => {
    const one: Placement = { platforms: ['1'], cycle: true };
    expect(ids(eligible(snapshot, sign, one, T0))).toEqual(['leaving', 'a', 'e']);
    expect(ids(select(snapshot, sign, one, T0, 0).services)).toEqual(['leaving']);
    expect(ids(select(snapshot, sign, one, T0, 1).services)).toEqual(['a']);
    expect(ids(select(snapshot, sign, one, T0, 3).services)).toEqual(['leaving']);
    expect(ids(select(snapshot, sign, { ...one, cycle: false }, T0, 2).services)).toEqual(['leaving']);
  });

  it('serves several platforms from one unit, and only confirmed ones', () => {
    expect(ids(eligible(snapshot, sign, { platforms: ['2', '03'], cycle: true }, T0))).toEqual(['c']);
  });

  it('gives a concourse board the whole station, a screenful at a time', () => {
    const first = select(snapshot, concourse, anywhere, T0, 0);
    expect(ids(first.services)).toEqual(['leaving', 'a', 'c', 'd']);
    expect(first.page).toEqual({ index: 0, count: 2 });
    expect(first.total).toBe(6);
    expect(ids(select(snapshot, concourse, anywhere, T0, 1).services)).toEqual(['e', 'f']);
    expect(ids(windowOf(eligible(snapshot, concourse, anywhere, T0), { ...concourse, window: { size: 4, mode: 'top', dwellMs: 0 } }, anywhere, 5).services))
      .toEqual(['leaving', 'a', 'c', 'd']);
  });

  it('lets the second board of a series carry on where the first stops', () => {
    const top = { ...concourse, window: { size: 4, mode: 'top' as const, dwellMs: 0 } };
    expect(ids(select(snapshot, top, anywhere, T0).services)).toEqual(['leaving', 'a', 'c', 'd']);
    expect(ids(select(snapshot, top, { ...anywhere, skip: 4 }, T0).services)).toEqual(['e', 'f']);
    expect(select(snapshot, top, { ...anywhere, skip: 8 }, T0).services).toEqual([]);
  });

  it('keeps hand-typed services without a time, in the order given, after the timed ones', () => {
    const typed = board([{ id: 'x', destination: { name: 'X' } }, train('a', 'A', min(3), '1'), { id: 'y', destination: { name: 'Y' } }]);
    expect(ids(eligible(typed, concourse, anywhere, T0))).toEqual(['a', 'x', 'y']);
  });

  it('shows an empty view when there is no snapshot yet', () => {
    expect(select(undefined, sign, anywhere, T0).services).toEqual([]);
  });
});

describe('trains that divide', () => {
  const vigo = { name: 'Vigo' };
  const coruna = { name: 'A Coruña' };
  const divided: Service = {
    ...train('t', 'Vigo', min(10), '4', { number: '00621', callsAfter: [{ place: { name: 'Ourense' } }] }),
    portions: [
      { destination: vigo, position: 'front' },
      { destination: coruna, number: '00623', position: 'rear', callsAfter: [{ place: { name: 'Lugo' } }] },
    ],
  };

  it('reads an ordinary train as a train of one portion', () => {
    const plain = train('p', 'Parla', min(1), '1', { number: '123' });
    expect(portionsOf(plain)).toHaveLength(1);
    expect(portionsOf(plain)[0]).toMatchObject({ number: '123', destination: { name: 'Parla' } });
    expect(destinationsOf(plain)).toEqual([{ name: 'Parla' }]);
  });

  it('fills each portion in from the train it belongs to', () => {
    const [front, rear] = portionsOf(divided);
    expect(front).toMatchObject({ number: '00621', destination: vigo, callsAfter: [{ place: { name: 'Ourense' } }] });
    expect(rear).toMatchObject({ number: '00623', destination: coruna, callsAfter: [{ place: { name: 'Lugo' } }] });
    expect(destinationsOf(divided)).toEqual([vigo, coruna]);
  });

  it('leaves out the destination of a portion cancelled on its own', () => {
    const half: Service = { ...divided, portions: [divided.portions![0]!, { ...divided.portions![1]!, status: 'cancelled' }] };
    expect(destinationsOf(half)).toEqual([vigo]);
  });

  it('stays one row when merged and becomes one row per destination otherwise', () => {
    const snapshot = board([divided]);
    expect(eligible(snapshot, concourse, anywhere, T0)).toHaveLength(1);
    const rows = eligible(snapshot, { ...concourse, portions: 'rows' }, anywhere, T0);
    expect(rows.map((row) => [row.id, row.destination?.name, row.number, row.here?.platform?.name])).toEqual([
      ['t#0', 'Vigo', '00621', '4'],
      ['t#1', 'A Coruña', '00623', '4'],
    ]);
    expect(expandPortions(train('p', 'Parla', min(1), '1'))).toHaveLength(1);
  });

  it('folds rows a source lists separately but marks as coupled', () => {
    const rows = [
      train('1', 'Vigo', min(10), '4', { coupling: 'k', number: '00621' }),
      train('other', 'Parla', min(11), '1'),
      train('2', 'A Coruña', min(10), '4', { coupling: 'k', number: '00623', status: 'cancelled' }),
      train('alone', 'Lugo', min(12), '2', { coupling: 'solo' }),
    ];
    const folded = groupCoupled(rows);
    expect(folded.map((service) => service.id)).toEqual(['1', 'other', 'alone']);
    expect(destinationsOf(folded[0]!).map((place) => place.name)).toEqual(['Vigo']);
    expect(folded[0]!.portions).toHaveLength(2);
    expect(folded[2]!.portions).toBeUndefined();
  });
});
