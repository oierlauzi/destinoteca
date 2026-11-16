import { describe, expect, it } from 'vitest';
import type { Placement, Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { optionsSchema, type AndenOptions } from '../src/lib/replicas/page-iberica-anden-electromagnetico/def';
import { blank, present } from '../src/lib/replicas/page-iberica-anden-electromagnetico/presenter';
import { lineCells, renderToString, describe as describeFrame } from '../src/lib/replicas/page-iberica-anden-electromagnetico/render';

const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const options = defaults(optionsSchema) as AndenOptions;
const view = (services: Service[], placement: Placement = { platforms: [], cycle: true }, extra: Partial<View> = {}): View => ({
  now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement, ...extra,
});
const train = (extra: Partial<Service> = {}): Service => ({
  id: 't',
  destination: { name: 'Chamartín' },
  here: { activity: 'calls', departure: { estimated: NOW + 6 * 60000 }, platform: { name: '04', confirmed: true } },
  ...extra,
});

describe('presenter', () => {
  it('shows destination, minutes, platform and calling points', () => {
    const frame = present(
      view([train({ callsAfter: [{ place: { name: 'Nuevos Ministerios' } }, { place: { name: 'Atocha Cercanías', names: ['Atocha'] } }] })]),
      options,
    );
    expect(frame).toEqual({ text: 'CHAMARTIN', minutes: '6', platform: '4', led: 'PARA EN: NUEVOS MINISTERIOS, ATOCHA' });
  });

  it('stops the name one cell short of the minutes', () => {
    const bilbao = { name: 'Bilbao-Abando Indalecio Prieto', names: ['Bilbao-Abando', 'Bilbao'] };
    expect(present(view([train({ destination: bilbao })]), options).text).toBe('BILBAO-ABANDO');
    const long = { name: 'Bilbao Abando-Indalecio' };
    const at12 = train({ destination: long, here: { departure: { estimated: NOW + 12 * 60000 } } });
    // 16 cells, 2 for "12", 1 blank: 13 for the name, and no hyphen left dangling.
    expect(present(view([at12]), options).text).toBe('BILBAO ABANDO');
    expect(present(view([at12]), { ...options, showMinutes: false }).text).toBe('BILBAO ABANDO-IN');
  });

  it('shows a platform only once it is confirmed, unless the sign is bolted to one', () => {
    const predicted = train({ here: { departure: { estimated: NOW + 60000 }, platform: { name: '3', confirmed: false } } });
    expect(present(view([predicted]), options).platform).toBe('');
    expect(present(view([predicted], { platforms: ['07'], cycle: true }), options).platform).toBe('7');
    expect(present(view([train()], { platforms: ['1', '2'], cycle: true }), options).platform).toBe('4');
  });

  it('goes dark with nothing to announce, but keeps its platform and any notice', () => {
    expect(blank(view([], { platforms: ['2'], cycle: true }), options)).toEqual({ text: '', minutes: '', platform: '2', led: '' });
    expect(present(view([]), { ...options, ledIdle: 'PROHIBIDO CRUZAR LAS VIAS' }).led).toBe('PROHIBIDO CRUZAR LAS VIAS');
    expect(blank(view([], undefined, { notices: [{ text: 'Trenes con retraso' }] }), options).led).toBe('TRENES CON RETRASO');
  });

  it('announces a train that does not stop', () => {
    expect(present(view([train({ here: { activity: 'passes', departure: { estimated: NOW + 60000 } } })]), options).text).toBe('SIN PARADA');
  });

  it('floors the minutes at zero and leaves them out when there is no time', () => {
    expect(present(view([train({ here: { departure: { estimated: NOW - 20000 } } })]), options).minutes).toBe('0');
    expect(present(view([train({ here: {} })]), options)).toMatchObject({ minutes: '', text: 'CHAMARTIN' });
  });

  it('fits both destinations of a train that divides, and lists each part’s calls', () => {
    const divided = train({
      destination: { name: 'Vigo-Guixar', names: ['Vigo'] },
      portions: [
        { position: 'front', callsAfter: [{ place: { name: 'Ourense' } }] },
        { position: 'rear', destination: { name: 'A Coruña-San Cristóbal', names: ['A Coruña', 'Coruña'] }, callsAfter: [{ place: { name: 'Lugo' } }, { place: { name: 'Betanzos' }, status: 'skipped' }] },
      ],
    });
    const frame = present(view([divided]), options);
    expect(frame.text).toBe('VIGO/A CORUÑA');
    expect(frame.text.length + 1 + frame.minutes.length).toBeLessThanOrEqual(16);
    expect(frame.led).toBe('CABEZA VIGO: OURENSE / COLA CORUÑA: LUGO');
  });

  it('prefers the operator’s own headsign', () => {
    expect(present(view([train({ headsign: 'P.Pío-Chamartín' })]), options).text).toBe('P.PIO-CHAMARTI');
  });
});

describe('rendering', () => {
  const frame = { text: 'CHAMARTIN', minutes: '6', platform: '1', led: 'PARA EN: ATOCHA' };

  it('writes the minutes over the end of the line', () => {
    expect(lineCells(frame, options).join('')).toBe('CHAMARTIN      6');
    expect(lineCells(frame, { ...options, showMinutes: false }).join('')).toBe('CHAMARTIN       ');
  });

  it('produces a standalone SVG with every dot of both matrices', () => {
    const svg = renderToString(frame, options);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg.match(/<polygon /g)).toHaveLength(16 * 5 * 7);
    expect(svg.match(/<circle /g)).toHaveLength(111 * 7 + 1);
    // Lit flaps: C H A M A R T I N and 6, counted from the font.
    expect(svg.match(new RegExp(`<polygon [^>]*fill="${options.dotColor}"`, 'g'))!.length).toBeGreaterThan(100);
  });

  it('leaves unlit flaps out when asked to', () => {
    const lit = renderToString(frame, { ...options, showOffDots: false }).match(/<polygon /g)!.length;
    expect(lit).toBeLessThan(16 * 5 * 7);
    expect(renderToString({ ...frame, text: '', minutes: '' }, { ...options, showOffDots: false })).not.toContain('<polygon');
  });

  it('cannot be made to emit markup from its text', () => {
    const svg = renderToString({ ...frame, platform: '"><script>alert(1)</script>' }, options);
    expect(svg).not.toContain('<script');
  });

  it('lights its flaps lime by default and keeps "min." amber whatever their colour', () => {
    expect(options.dotColor).toBe('#aede5a');
    for (const dotColor of ['#aede5a', '#d9e04a', '#ff0000']) {
      const svg = renderToString(frame, { ...options, dotColor });
      expect(svg).toMatch(/<text [^>]*fill="#e2d14a"[^>]*>min\.<\/text>/);
      expect(svg).toContain(`<polygon points="` );
      expect(svg.includes(`fill="${dotColor}"`)).toBe(true);
    }
  });

  it('describes itself in words', () => {
    expect(describeFrame(frame, options)).toBe('Vía 1 · CHAMARTIN · 6 min. · PARA EN: ATOCHA');
  });
});

describe('flip sweep', () => {
  it('rewrites a whole line of 16 in one second', async () => {
    const { flipDotSweep } = await import('../src/lib/replicas/page-iberica-electromagneticos/flip-dot-lines');
    const sweep = flipDotSweep(1, 16);
    const full = Array.from({ length: 16 }, () => [0x7f, 0x7f, 0x7f, 0x7f, 0x7f]);
    sweep.retarget(full);
    sweep.at(0);
    sweep.at(999);
    expect(sweep.settled).toBe(false);
    expect(sweep.at(1000)).toEqual(full);
    expect(sweep.settled).toBe(true);
  });
});
