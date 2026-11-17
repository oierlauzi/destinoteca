import { atTimeOfDay, DEFAULT_TIME_ZONE, type BoardSnapshot, type Call, type Place, type Service } from '../../model';
import type { Values } from '../../params';
import type { SourceEnv, SourceHandlers, SourceInstance } from '../types';
import type { ManualRow } from './def';

const place = (name: string): Place => ({ name: name.trim() });

const calls = (list: string | undefined): Call[] | undefined => {
  const names = (list ?? '').split(',').map((name) => name.trim()).filter(Boolean);
  return names.length ? names.map((name) => ({ place: place(name) })) : undefined;
};

const DAY = 24 * 3600 * 1000;

/**
 * Turns what was typed into services. `start` is when the board was set up:
 * with `countdown`, minutes are counted from then and so run down; without,
 * they are counted from now, and a board typed as "6 min" keeps saying so.
 */
export function buildSnapshot(config: Values, now: number, start: number, anchored: boolean): BoardSnapshot {
  const rows = Array.isArray(config.services) ? (config.services as ManualRow[]) : [];
  const from = config.countdown ? start : now;
  const services: Service[] = rows.map((row, index) => {
    let at: number | undefined;
    if (row.time) {
      at = atTimeOfDay(now, row.time, DEFAULT_TIME_ZONE);
      // With the board following the real time of day, a time already gone
      // can only mean tomorrow's train. With a hand-set time it means gone.
      if (at !== undefined && !anchored && at < now - 60000) at += DAY;
    } else if (typeof row.min === 'number' && Number.isFinite(row.min)) {
      at = from + row.min * 60000;
    }
    const delay = typeof row.delay === 'number' && Number.isFinite(row.delay) ? row.delay : undefined;
    const event =
      at === undefined ? undefined : delay === undefined ? { scheduled: at } : { scheduled: at - delay * 60000, estimated: at };
    let arrivalAt = row.arr ? atTimeOfDay(now, row.arr, DEFAULT_TIME_ZONE) : undefined;
    if (arrivalAt !== undefined && !anchored && arrivalAt < now - 60000) arrivalAt += DAY;
    const state = row.state ?? '';
    const portions = (row.split ?? []).filter((part) => part.dest?.trim());
    const service: Service = {
      id: `manual-${index}`,
      mode: 'rail',
      number: row.num || undefined,
      operator: row.op ? { name: row.op } : undefined,
      product: row.prod ? { name: row.prod } : undefined,
      line: row.line ? { name: row.line, color: row.color || undefined } : undefined,
      origin: row.origin ? place(row.origin) : undefined,
      destination: row.dest ? place(row.dest) : undefined,
      callsAfter: calls(row.stops),
      status: state === 'cancelled' ? 'cancelled' : delay ? 'delayed' : undefined,
      remarks: row.note ? [row.note] : undefined,
      here: {
        activity: state === 'passes' || state === 'terminus' || state === 'origin' ? state : 'calls',
        arrival: arrivalAt === undefined ? undefined : { scheduled: arrivalAt },
        departure: event,
        platform: row.via ? { name: row.via, confirmed: row.conf !== false } : undefined,
      },
    };
    if (portions.length) {
      service.portions = [
        { destination: service.destination, callsAfter: service.callsAfter, number: service.number, position: row.pos || undefined },
        ...portions.map((part) => ({
          destination: place(part.dest ?? ''),
          callsAfter: calls(part.stops),
          number: part.num || undefined,
          position: part.pos || undefined,
        })),
      ];
    }
    return service;
  });
  const notice = typeof config.notice === 'string' ? config.notice.trim() : '';
  const station = typeof config.station === 'string' && config.station.trim() ? config.station.trim() : undefined;
  return {
    kind: 'board',
    generatedAt: now,
    station: { name: station ?? '', timeZone: DEFAULT_TIME_ZONE },
    services,
    notices: notice ? [{ text: notice }] : undefined,
  };
}

export function create(config: Values, env: SourceEnv): SourceInstance {
  let timer: ReturnType<typeof setInterval> | undefined;
  return {
    start(handlers: SourceHandlers): void {
      // A board time typed by hand becomes the display's time, so that trains
      // given as "08:15" and a clock on the same display agree.
      const wanted = typeof config.time === 'string' ? atTimeOfDay(env.clock.now(), config.time, DEFAULT_TIME_ZONE) : undefined;
      if (wanted !== undefined) handlers.onTime?.(wanted, config.freeze === true);
      const start = env.clock.now();
      const emit = (): void => handlers.onSnapshot(buildSnapshot(config, env.clock.now(), start, wanted !== undefined));
      handlers.onStatus('live');
      emit();
      // Minutes counted from "now" have to be restated as now moves on.
      timer = setInterval(emit, 5000);
    },
    stop(): void {
      clearInterval(timer);
      timer = undefined;
    },
  };
}
