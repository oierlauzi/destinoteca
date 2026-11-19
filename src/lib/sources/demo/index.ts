import type { Values } from '../../params';
import type { SourceEnv, SourceHandlers, SourceInstance } from '../types';
import { buildDemoBoard, demoSnapshot } from './board';
import { networkOf } from './networks';

/**
 * A made-up board, and labelled as such. It lets every part of a display be
 * tried (fitting names, the countdown, platforms, delays, a train that
 * divides) without a live feed, and gives the page something to show
 * offline.
 *
 * What runs on it is one of the networks in networks.ts, so that a display
 * is fed what it was built to announce: flights on an airport board, the
 * next two metro trains on a Metro Bilbao platform sign.
 */

export { buildDemoBoard, demoSnapshot } from './board';
export { DEFAULT_NETWORK, NETWORKS, networkOf, type DemoNetwork } from './networks';

function seedOf(station: string): number {
  return Array.from(station || '0').reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

export function create(config: Values, env: SourceEnv): SourceInstance {
  let timer: ReturnType<typeof setInterval> | undefined;
  const network = networkOf(config.network);
  return {
    start(handlers: SourceHandlers): void {
      // Seeded from the station, so that each has its own stable board, and
      // from the hour, so that it changes over a visit without re-rolling
      // every few seconds.
      let seed = seedOf(String(config.station ?? '')) + Math.floor(env.clock.now() / 3600000);
      let origin = env.clock.now();
      const emit = (): void => {
        const now = env.clock.now();
        // Services are fixed in time when the board is built and then leave
        // one by one; when few remain, a new board is drawn.
        let services = buildDemoBoard(network, seed, origin).filter((service) => (service.here?.departure?.estimated ?? 0) > now - 30000);
        if (services.length < network.refill) {
          seed += 1;
          origin = now;
          services = buildDemoBoard(network, seed, origin);
        }
        handlers.onSnapshot(demoSnapshot(network, services, now));
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
