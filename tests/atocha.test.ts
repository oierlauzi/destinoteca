import { describe, expect, it } from 'vitest';
import { measure, pageIbericaLed12 as ledFont, pageIbericaThin7 as font, textStrip, THIN_SEEN_IN_PHOTOGRAPHS } from '../src/lib/hardware';
import type { Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { readConfig, writeConfig } from '../src/lib/player/config';
import { accesoAtocha, type AccesoOptions } from '../src/lib/replicas/page-iberica-acceso-atocha/def';
import { present as presentAcceso } from '../src/lib/replicas/page-iberica-acceso-atocha/presenter';
import { renderToString as renderAcceso } from '../src/lib/replicas/page-iberica-acceso-atocha/render';
import { AMBER, andenAtocha, type AndenAtochaOptions } from '../src/lib/replicas/page-iberica-anden-atocha/def';
import { PANEL_COLS, PANEL_LINES, PANEL_ROWS } from '../src/lib/replicas/page-iberica-anden-atocha/geometry';
import { blank, present } from '../src/lib/replicas/page-iberica-anden-atocha/presenter';
import { minutesStrip, renderToString } from '../src/lib/replicas/page-iberica-anden-atocha/render';
import { COLS, ENCLOSURE, FRAME, LEFT, RIGHT, rowDots } from '../src/lib/replicas/page-iberica-electromagneticos/atocha';
import { panelState, type LedRow } from '../src/lib/replicas/page-iberica-electromagneticos/parts';

const acceso = defaults(accesoAtocha.options) as AccesoOptions;
const anden = defaults(andenAtocha.options) as AndenAtochaOptions;
const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);

describe('the light proportional typeface', () => {
  it('has the widths read from the photographs', () => {
    const width = (char: string) => font.glyph(char)!.length;
    expect([...'SNRVCOPA0345'].map(width)).toEqual(Array(12).fill(5));
    expect([width('I'), width('E'), width('L'), width(':'), width('.')]).toEqual([3, 4, 4, 1, 1]);
    expect(THIN_SEEN_IN_PHOTOGRAPHS).toEqual(expect.arrayContaining([...'SINERVCO0345P.-LA7min:']));
  });

  it('lays "SIN SERVICIO 04:35" out over 101 columns, as photographed', () => {
    // Three blank columns between words.
    expect(measure('SIN SERVICIO', font)).toBe(15 + 3 + 42);
    const line = rowDots('SIN SERVICIO', textStrip('04:35', font), { ...acceso, deadOn: 0, deadOff: 0 })[0]!;
    const lit = line.map((byte, c) => (byte ? c : -1)).filter((c) => c >= 0);
    expect([lit[0], lit[lit.length - 1]]).toEqual([LEFT, RIGHT]);
    expect(RIGHT - LEFT + 1).toBe(101);
  });

  it('writes "min" in lowercase and everything else in capitals', () => {
    expect(minutesStrip('7')).toEqual(textStrip('7', font).concat([0, 0, 0], font.glyph('m')!, [0], font.glyph('i')!, [0], font.glyph('n')!));
    expect(font.fold('Príncipe Pío')).toBe('PRINCIPE PIO');
  });
});

describe('the LED panel typeface', () => {
  it('has 12-row characters, 7 columns wide, with strokes two dots thick', () => {
    for (const char of 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789:.,/-') {
      const glyph = ledFont.glyph(char)!;
      expect(glyph, char).toHaveLength(7);
      expect(Math.max(...glyph)).toBeLessThan(1 << 12);
    }
    // The E of "PARA EN:": a stem of two columns, bars of two rows at the top and bottom, a shorter one in the middle.
    const e = ledFont.glyph('E')!;
    expect(e[0]).toBe(0xfff);
    expect(e[1]).toBe(0xfff);
    expect(e[5]).toBe(0b110001100011);
    expect(e[6]).toBe(0b110000000011);
  });

  it('fits 15 characters in the 120 columns of a line', () => {
    expect(measure('MOSTOLES, MOST/', ledFont)).toBe(15 * 8 - 1);
    expect(measure('PARA EN:', ledFont)).toBe(8 * 8 - 1);
  });
});

describe('the platform display', () => {
  const view = (services: Service[]): View => ({ now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: [], cycle: true } });
  const train: Service = {
    id: 't',
    destination: { name: 'Príncipe Pío', names: ['P.Pío'] },
    callsAfter: [{ place: { name: 'Pirámides' } }, { place: { name: 'Príncipe Pío' } }],
    here: { departure: { scheduled: NOW + 7 * 60000 }, platform: { name: '4', confirmed: true } },
  };

  it('draws a grey frame of constant width, the flip-dot line and a 120 x 28 panel', () => {
    const svg = renderToString({ text: 'P.PIO-VILLAL', minutes: '7', platform: '4', label: 'PARA EN:', led: 'PIRAMIDES' }, anden);
    expect(svg).toContain(`fill="${ENCLOSURE}"`);
    expect(svg).toContain('>Vía<');
    expect(svg).toContain('>Próximo<');
    expect(svg.match(/<path d="M/g)!.length).toBeGreaterThanOrEqual(COLS * 7);
    expect(svg.match(new RegExp(`fill="${AMBER}"`, 'g'))!.length).toBeGreaterThan(100);
    expect(svg).toContain('clipPath');
    expect(FRAME).toBe(10);
  });

  it('lays both lines of the panel out from the left, the second from row 16', () => {
    const panel = { cols: PANEL_COLS, lines: PANEL_LINES, align: 'left', strip: (text: string) => textStrip(text, ledFont) } as LedRow;
    const [columns] = panelState(panel, [panel.strip('PARA EN:'), panel.strip('SOL')], []);
    expect(columns![0]! & 0xfff).not.toBe(0);
    expect(columns![0]! >> 16).not.toBe(0);
    expect(columns![0]! >> PANEL_ROWS).toBe(0);
    expect(columns![PANEL_COLS - 1]).toBe(0);
  });

  it('shows the destination, the minutes and the stops under "PARA EN:"', () => {
    expect(present(view([train]), anden)).toEqual({ text: 'PRINCIPE PIO', minutes: '7', platform: '4', label: 'PARA EN:', led: 'PIRAMIDES, PRINCIPE PIO' });
  });

  it('says "ESTE TREN:" and drops the minutes when the train is due', () => {
    const due = { ...train, here: { ...train.here, departure: { scheduled: NOW } } };
    expect(present(view([due]), anden)).toMatchObject({ minutes: '', label: 'ESTE TREN:' });
  });

  it('goes dark with nothing to show but keeps its platform', () => {
    expect(blank({ ...view([]), placement: { platforms: ['4'], cycle: true } }, anden)).toEqual({ text: '', minutes: '', platform: '4', label: '', led: '' });
  });

  it('reads a hand-typed frame from the URL and writes it back', () => {
    const config = readConfig(andenAtocha, new URLSearchParams('text=HUMANES&min=&via=10&led1=ESTE%20TREN%3A&led=FUENLABRADA&ledc=ff3b2e'));
    expect(config.frame).toMatchObject({ text: 'HUMANES', minutes: '', platform: '10', label: 'ESTE TREN:', led: 'FUENLABRADA' });
    expect(config.options).toMatchObject({ ledColor: '#ff3b2e' });
    expect(readConfig(andenAtocha, writeConfig(andenAtocha, config))).toEqual(config);
    expect(anden.ledColor).toBe(AMBER);
  });
});

describe('the platform access display', () => {
  it('draws the line, the red LED row and the makers plate', () => {
    const svg = renderAcceso({ text: 'SIN SERVICIO', time: '04:35', platform: '7', led: 'PROXIMA SALIDA' }, acceso);
    expect(svg).toContain(`fill="${ENCLOSURE}"`);
    expect(svg).toContain('#ff3b2e');
    expect(svg).toContain('Vía 7 · SIN SERVICIO · 04:35 · PROXIMA SALIDA');
  });

  it('shows the destination and the timetabled time', () => {
    const train: Service = {
      id: 't',
      destination: { name: 'Guadalajara' },
      here: { departure: { scheduled: NOW + 12 * 60000 }, platform: { name: '7', confirmed: true } },
    };
    const view: View = { now: NOW, timeZone: 'Europe/Madrid', services: [train], total: 1, notices: [], placement: { platforms: [], cycle: true } };
    expect(presentAcceso(view, acceso)).toMatchObject({ text: 'GUADALAJARA', time: '10:12', platform: '7' });
  });
});
