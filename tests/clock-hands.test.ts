import { describe, expect, it } from 'vitest';
import { defaults, settingsOf, type SelectField } from '../src/lib/params';
import { angles, PPM_SWEEP_SECONDS } from '../src/lib/replicas/clock-hands';
import { getReplica } from '../src/lib/replicas/registry';

const at = (h: number, m: number, s: number): number => h * 3600 + m * 60 + s;

describe('the hands of a minute-pulse clock', () => {
  it('moves the minute hand only on the minute, and the hour hand with it', () => {
    expect(angles(at(10, 12, 0), 'ppm')).toEqual({ hour: 306, minute: 72, second: 0 });
    expect(angles(at(10, 12, 40), 'ppm')).toMatchObject({ hour: 306, minute: 72 });
    expect(angles(at(10, 13, 0), 'ppm')).toMatchObject({ hour: 306.5, minute: 78 });
  });

  it('sweeps the second hand round a little faster than once a minute', () => {
    expect(PPM_SWEEP_SECONDS).toBeLessThan(60);
    expect(angles(at(10, 12, PPM_SWEEP_SECONDS / 2), 'ppm').second).toBeCloseTo(180);
    // Smooth, not in steps.
    expect(angles(at(10, 12, 10.5), 'ppm').second).toBeGreaterThan(angles(at(10, 12, 10.2), 'ppm').second);
  });

  it('waits at 12 for the pulse', () => {
    expect(angles(at(10, 12, PPM_SWEEP_SECONDS), 'ppm').second).toBe(0);
    expect(angles(at(10, 12, 59.9), 'ppm')).toEqual({ hour: 306, minute: 72, second: 0 });
  });
});

describe('every clock with a second hand', () => {
  const clocks = ['festina-adif', 'reloj-cercanias', 'mp-electronics-adif-anden-reloj', 'mp-electronics-adif-anden-vertical', 'ikusi-metro-bilbao-anden'];

  it.each(clocks)('%s offers the same motions under the same URL key, stepping by default', (id) => {
    const field = settingsOf(getReplica(id)!.options).find((f) => f.key === 'motion') as SelectField;
    expect(field.urlKey).toBe('marcha');
    expect(field.choices.map((c) => c.value)).toEqual(['step', 'sweep', 'ppm']);
    expect(defaults(getReplica(id)!.options).motion).toBe('step');
  });

  it.each(clocks)('%s draws its hands where the motion puts them', async (id) => {
    const def = getReplica(id)!;
    const impl = await def.load();
    const now = Date.UTC(2026, 10, 16, 9, 12, 7, 300);
    const options = defaults(def.options);
    const frame = { ...impl.blank({ now, timeZone: 'Europe/Madrid', services: [], total: 0, notices: [], placement: { platforms: [], cycle: true } }, options), time: now, clock: now, zone: 'Europe/Madrid' };
    expect(impl.renderToString(frame, { ...options, motion: 'ppm' })).not.toBe(impl.renderToString(frame, options));
  });

  it('leaves the motion off the platform sign without a clock', () => {
    expect(settingsOf(getReplica('mp-electronics-adif-anden')!.options).some((f) => f.key === 'motion')).toBe(false);
  });
});
