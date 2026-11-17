import { describe, expect, it } from 'vitest';
import type { Service, View } from '../src/lib/model';
import { defaults, type ParamSchema } from '../src/lib/params';
import { readConfig, replicaSize, writeConfig } from '../src/lib/player/config';
import { fromFlat, solariCercanias, solariLargo, toFlat } from '../src/lib/replicas/solari-renfe/def';
import { layout } from '../src/lib/replicas/solari-renfe/geometry';
import { present } from '../src/lib/replicas/solari-renfe/presenter';
import { renderToString } from '../src/lib/replicas/solari-renfe/render';

const NOW = Date.UTC(2026, 10, 16, 13, 0, 0);
const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });

describe('Solari split-flap boards', () => {
  it('lay out the columns of each variant', () => {
    expect(layout('largo', 8).fields.map((field) => field.legend)).toEqual(['tren', 'destino', 'por', 'salida', 'vía', '']);
    expect(layout('cercanias', 9).fields.map((field) => field.legend)).toEqual(['tren', 'procedencia', 'llegada', 'destino', 'salida', 'vía', '']);
    // No row count to set: boards of 8 or 9 rows are hung together, and each carries on from the one before.
    expect(solariLargo.options.fields.some((field) => field.key === 'rows')).toBe(false);
    const one = replicaSize(solariLargo, {});
    const four = replicaSize(solariLargo, { across: 2, down: 2 });
    expect(four.width).toBeGreaterThan(2 * one.width);
    expect(four.height).toBeGreaterThan(2 * one.height);
    expect(solariLargo.selection({ across: 2, down: 2 }).window.size).toBe(32);
    expect(solariCercanias.selection({ across: 3 }).window.size).toBe(24);
  });

  it('write the train, the place in twelve flaps cut at a whole word, the time as 14.05 and the platform', () => {
    const train: Service = {
      id: 't',
      product: { name: 'Talgo', shortName: 'TALGO' },
      destination: { name: 'Zaragoza Delicias' },
      via: [{ name: 'Guadalajara' }],
      here: { departure: { scheduled: NOW + 5 * 60000 }, platform: { name: '7', confirmed: true } },
    };
    const row = present('largo', view([train]), {}).rows[0];
    expect(row).toEqual({ t: 'TALGO', d: 'ZARAGOZA', p: 'GUADALAJARA', h: '14.05', v: '7', l: '' });
  });

  it('leave origin and arrival empty for a train that starts here, destination and departure for one that ends here', () => {
    const starts: Service = { id: 'a', destination: { name: 'Atocha' }, here: { activity: 'origin', departure: { scheduled: NOW } } };
    const ends: Service = { id: 'b', origin: { name: 'Cercedilla' }, here: { activity: 'terminus', arrival: { scheduled: NOW } } };
    const [first, second] = present('cercanias', view([starts, ends]), {}).rows;
    expect(first).toMatchObject({ o: '', a: '', d: 'ATOCHA', s: '14.00' });
    expect(second).toMatchObject({ o: 'CERCEDILLA', a: '14.00', d: '', s: '' });
  });

  it('show the dot of a time only with one, and the lamps asked for', () => {
    const frame = fromFlat('largo', defaults(solariLargo.frame as ParamSchema));
    const svg = renderToString('largo', frame, { across: 1, down: 1, animate: true, speed: 14 });
    // The dot is printed on the hour flap, so only flaps showing an hour have one.
    expect(svg.match(/r="0.55" fill="#f1eee2"/g)).toHaveLength(6);
    expect(svg.match(/fill="#ff5b38"/g)).toHaveLength(1);
  });

  it('carry a hand-typed board in the URL', () => {
    const config = readConfig(solariCercanias, new URLSearchParams('t1=TRANVIA&o1=AVILA&a1=15.52&ancho=2'));
    expect(config.frame).toMatchObject({ t1: 'TRANVIA', o1: 'AVILA', a1: '15.52' });
    expect(config.options).toMatchObject({ across: 2, down: 1 });
    expect(readConfig(solariCercanias, writeConfig(solariCercanias, config))).toEqual(config);
    const frame = fromFlat('cercanias', config.frame);
    expect(fromFlat('cercanias', toFlat(frame))).toEqual(frame);
  });
});
