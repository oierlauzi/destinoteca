import type { BoardSnapshot, Call, Place, Service } from '../../model';
import type { DemoNetwork, DemoPlace, DemoRun } from './networks';

/**
 * One board of a network (networks.ts) drawn from a seed. The table says
 * what runs and how; everything here is what every network has in common,
 * so that a new one is an entry in the table and no code.
 */

/**
 * Every choice on a board has a stride of its own, so that two of them
 * never move together: the platform does not follow the delay.
 */
const STRIDE = { run: 5, jitter: 31, number: 137, late: 13, cancel: 19, platform: 3, origin: 11, divide: 7, couple: 23, cars: 29, counter: 37 } as const;

type Choice = keyof typeof STRIDE;

/** The dice of one row. */
interface Dice {
  /** A number from 0 to `span - 1`. */
  pick(span: number, of: Choice): number;
  /** True one time in `n`. */
  oneIn(n: number, of: Choice): boolean;
  /** One of a list, which is never empty. */
  from<T>(list: readonly T[], of: Choice): T;
}

/**
 * Rolled from the seed and the row alone, so that the same seed always
 * draws the same board and a station keeps its own.
 */
function diceFor(seed: number, row: number): Dice {
  const roll = (of: Choice): number => seed + row * STRIDE[of];
  return {
    pick: (span, of) => roll(of) % span,
    oneIn: (n, of) => roll(of) % n === 0,
    from: (list, of) => list[roll(of) % list.length]!,
  };
}

const placeOf = (place: DemoPlace): Place => ({
  name: place.name,
  names: place.names,
  localized: place.eu ? { eu: place.eu } : undefined,
  country: place.country ?? 'es',
});

const runAt = (network: DemoNetwork, index: number): DemoRun => network.runs[index % network.runs.length]!;

/** Where a service comes from, as the network says it is to be read. */
function originOf(network: DemoNetwork, run: DemoRun, index: number): Place | undefined {
  const origin = network.origin;
  if (origin === undefined) return undefined;
  if (origin === 'mirror') return placeOf(run);
  if (origin === 'stated') return run.from && placeOf(run.from);
  return placeOf(runAt(network, index + origin.away));
}

function serviceOf(network: DemoNetwork, seed: number, row: number, now: number): Service {
  const dice = diceFor(seed, row);
  const index = dice.pick(network.runs.length, 'run');
  const run = runAt(network, index);
  const brand = (run.brand === undefined ? undefined : network.brands?.[run.brand]) ?? network.brand ?? {};
  const { lead, headway, jitter } = network.timing;
  const at = now + (lead + row * headway + dice.pick(jitter, 'jitter')) * 1000;
  const late = network.delays !== undefined && dice.oneIn(network.delays.oneIn, 'late') ? network.delays.min + dice.pick(network.delays.span, 'late') : 0;
  const cancelled = network.cancels !== undefined && row >= network.cancels.after && dice.oneIn(network.cancels.oneIn, 'cancel');
  const starts = network.startsHere !== undefined && dice.oneIn(network.startsHere.oneIn, 'origin');
  const dwell = network.dwell * 1000;
  const destination = placeOf(run);
  const calls = network.calls;
  const callsAfter = calls && Array.from({ length: calls.count }, (_, k): Call => ({ place: placeOf(runAt(network, index + (k + 1) * calls.every)) }));
  const number = network.number && String(network.number.from + dice.pick(network.number.span, 'number')).padStart(network.number.pad ?? 0, '0');
  const cars = network.cars && dice.from(network.cars, 'cars');
  const service: Service = {
    id: `demo-${network.id}-${seed}-${row}`,
    mode: network.mode,
    operator: brand.operator,
    product: brand.product,
    line: run.line === undefined ? undefined : { name: run.line, color: run.color },
    number,
    // A service that starts here comes from nowhere, and has no arrival.
    origin: starts ? undefined : originOf(network, run, index),
    destination,
    callsAfter,
    status: cancelled ? 'cancelled' : late ? 'delayed' : 'on-time',
    presence: row < (network.atStop ?? 0) ? 'at-stop' : undefined,
    formation: cars === undefined ? undefined : { cars: Array.from({ length: cars }, () => ({})) },
    here: {
      activity: starts ? 'origin' : 'calls',
      arrival: starts ? undefined : { scheduled: at - dwell - late * 60000, estimated: at - dwell },
      departure: { scheduled: at - late * 60000, estimated: at },
      // The last services on the board have no platform yet, as on a real one.
      platform: { name: dice.from(network.platforms.names, 'platform'), confirmed: row < (network.platforms.confirmed ?? network.count) },
      allocations: network.counters && [{ kind: network.counters.kind, name: dice.from(network.counters.names, 'counter') }],
    },
  };
  const divides = network.divides;
  if (divides !== undefined && dice.oneIn(divides.oneIn, 'divide')) {
    service.portions = [
      { destination, callsAfter, position: 'front' },
      { destination: placeOf(runAt(network, index + divides.away)), callsAfter: [{ place: placeOf(runAt(network, index + divides.calling)) }], position: 'rear' },
    ];
  }
  const couples = network.couples;
  if (couples !== undefined && dice.oneIn(couples.oneIn, 'couple')) {
    if (couples.product !== undefined) service.product = couples.product;
    service.portions = [
      { number, destination },
      { number: String(couples.number.from + dice.pick(couples.number.span, 'couple')), destination },
    ];
  }
  return service;
}

/**
 * A network's next services ahead of `now`, the same ones for the same
 * seed, soonest first: enough to fill its widest display, or two of them
 * hung together.
 */
export function buildDemoBoard(network: DemoNetwork, seed: number, now: number): Service[] {
  return Array.from({ length: network.count }, (_, row) => serviceOf(network, seed, row, now));
}

/** A simulated station's picture, with its services and whatever it has to announce. */
export function demoSnapshot(network: DemoNetwork, services: Service[], now: number): BoardSnapshot {
  return {
    kind: 'board',
    generatedAt: now,
    station: network.station,
    services,
    notices: network.notices,
  };
}
