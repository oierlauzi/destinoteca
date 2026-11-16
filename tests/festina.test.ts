import { describe, expect, it } from 'vitest';
import { defaults } from '../src/lib/params';
import { festinaAdif as def, type FestinaOptions } from '../src/lib/replicas/festina-adif/def';
import { angles, daySeconds, renderToString } from '../src/lib/replicas/festina-adif/render';

const options = defaults(def.options) as FestinaOptions;

describe('the Festina clock', () => {
  it('points its hands at the time of day', () => {
    expect(angles(3 * 3600)).toEqual({ hour: 90, minute: 0, second: 0 });
    expect(angles(10 * 3600 + 10 * 60 + 30.6)).toMatchObject({ minute: expect.closeTo(63.06, 2), second: 180 });
    // A quartz second hand jumps; a sweeping one does not.
    expect(angles(12.6, 'step').second).toBe(72);
    expect(angles(12.6, 'sweep').second).toBeCloseTo(75.6);
    expect(angles(15 * 3600).hour).toBe(90);
  });

  it('reads the time of day in the station zone', () => {
    // 09:12:00 UTC is 10:12:00 in Madrid in November.
    expect(daySeconds(Date.UTC(2026, 10, 16, 9, 12, 0), 'Europe/Madrid')).toBe(10 * 3600 + 12 * 60);
  });

  it('shows station time from any board, and rests at 10:10 with none', async () => {
    const impl = await def.load();
    const view = { now: Date.UTC(2026, 10, 16, 9, 12, 0), timeZone: 'Europe/Madrid', services: [], total: 0, notices: [], placement: { platforms: [], cycle: true } };
    expect(impl.present(view, options)).toEqual({ time: view.now, zone: 'Europe/Madrid' });
    expect(impl.blank({ ...view, now: 0 }, options)).toEqual({});
    expect(renderToString({}, options)).toContain('10:10');
  });

  it('draws its cases, the blue pieces and the second hand as asked', () => {
    expect(renderToString({}, options)).toContain('linearGradient');
    expect(renderToString({}, { ...options, case: 'square' })).not.toContain('linearGradient');
    // From 12 to 4 o'clock: about a third of the ring.
    expect(renderToString({}, { ...options, inlays: true }).match(/fill="#24318c"/g)).toHaveLength(5);
    // Dark by default; blue as at Zaragoza-Delicias.
    expect(options.secondHand).toBe('dark');
    expect(renderToString({}, options)).not.toContain('#2a34a8');
    expect(renderToString({}, { ...options, secondHand: 'blue' })).toContain('#2a34a8');
    expect(renderToString({}, { ...options, secondHand: 'none' }).match(/stroke="#1b1d33" stroke-width="1.3"/g)).toHaveLength(2);
  });
});
