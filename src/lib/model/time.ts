import type { EventTime } from './types';

/**
 * Where "now" comes from. Injected everywhere, so that the same code can run
 * live, replay a past timetable, freeze for an export, or be tested. Nothing
 * else in src/lib may call Date.now().
 */
export interface Clock {
  now(): number;
}

export class RealClock implements Clock {
  now(): number {
    return Date.now();
  }
}

/** A clock stuck at one instant, movable by hand. For tests and exports. */
export class FixedClock implements Clock {
  constructor(private at: number) {}
  now(): number {
    return this.at;
  }
  set(at: number): void {
    this.at = at;
  }
  advance(ms: number): void {
    this.at += ms;
  }
}

/** Another clock, shifted. For showing a different time of day or era. */
export class OffsetClock implements Clock {
  constructor(
    private readonly base: Clock,
    private readonly offsetMs: number,
  ) {}
  now(): number {
    return this.base.now() + this.offsetMs;
  }
}

/**
 * The time of one display: "station time". Everything about a display reads
 * it (how long until a train, which trains have gone, a clock face), so they
 * can never disagree with each other.
 *
 * It follows a base clock, normally the viewer's device, unless whoever knows
 * better anchors it: a live feed reporting its server's time, or a hand-typed
 * board set at a quarter past eight on some morning.
 */
export class StationClock implements Clock {
  private offset = 0;
  private frozenAt: number | undefined;

  constructor(private readonly base: Clock = new RealClock()) {}

  now(): number {
    return this.frozenAt ?? this.base.now() + this.offset;
  }

  /** From this moment on it is `at`, and time runs on from there unless `frozen`. */
  anchor(at: number, frozen = false): void {
    this.offset = at - this.base.now();
    this.frozenAt = frozen ? at : undefined;
  }

  /** Back to the base clock. */
  release(): void {
    this.offset = 0;
    this.frozenAt = undefined;
  }

  get anchored(): boolean {
    return this.offset !== 0 || this.frozenAt !== undefined;
  }
}

/** The most informed reading of an event: what happened, else what is expected, else what was planned. */
export function bestTime(t: EventTime | undefined): number | undefined {
  if (!t) return undefined;
  return t.actual ?? t.estimated ?? t.scheduled;
}

/**
 * Delay in whole minutes, negative when early. Undefined when the source gave
 * no plan to compare against, which is not the same as "on time".
 */
export function delayMinutes(t: EventTime | undefined): number | undefined {
  if (!t || t.scheduled === undefined) return undefined;
  const real = t.actual ?? t.estimated;
  if (real === undefined) return undefined;
  return Math.round((real - t.scheduled) / 60000);
}

/**
 * Whole minutes from `now` until `at`, floored at 0: a train that is due
 * reads 0 rather than going negative.
 */
export function minutesUntil(at: number, now: number): number {
  return Math.max(0, Math.round((at - now) / 60000));
}

/** `HH:MM` in the given zone. Signs show station time, not the viewer's. */
export function clockTime(at: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).formatToParts(at);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * The instant at which a zone's wall clock reads `hhmm` ("08:15") on the same
 * day as `now`. Undefined for anything that is not a time of day.
 */
export function atTimeOfDay(now: number, hhmm: string, timeZone: string): number | undefined {
  const match = /^\s*(\d{1,2})[:.h](\d{2})\s*$/.exec(hhmm);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone,
  }).formatToParts(now);
  const read = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const sinceMidnight = (read('hour') * 3600 + read('minute') * 60 + read('second')) * 1000 + (now % 1000);
  return now - sinceMidnight + (hours * 60 + minutes) * 60000;
}

/** "8:5" typed by hand as "08:05". */
export function normalizeTimeOfDay(hhmm: string): string | undefined {
  const match = /^\s*(\d{1,2})[:.h](\d{2})\s*$/.exec(hhmm);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return undefined;
  return `${pad(Number(match[1]))}:${match[2]}`;
}
