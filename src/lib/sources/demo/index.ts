import { DEFAULT_TIME_ZONE, type BoardSnapshot, type Place, type Service } from '../../model';
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

/** Six trains ahead of `now`, the same ones for the same seed. */
export function buildBoard(seed: number, now: number): Service[] {
  const services: Service[] = [];
  for (let i = 0; i < 6; i++) {
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
      destination: place(run),
      callsAfter: [1, 2, 3].map((k) => ({ place: place(RUNS[(pick + k * 3) % RUNS.length]!) })),
      status: late ? 'delayed' : 'on-time',
      here: {
        activity: 'calls',
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

export function create(config: Values, env: SourceEnv): SourceInstance {
  let timer: ReturnType<typeof setInterval> | undefined;
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
        let services = buildBoard(seed, origin).filter((s) => (s.here?.departure?.estimated ?? 0) > now - 30000);
        if (services.length < 3) {
          seed += 1;
          origin = now;
          services = buildBoard(seed, origin);
        }
        const snapshot: BoardSnapshot = {
          kind: 'board',
          generatedAt: now,
          station: { name: 'Estación de pruebas', country: 'es', timeZone: DEFAULT_TIME_ZONE },
          services,
        };
        handlers.onSnapshot(snapshot);
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
