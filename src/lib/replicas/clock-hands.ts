import type { SelectField } from '../params';

/**
 * How the hands of an analogue clock move, shared by every replica that
 * draws one with a second hand.
 *
 * - `step`: a quartz movement; the second hand jumps once a second and the
 *   other hands creep on.
 * - `sweep`: everything turns smoothly.
 * - `ppm`: a slave clock driven by a minute pulse from a master clock. The
 *   second hand turns on its own, a little faster than once a minute, and
 *   waits at 12; the pulse sets it off again and moves the minute hand on
 *   by one minute, and the hour hand with it.
 */
export type HandMotion = 'step' | 'sweep' | 'ppm';

/**
 * How long the second hand of a minute-pulse clock takes to go round. What
 * these clocks take is not known; 58.5 seconds is what the Swiss station
 * clock takes, which made this way of moving famous.
 */
export const PPM_SWEEP_SECONDS = 58.5;

export interface Angles {
  hour: number;
  minute: number;
  second: number;
}

/** Where the hands point, in degrees from 12, for a time of day in seconds. */
export function angles(daySeconds: number, motion: HandMotion = 'step'): Angles {
  const s = ((daySeconds % 43200) + 43200) % 43200;
  if (motion === 'ppm') {
    const minutes = Math.floor(s / 60);
    const sweep = Math.min((s - minutes * 60) / PPM_SWEEP_SECONDS, 1);
    return { hour: (minutes / 60) * 30, minute: (minutes % 60) * 6, second: (sweep * 360) % 360 };
  }
  const second = motion === 'step' ? Math.floor(s % 60) : s % 60;
  return { hour: (s / 3600) * 30, minute: ((s / 60) % 60) * 6, second: second * 6 };
}

/** The wall-clock time of day, in seconds, of an instant in a time zone. */
export function daySeconds(time: number, zone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZone: zone }).formatToParts(time);
  const read = (type: string): number => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return read('hour') * 3600 + read('minute') * 60 + read('second') + (((time % 1000) + 1000) % 1000) / 1000;
}

/** The setting that picks the motion, the same on every clock: `marcha` in embed URLs. */
export function motionField(group?: string): SelectField {
  return {
    key: 'motion', urlKey: 'marcha', type: 'select', label: 'clock.opt.motion', help: 'clock.opt.motion.help', default: 'ppm',
    ...(group ? { group } : {}),
    choices: [
      { value: 'step', label: 'clock.motion.step' },
      { value: 'sweep', label: 'clock.motion.sweep' },
      { value: 'ppm', label: 'clock.motion.ppm' },
    ],
  };
}
