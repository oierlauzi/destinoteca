import { DEFAULT_TIME_ZONE, type BoardSnapshot } from '../../model';
import type { Values } from '../../params';
import type { SourceEnv, SourceHandlers, SourceInstance } from '../types';

/** The time zone the machine is set to, or the one Spanish stations keep if it will not say. */
export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIME_ZONE;
  } catch {
    // An environment without a time zone database.
    return DEFAULT_TIME_ZONE;
  }
}

/** Which time of day this source keeps: the machine's own, or the one that was chosen. */
export const zoneOf = (config: Values): string => (typeof config.zone === 'string' && config.zone !== 'local' ? config.zone : localZone());

/** How far off the display runs, in milliseconds, as a clock that was never put right. */
export function driftMs(config: Values): number {
  const minutes = Number(config.drift);
  return Number.isFinite(minutes) ? Math.round(minutes * 60000) : 0;
}

/** A station with no trains: all this source knows is what time it is there. */
export const deviceSnapshot = (config: Values, now: number): BoardSnapshot => ({
  kind: 'board',
  generatedAt: now,
  station: { name: '', timeZone: zoneOf(config) },
  services: [],
});

export function create(config: Values, env: SourceEnv): SourceInstance {
  return {
    start(handlers: SourceHandlers): void {
      const drift = driftMs(config);
      // A clock that runs fast or slow carries the whole display with it, so
      // that a countdown beside it agrees with its hands.
      if (drift) handlers.onTime?.(env.clock.now() + drift);
      handlers.onStatus('live');
      // There is nothing to report but the hour, and the display reads that
      // from the station clock: one snapshot says all this source will say.
      handlers.onSnapshot(deviceSnapshot(config, env.clock.now() + drift));
    },
    stop(): void {
      // Nothing was started.
    },
  };
}
