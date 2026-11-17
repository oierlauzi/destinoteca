import { describe, expect, it } from 'vitest';
import type { Placement, Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { andenElectromagnetico } from '../src/lib/replicas/page-iberica-anden-electromagnetico/def';
import { andenSinLed, optionsSchema, type SinLedOptions } from '../src/lib/replicas/page-iberica-anden-sin-led/def';
import { HEIGHT, WIDTH } from '../src/lib/replicas/page-iberica-anden-sin-led/geometry';
import { blank, present } from '../src/lib/replicas/page-iberica-anden-sin-led/presenter';
import { describe as describeFrame, lineCells, renderToString } from '../src/lib/replicas/page-iberica-anden-sin-led/render';
import { getReplica } from '../src/lib/replicas/registry';

const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const options = defaults(optionsSchema) as SinLedOptions;
const view = (services: Service[], placement: Placement = { platforms: [], cycle: true }): View => ({
  now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement,
});
const train = (extra: Partial<Service> = {}): Service => ({
  id: 't',
  destination: { name: 'Guadalajara' },
  here: { activity: 'calls', departure: { estimated: NOW + 6 * 60000 }, platform: { name: '2', confirmed: true } },
  callsAfter: [{ place: { name: 'Alcalá de Henares' } }],
  ...extra,
});

describe('the platform sign without an LED row', () => {
  it('is registered under its own id', () => {
    expect(getReplica('page-iberica-anden-sin-led')).toBe(andenSinLed);
  });

  it('is as wide as the sign with the LED row, and only one line tall', () => {
    expect(WIDTH).toBe(andenElectromagnetico.viewBox.width);
    expect(HEIGHT).toBeGreaterThan(30);
    expect(HEIGHT).toBeLessThan(40);
  });

  it('has none of the LED row’s settings', () => {
    const keys = optionsSchema.fields.map((field) => field.key);
    for (const key of ['ledColor', 'ledScroll', 'ledSpeed', 'ledIdle']) expect(keys).not.toContain(key);
    expect(keys).toEqual(expect.arrayContaining(['showMinutes', 'dotColor', 'animate', 'hearts']));
  });

  it('shows the destination and the minutes, and nothing of the calls or the platform', () => {
    expect(present(view([train()]), options)).toEqual({ text: 'GUADALAJARA', minutes: '6' });
    expect(blank()).toEqual({ text: '', minutes: '' });
    expect(present(view([]), options)).toEqual({ text: '', minutes: '' });
  });

  it('writes the minutes over the end of the line, beside "min."', () => {
    const frame = { text: 'GUADALAJARA', minutes: '6' };
    expect(lineCells(frame, options).join('')).toBe('GUADALAJARA    6');
    const svg = renderToString(frame, options);
    expect(svg).toMatch(/<text [^>]*fill="#e2d14a"[^>]*>min\.<\/text>/);
  });

  it('draws one line of 16 characters and no LEDs', () => {
    const svg = renderToString({ text: 'CHAMARTIN', minutes: '8' }, options);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg.match(/<polygon /g)).toHaveLength(16 * 5 * 7);
    expect(svg).not.toContain('<circle ');
    expect(svg).not.toContain('Vía');
  });

  it('describes itself in words', () => {
    expect(describeFrame({ text: 'CHAMARTIN', minutes: '8' }, options)).toBe('CHAMARTIN · 8 min.');
    expect(describeFrame({ text: '', minutes: '' }, options)).toBe('');
  });
});
