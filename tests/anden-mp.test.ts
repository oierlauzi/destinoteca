import { describe, expect, it } from 'vitest';
import type { Service, View } from '../src/lib/model';
import { defaults, type ParamSchema } from '../src/lib/params';
import { readConfig, writeConfig } from '../src/lib/player/config';
import { andenMp, andenMpReloj, andenMpVertical, type AndenOptions } from '../src/lib/replicas/mp-electronics-adif-anden/def';
import { layout } from '../src/lib/replicas/mp-electronics-adif-anden/geometry';
import { present } from '../src/lib/replicas/mp-electronics-adif-anden/presenter';
import { renderToString } from '../src/lib/replicas/mp-electronics-adif-anden/render';

const NOW = Date.UTC(2026, 10, 16, 11, 0, 0);

describe('MP Electronics platform displays', () => {
  it('put the platform and the stripe on the chosen side, and the clock at the other end', () => {
    for (const kind of ['plain', 'clock', 'vertical'] as const) {
      const left = layout(kind, 'left');
      const right = layout(kind, 'right');
      expect(left.stripe.x).toBeLessThan(left.width / 2);
      expect(right.stripe.x).toBeGreaterThan(right.width / 2);
      expect(right.stripe.x).toBeCloseTo(left.width - left.stripe.x - left.stripe.width);
      if (left.clock) {
        expect(left.clock.cx).toBeGreaterThan(left.width / 2);
        expect(right.clock!.cx).toBeLessThan(right.width / 2);
      }
    }
    expect(layout('plain', 'left').clock).toBeUndefined();
  });

  it('draw Festina or MP Electronics dials, and no clock on the plain one', async () => {
    const frame = defaults(andenMpReloj.frame as ParamSchema);
    const festina = renderToString('clock', { time: '', train: '', destination: '', line: '', platform: '3' }, defaults(andenMpReloj.options) as AndenOptions);
    const mp = renderToString('clock', { time: '', train: '', destination: '', line: '', platform: '3' }, { ...(defaults(andenMpReloj.options) as AndenOptions), dial: 'mp' });
    expect(festina).not.toEqual(mp);
    expect((defaults(andenMpVertical.options) as AndenOptions).dial).toBe('mp');
    expect(andenMp.options.fields.some((field) => field.key === 'dial')).toBe(false);
    expect(frame.platform).toBe('1');
  });

  it('show the next train, its stops, and station time for the clock', () => {
    const train: Service = {
      id: 't',
      product: { name: 'Alvia', shortName: 'ALVIA' },
      number: '621',
      destination: { name: 'Barcelona Sants' },
      callsAfter: [{ place: { name: 'Pamplona/Iruña', names: ['Pamplona'] } }, { place: { name: 'Tafalla' } }],
      here: { departure: { scheduled: NOW + 28 * 60000 }, platform: { name: '1', confirmed: true } },
    };
    const view: View = { now: NOW, timeZone: 'Europe/Madrid', services: [train], total: 1, notices: [], placement: { platforms: [], cycle: true } };
    expect(present(view)).toEqual({
      time: '12:28', train: 'ALVIA 00621', destination: 'BARCELONA SANTS', line: 'CON PARADA EN Pamplona, Tafalla', platform: '1', clock: NOW, zone: 'Europe/Madrid',
    });
  });

  it('keep the side in the URL', () => {
    const config = readConfig(andenMpVertical, new URLSearchParams('lado=right&via=4'));
    expect(config.options).toMatchObject({ side: 'right' });
    expect(config.frame).toMatchObject({ platform: '4' });
    expect(readConfig(andenMpVertical, writeConfig(andenMpVertical, config))).toEqual(config);
  });
});
