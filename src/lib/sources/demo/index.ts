import { DEFAULT_TIME_ZONE, type BoardSnapshot, type Notice, type Place, type Service } from '../../model';
import type { Values } from '../../params';
import type { SourceEnv, SourceHandlers, SourceInstance } from '../types';

/**
 * A made-up board, and labelled as such. It lets every part of a display be
 * tried (fitting names, the countdown, platforms, delays, a train that
 * divides) without a live feed, and gives the page something to show offline.
 */
interface DemoRun {
  name: string;
  short?: string;
  line: string;
  color: string;
}

const RUNS: DemoRun[] = [
  { name: 'Alcalá de Henares', short: 'Alcalá Henares', line: 'C-2', color: '#00943d' },
  { name: 'Guadalajara', line: 'C-2', color: '#00943d' },
  { name: 'Chamartín', line: 'C-1', color: '#4fb0e5' },
  { name: 'Príncipe Pío', line: 'C-7', color: '#de0118' },
  { name: 'Colmenar Viejo', line: 'C-4', color: '#2c2a86' },
  { name: 'Tres Cantos', line: 'C-4', color: '#2c2a86' },
  { name: 'Aranjuez', line: 'C-3', color: '#9f2e86' },
  { name: 'Parla', line: 'C-4', color: '#2c2a86' },
  { name: 'Fuenlabrada', line: 'C-5', color: '#fecb00' },
  { name: 'Humanes', line: 'C-5', color: '#fecb00' },
  { name: 'Villalba', line: 'C-8', color: '#868584' },
  { name: 'El Escorial', line: 'C-8', color: '#868584' },
  { name: 'Atocha Cercanías', short: 'Atocha', line: 'C-1', color: '#4fb0e5' },
  { name: 'Aeropuerto T4', line: 'C-1', color: '#4fb0e5' },
];

const place = (run: DemoRun): Place => ({ name: run.name, names: run.short ? [run.short] : undefined, country: 'es' });

const PLATFORMS = ['1', '2', '3', '4'];

function seedOf(station: string): number {
  return Array.from(station || '0').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

/**
 * Twenty-four trains ahead of `now`, the same ones for the same seed: enough
 * to fill a Cercanías board of twelve rows, or two hung together.
 */
export function buildBoard(seed: number, now: number): Service[] {
  const services: Service[] = [];
  for (let i = 0; i < 24; i++) {
    // The stride is coprime with the table length, or destinations would repeat every few rows.
    const pick = (seed + i * 5) % RUNS.length;
    const run = RUNS[pick]!;
    const late = (seed + i * 13) % 7 === 0 ? ((seed + i) % 9) + 1 : 0;
    const at = now + (120 + i * 240 + ((seed + i * 31) % 90)) * 1000;
    const service: Service = {
      id: `demo-${seed}-${i}`,
      mode: 'rail',
      operator: { id: 'renfe', name: 'Renfe' },
      product: { id: 'cercanias', name: 'Cercanías', shortName: 'CERC', category: 'commuter' },
      line: { name: run.line, color: run.color },
      number: String(10000 + ((seed + i * 137) % 89999)),
      // Through trains come from the other end of their line; one in a while starts here.
      origin: (seed + i) % 5 === 0 ? undefined : place(RUNS[(pick + 6) % RUNS.length]!),
      destination: place(run),
      callsAfter: [1, 2, 3].map((k) => ({ place: place(RUNS[(pick + k * 3) % RUNS.length]!) })),
      status: late ? 'delayed' : 'on-time',
      here: {
        activity: (seed + i) % 5 === 0 ? 'origin' : 'calls',
        arrival: (seed + i) % 5 === 0 ? undefined : { scheduled: at - 60000 - late * 60000, estimated: at - 60000 },
        departure: { scheduled: at - late * 60000, estimated: at },
        // The last trains on the board have no platform yet, as on a real one.
        platform: { name: PLATFORMS[(seed + i) % PLATFORMS.length]!, confirmed: i < 4 },
      },
    };
    // One train in a while divides on the way, to exercise that too.
    if ((seed + i * 11) % 9 === 0) {
      const other = RUNS[(pick + 7) % RUNS.length]!;
      service.portions = [
        { destination: service.destination, callsAfter: service.callsAfter, position: 'front' },
        { destination: place(other), callsAfter: [{ place: place(RUNS[(pick + 4) % RUNS.length]!) }], position: 'rear' },
      ];
    }
    services.push(service);
  }
  return services;
}

interface LongRun {
  name: string;
  names?: string[];
  product: string;
  /** Minutes the train takes from the previous call to here, for arrivals. */
  from: string;
  fromNames?: string[];
}

/** Long-distance and regional trains, as at a large station: AVE, IRYO, OUIGO, ALVIA, MD... */
const LONG_RUNS: LongRun[] = [
  { name: 'Madrid Puerta de Atocha', names: ['Madrid Pta. Atocha'], product: 'IRYO', from: 'Barcelona Sants' },
  { name: 'Figueres-Vilafant', product: 'AVE', from: 'Sevilla Santa Justa', fromNames: ['Sevilla Sta. Justa'] },
  { name: 'Sevilla Santa Justa', names: ['Sevilla Sta. Justa'], product: 'AVLO', from: 'Madrid Puerta de Atocha', fromNames: ['Madrid Pta. Atocha'] },
  { name: 'València Joaquín Sorolla', names: ['Valencia J.Sorolla'], product: 'OUIGO', from: 'Málaga María Zambrano', fromNames: ['Malaga M. Zambrano'] },
  { name: 'Bilbao Abando Indalecio Prieto', names: ['Bilbao Abando-I.P.', 'Bilbao'], product: 'ALVIA', from: 'Salamanca' },
  { name: 'Málaga María Zambrano', names: ['Malaga M. Zambrano'], product: 'AVE', from: 'Barcelona Sants' },
  { name: 'Castelló de la Plana', names: ['Castelló la Plana'], product: 'EUROMED', from: 'Alacant/Alicante Terminal', fromNames: ['Alacant/Alicante T'] },
  { name: 'Toledo', product: 'AVANT', from: 'Toledo' },
  { name: 'Zaragoza Delicias', product: 'MD', from: 'Huesca' },
  { name: 'A Coruña', product: 'ALVIA', from: 'Vigo Urzáiz', fromNames: ['Vigo Urzaiz'] },
  { name: 'León', product: 'AVLO', from: 'Valladolid Campo Grande', fromNames: ['Valladolid C. Gr.'] },
  { name: 'Alacant/Alicante Terminal', names: ['Alacant/Alicante T'], product: 'INTERCITY', from: 'Murcia del Carmen', fromNames: ['Murcia'] },
];

const SHORT: Record<string, string> = { INTERCITY: 'INTCITY' };

const named = (name: string, names?: string[]): Place => ({ name, names, country: 'es' });

/**
 * Twenty trains ahead of `now` at a large station, the same ones for the same
 * seed: enough for several boards hung together.
 */
export function buildLongDistanceBoard(seed: number, now: number): Service[] {
  const services: Service[] = [];
  for (let i = 0; i < 20; i++) {
    const pick = (seed + i * 5) % LONG_RUNS.length;
    const run = LONG_RUNS[pick]!;
    const at = now + (240 + i * 420 + ((seed + i * 31) % 300)) * 1000;
    const roll = (seed + i * 13) % 11;
    const late = roll === 0 || roll === 4 ? 6 + ((seed + i) % 25) : 0;
    const cancelled = roll === 7 && i > 1;
    const number = String(1000 + ((seed + i * 137) % 9000)).padStart(5, '0');
    const service: Service = {
      id: `demo-ld-${seed}-${i}`,
      mode: 'rail',
      operator: { id: run.product === 'IRYO' ? 'iryo' : run.product === 'OUIGO' ? 'ouigo' : 'renfe', name: run.product },
      product: { id: run.product.toLowerCase(), name: run.product, shortName: SHORT[run.product] ?? run.product, category: 'high-speed' },
      number,
      origin: named(run.from, run.fromNames),
      destination: named(run.name, run.names),
      status: cancelled ? 'cancelled' : late ? 'delayed' : 'on-time',
      here: {
        activity: 'calls',
        arrival: { scheduled: at - 3 * 60000 - late * 60000, estimated: at - 3 * 60000 },
        departure: { scheduled: at - late * 60000, estimated: at },
        // Long-distance platforms are announced shortly before the train.
        platform: { name: String(1 + ((seed + i * 3) % 14)), confirmed: i < 3 },
      },
    };
    // Now and then two trains run coupled under two numbers.
    if ((seed + i * 7) % 6 === 0) {
      service.product = { id: 'alvia', name: 'ALVIA', shortName: 'ALVIA', category: 'long-distance' };
      service.portions = [
        { number, destination: service.destination },
        { number: String(30000 + ((seed + i * 71) % 9999)), destination: service.destination },
      ];
    }
    services.push(service);
  }
  return services;
}

const LONG_NOTICES: Notice[] = [
  { text: 'Acceso a la sala de embarque 30 minutos antes de la salida', severity: 'info' },
];

/** A simulated station's picture, with its trains. */
export function demoSnapshot(long: boolean, services: Service[], now: number): BoardSnapshot {
  return {
    kind: 'board',
    generatedAt: now,
    station: { name: 'Estación de pruebas', country: 'es', timeZone: DEFAULT_TIME_ZONE },
    services,
    notices: long ? LONG_NOTICES : undefined,
  };
}

export function create(config: Values, env: SourceEnv): SourceInstance {
  let timer: ReturnType<typeof setInterval> | undefined;
  const long = config.network === 'long-distance';
  const board = long ? buildLongDistanceBoard : buildBoard;
  return {
    start(handlers: SourceHandlers): void {
      // Seeded from the station, so that each has its own stable board, and
      // from the hour, so that it changes over a visit without re-rolling
      // every few seconds.
      let seed = seedOf(String(config.station ?? '')) + Math.floor(env.clock.now() / 3600000);
      let origin = env.clock.now();
      const emit = (): void => {
        const now = env.clock.now();
        // Trains are fixed in time when the board is built and then leave one
        // by one; when few remain, a new board is drawn.
        let services = board(seed, origin).filter((s) => (s.here?.departure?.estimated ?? 0) > now - 30000);
        if (services.length < (long ? 8 : 3)) {
          seed += 1;
          origin = now;
          services = board(seed, origin);
        }
        handlers.onSnapshot(demoSnapshot(long, services, now));
      };
      handlers.onStatus('live', 'demo.simulated');
      emit();
      timer = setInterval(emit, 5000);
    },
    stop(): void {
      clearInterval(timer);
      timer = undefined;
    },
  };
}
