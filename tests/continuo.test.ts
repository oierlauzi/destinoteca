import { describe, expect, it } from 'vitest';
import { fitText, litFlap, measure, pageIbericaBold7 as font, place, SEEN_IN_PHOTOGRAPHS, textStrip, toString } from '../src/lib/hardware';
import type { Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { readConfig, writeConfig } from '../src/lib/player/config';
import { andenContinuo, type ContinuoOptions } from '../src/lib/replicas/page-iberica-anden-continuo/def';
import { COLS } from '../src/lib/replicas/page-iberica-anden-continuo/geometry';
import { blank, present } from '../src/lib/replicas/page-iberica-anden-continuo/presenter';
import { lineState, renderToString } from '../src/lib/replicas/page-iberica-anden-continuo/render';

const options = defaults(andenContinuo.options) as ContinuoOptions;
const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);

describe('the bold proportional typeface', () => {
  it('has the widths read from the photographs', () => {
    const width = (char: string) => font.glyph(char)!.length;
    expect([...'CHANRTEO0'].map(width)).toEqual([6, 6, 6, 6, 6, 6, 6, 6, 6]);
    expect([...'MSVD'].map(width)).toEqual([7, 7, 7, 7]);
    expect([width('I'), width('1'), width(':')]).toEqual([4, 4, 2]);
  });

  it('lays the photographed messages out as wide as they were', () => {
    // Letters plus one blank column between them, and a space of two (four blank columns between words).
    expect(measure('CHAMARTIN', font)).toBe(61);
    expect(measure('10:12', font)).toBe(26);
    expect(measure('SIN SERVICIO', font)).toBe(19 + 4 + 53);
  });

  it('spells as the sign can: capitals, no accents but Ñ', () => {
    expect(font.fold('Príncipe Pío')).toBe('PRINCIPE PIO');
    expect(font.fold('Logroño')).toBe('LOGROÑO');
    expect(textStrip('Ñ', font)).toEqual(font.glyph('Ñ'));
  });

  it('knows which glyphs come from photographs', () => {
    expect(SEEN_IN_PHOTOGRAPHS).toEqual(expect.arrayContaining(['C', 'H', 'A', 'M', 'R', 'T', 'I', 'N', 'S', 'E', 'V', 'O', '0', '1', '2', ':', 'D', 'G', 'J', 'L']));
    expect(SEEN_IN_PHOTOGRAPHS).not.toContain('U');
    expect(font.glyph('U')).toBeDefined();
  });

  it('fits a name by its width in dots, cutting the last form if nothing fits', () => {
    expect(measure('ALCOBENDAS', font)).toBe(71);
    expect(fitText(['Alcobendas-San Sebastián de los Reyes', 'Alcobendas-S.S.R.', 'Alcobendas'], font, 71)).toBe('ALCOBENDAS');
    expect(fitText(['Guadalajara'], font, 200)).toBe('GUADALAJARA');
    expect(measure(fitText(['Guadalajara'], font, 30), font)).toBeLessThanOrEqual(30);
    expect(fitText(['Puerta de Atocha'], font, 60)).toBe('PUERTA DE');
  });

  it('places strips left from a column or right up to one, cutting what overflows', () => {
    const line = Array.from({ length: 6 }, () => 0);
    expect(place(line, [1, 2], 1, 'left')).toEqual([0, 1, 2, 0, 0, 0]);
    expect(place(line, [1, 2], 5, 'right')).toEqual([0, 0, 0, 0, 1, 2]);
    expect(place(line, [1, 2, 3], 4, 'left')).toEqual([0, 0, 0, 0, 1, 2]);
  });
});

describe('the continuous lit matrix', () => {
  it('lights the LED of a dot only when it shows its bright side, and only if the LEDs are on', () => {
    const skin = litFlap();
    const look = { lit: '#aede5a', unlit: '#26261e', leds: true, led: '#ffffff' };
    const ledOf = (on: boolean, leds: boolean) => toString(skin.draw(0, 0, 2, on, { ...look, leds })[2]!);
    expect(ledOf(true, true)).toContain('fill="#ffffff"');
    expect(ledOf(false, true)).not.toContain('fill="#ffffff"');
    expect(ledOf(true, false)).not.toContain('fill="#ffffff"');
  });

  it('draws 96 x 7 flaps with a LED each, and no "Próxima Llegada" or "min."', () => {
    const svg = renderToString({ text: 'CHAMARTIN', time: '10:12', platform: '2', led: '' }, options);
    expect(svg.match(/<path d="M/g)!.length).toBe(COLS * 7);
    expect(svg.match(/<circle /g)!.length).toBeGreaterThanOrEqual(COLS * 7);
    expect(svg).not.toContain('Próxima');
    expect(svg).not.toContain('min.');
    expect(svg).toContain('>Vía<');
  });

  it('puts the text a column in and the time against the right end', () => {
    const line = lineState({ text: 'CHAMARTIN', time: '10:12', platform: '', led: '' }, options);
    expect(line[0]).toBe(0);
    expect(line[1]).not.toBe(0);
    expect(line[COLS - 1]).not.toBe(0);
    // Eight blank columns between the name and the time, as in the photograph's ten or so.
    expect(line.slice(1 + 61, COLS - 26).every((byte) => byte === 0)).toBe(true);
  });
});

describe('presenter', () => {
  const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });
  const train: Service = {
    id: 't',
    destination: { name: 'Chamartín' },
    callsAfter: [{ place: { name: 'Atocha Cercanías', names: ['Atocha'] } }],
    here: { departure: { scheduled: NOW + 12 * 60000, estimated: NOW + 15 * 60000 }, platform: { name: '2', confirmed: true } },
  };

  it('shows the destination and the timetabled departure time in station time', () => {
    // 09:12 UTC is 10:12 in Madrid in November.
    expect(present(view([train]), options)).toEqual({ text: 'CHAMARTIN', time: '10:12', platform: '2', led: 'PARA EN: ATOCHA' });
  });

  it('leaves room for the time when fitting a long name', () => {
    const long = { ...train, destination: { name: 'Alcobendas-San Sebastián de los Reyes', names: ['Alcobendas-S.S.R.', 'Alcobendas'] } };
    const frame = present(view([long]), options);
    expect(1 + measure(frame.text, font) + 3 + measure(frame.time, font)).toBeLessThanOrEqual(COLS);
  });

  it('names only the first part of a train that divides when both names do not fit', () => {
    const divided: Service = {
      ...train,
      destination: { name: 'Alcalá de Henares', names: ['Alcalá Henares'] },
      portions: [{ position: 'front' }, { position: 'rear', destination: { name: 'Colmenar Viejo' } }],
    };
    // Not even 'ALCALA HENARES' fits beside the time: the first destination alone, cut at a whole word.
    expect(present(view([divided]), options).text).toBe('ALCALA');
    const short: Service = { ...divided, destination: { name: 'Sol' }, portions: [{}, { destination: { name: 'Pinto' } }] };
    expect(present(view([short]), options).text).toBe('SOL/PINTO');
  });

  it('goes dark with nothing to show but keeps its platform', () => {
    expect(blank({ ...view([]), placement: { platforms: ['4'], cycle: true } }, options)).toEqual({ text: '', time: '', platform: '4', led: '' });
  });
});

describe('settings', () => {
  it('reads a hand-typed frame from the URL and writes it back', () => {
    const config = readConfig(andenContinuo, new URLSearchParams('text=SIN%20SERVICIO&hora=&via=4&leds=0'));
    expect(config.frame).toMatchObject({ text: 'SIN SERVICIO', time: '', platform: '4' });
    expect(config.options).toMatchObject({ pixelLeds: false });
    expect(readConfig(andenContinuo, writeConfig(andenContinuo, config))).toEqual(config);
    expect(andenContinuo.options.fields.some((field) => field.key === 'hearts')).toBe(false);
  });
});
