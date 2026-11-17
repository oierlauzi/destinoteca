import { describe, expect, it } from 'vitest';
import type { Service, View } from '../src/lib/model';
import { defaults, type ParamSchema } from '../src/lib/params';
import { readConfig, writeConfig } from '../src/lib/player/config';
import { fromFlat, mpCercanias as def, toFlat } from '../src/lib/replicas/mp-electronics-adif-cercanias/def';
import { ROW_COLS, ROWS } from '../src/lib/replicas/mp-electronics-adif-cercanias/geometry';
import { present } from '../src/lib/replicas/mp-electronics-adif-cercanias/presenter';
import { rowText } from '../src/lib/replicas/mp-electronics-adif-cercanias/render';

const NOW = Date.UTC(2026, 10, 16, 13, 0, 0);
const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });
const train = (minutes: number, platform?: string): Service => ({
  id: String(minutes),
  destination: { name: 'Atocha-Guadalajara' },
  here: { departure: { scheduled: NOW + minutes * 60000 }, platform: platform ? { name: platform, confirmed: true } : undefined },
});

describe('MP Electronics Cercanías board', () => {
  it('has twelve rows of 26 characters, seven dots high', () => {
    expect(ROWS).toBe(12);
    expect(ROW_COLS).toBe(26 * 6 - 1);
    expect(rowText({ platform: '7', destination: 'ATOCHA-ALCALA', time: '1 min' })).toBe(' 7 ATOCHA-ALCALA     1 min');
    expect(rowText({ platform: '11', destination: 'atocha-guadalajara', time: '14:19' })).toBe('11 ATOCHA-GUADALAJAR 14:19');
  });

  it('gives minutes for the next trains and the time for later ones, the platform once known', () => {
    const rows = present(view([train(3, '9'), train(12), train(45)])).rows;
    expect(rows[0]).toEqual({ platform: '9', destination: 'ATOCHA-GUADALAJARA'.slice(0, 17), time: '3 min' });
    expect(rows[1]!.time).toBe('12 m.');
    expect(rows[2]!.time).toBe('14:45');
    expect(rows).toHaveLength(12);
  });

  it('carries its frame flat and in the URL', () => {
    const frame = fromFlat(defaults(def.frame as ParamSchema));
    expect(fromFlat(toFlat(frame))).toEqual(frame);
    const config = readConfig(def, new URLSearchParams('v1=4&d1=SEGOVIA&t1=19%20m.'));
    expect(config.frame).toMatchObject({ v1: '4', d1: 'SEGOVIA', t1: '19 m.' });
    expect(readConfig(def, writeConfig(def, config))).toEqual(config);
  });
});
