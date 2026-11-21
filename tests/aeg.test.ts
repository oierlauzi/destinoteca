import { describe, expect, it } from 'vitest';
import {
  AEG_RECONSTRUCTED, AEG_SEEN, aegLcdLarge, aegLcdSmall, aegRows, cellBoxes, cellShade, layoutLine, measure, panelHeight, panelNodes, panelWidth, rowTop, toString, writeWidth,
  type PanelLook,
} from '../src/lib/hardware';
import type { Service, View } from '../src/lib/model';
import { defaults } from '../src/lib/params';
import { aegAndenAve, optionsSchema, type AegOptions } from '../src/lib/replicas/aeg-anden-ave/def';
import { BEZEL, BOARD_WIDTH, CELLS, CLOCK_HEIGHT, CLOCK_WIDTH, GAP, GLASS_HEIGHT, GLASS_PAD, GLASS_WIDTH, HEIGHT, PANEL, ROW_HEIGHTS, WIDTH, WRITE_HEIGHTS } from '../src/lib/replicas/aeg-anden-ave/geometry';
import { after, blank, callNames, fitsFrom, present } from '../src/lib/replicas/aeg-anden-ave/presenter';
import { describe as describeFrame, renderToString, written } from '../src/lib/replicas/aeg-anden-ave/render';
import { handAngles } from '../src/lib/replicas/aeg-anden-ave/clock';
import { getReplica } from '../src/lib/replicas/registry';

const NOW = Date.UTC(2026, 10, 16, 9, 0, 0);
const options = defaults(optionsSchema) as AegOptions;
const view = (services: Service[]): View => ({
  now: NOW, timeZone: 'Europe/Madrid', services, total: services.length, notices: [], placement: { platforms: ['3'], cycle: true },
});
const train = (extra: Partial<Service> = {}): Service => ({
  id: 't',
  product: { name: 'AVE', shortName: 'AVE' },
  destination: { name: 'Sevilla-Santa Justa', names: ['Sevilla SJ', 'Sevilla'] },
  callsAfter: [{ place: { name: 'Córdoba Central', names: ['Córdoba'] } }],
  here: { activity: 'calls', departure: { scheduled: NOW + 7 * 60000 }, platform: { name: '3', confirmed: true } },
  ...extra,
});

describe('the AEG liquid-crystal faces', () => {
  it('draws the small face on a five by seven grid and the large one thirteen rows tall', () => {
    for (const char of ['A', 'Z', '0', '9', ':', '-']) {
      const rows = aegRows(char, 'small')!;
      expect(rows).toHaveLength(7);
      for (const row of rows) expect(row).toHaveLength(rows[0]!.length);
      expect(rows[0]!.length).toBeLessThanOrEqual(5);
    }
    for (const char of ['A', 'O', 'I', 'g', '1']) expect(aegRows(char, 'large')).toHaveLength(13);
    // The capitals fill the thirteen rows, as the top line fills its cell.
    expect(aegRows('A', 'large')![0]).toContain('#');
    expect(aegRows('A', 'large')![12]).toContain('#');
  });

  it('gives both faces widths of their own', () => {
    expect(aegLcdLarge.glyph('A')!.length).toBeGreaterThan(aegLcdLarge.glyph('I')!.length);
    expect(aegLcdLarge.glyph('o')!.length).toBeLessThan(aegLcdLarge.glyph('O')!.length);
    expect(aegLcdSmall.glyph('A')!.length).toBe(5);
    expect(aegLcdSmall.glyph('I')!.length).toBeLessThan(5);
  });

  it('keeps what can be made out apart from what was drawn to match', () => {
    expect(AEG_SEEN.filter((char) => (AEG_RECONSTRUCTED as readonly string[]).includes(char))).toEqual([]);
    expect(AEG_SEEN).toContain('D');
    expect(AEG_RECONSTRUCTED).toContain('W');
  });

  it('writes the lines below in capitals, and the top one as it is given', () => {
    expect(aegLcdSmall.fold('Córdoba')).toBe('CORDOBA');
    expect(aegLcdLarge.fold('Córdoba-Málaga')).toBe('Cordoba-Malaga');
    expect(aegLcdSmall.fold('AVE€')).toBe('AVE ');
  });

  it('fits in a cell what the photographs show in one', () => {
    const room = writeWidth(PANEL);
    // A cell takes «CORDOBA» with room to spare and «TALGO 200» just about, as the photographs show.
    expect(measure('CORDOBA', aegLcdSmall)).toBeLessThanOrEqual(room);
    expect(measure('TALGO 200', aegLcdSmall)).toBeLessThanOrEqual(room);
    expect(measure('TALGO 2000', aegLcdSmall)).toBeGreaterThan(room);
    // Six characters of the large face fill a cell: «00:00 VIAJE INAGURAL AVE» ends in the fourth.
    expect(measure('DESTIN', aegLcdLarge)).toBeLessThanOrEqual(room);
    expect(measure('DESTINO', aegLcdLarge)).toBeGreaterThan(room);
  });
});

describe('the cells', () => {
  const look: PanelLook = { glass: '#c0c0c0', margin: '#d0d0d0', groove: '#e0e0e0', glassDull: '#808080', ink: '#000000', uneven: 0, seed: 1 };

  it('are five across and three down, the top row taller', () => {
    expect(PANEL.cells).toBe(CELLS);
    expect(PANEL.rowHeights).toHaveLength(3);
    expect(ROW_HEIGHTS[0]).toBeGreaterThan(ROW_HEIGHTS[1]!);
    expect(panelWidth(PANEL) + 2 * GLASS_PAD).toBe(GLASS_WIDTH);
    expect(panelHeight(PANEL) + 2 * GLASS_PAD).toBe(GLASS_HEIGHT);
    expect(rowTop(PANEL, 1)).toBe(ROW_HEIGHTS[0]);
  });

  it('write in a part of the cell that leaves a margin above and below', () => {
    const { glass, write } = cellBoxes(PANEL, 1, 0, { x: 0, y: 0 });
    expect(write.height).toBeLessThan(glass.height);
    expect(write.y).toBeGreaterThan(glass.y);
    // The face fills the part that writes, and that is a good deal shorter than the cell.
    expect(WRITE_HEIGHTS[1]).toBe(aegLcdSmall.rows);
    expect(WRITE_HEIGHTS[0]).toBe(aegLcdLarge.rows);
    expect(WRITE_HEIGHTS[1]! / ROW_HEIGHTS[1]!).toBeLessThan(0.5);
  });

  it('draw a glass, a writing area and a path of dots for every cell', () => {
    const svg = panelNodes(PANEL, look, [[], [], []], [aegLcdLarge, aegLcdSmall, aegLcdSmall], { x: 0, y: 0 }).map(toString).join('');
    expect(svg.match(/<rect /g)).toHaveLength(1 + 2 * 15);
    expect(svg.match(/<path /g)).toHaveLength(15);
  });

  it('give every cell the same shade until they are told to drift apart', () => {
    expect(cellShade(0, look)).toBe(cellShade(7, look));
    const aged = { ...look, uneven: 0.5 };
    expect(cellShade(0, aged)).not.toBe(cellShade(7, aged));
  });
});

describe('a line over the cells', () => {
  it('never draws a character across a groove', () => {
    const room = writeWidth(PANEL);
    for (const placed of layoutLine('DESTINO Sevilla-Santa Justa', aegLcdLarge, PANEL)) {
      expect(placed.at).toBeGreaterThanOrEqual(0);
      expect(placed.at + aegLcdLarge.glyph(placed.char)!.length).toBeLessThanOrEqual(room);
    }
  });

  it('carries on in the next cell when one runs out, and drops a blank left at its head', () => {
    const placed = layoutLine('AAAAAAAAAAAAAA BBB', aegLcdSmall, PANEL);
    expect(new Set(placed.map((p) => p.cell)).size).toBeGreaterThan(1);
    expect(placed.filter((p) => p.at === 0).every((p) => p.char !== ' ')).toBe(true);
  });

  it('stops at the last cell', () => {
    const placed = layoutLine('X'.repeat(500), aegLcdSmall, PANEL);
    expect(Math.max(...placed.map((p) => p.cell))).toBeLessThan(PANEL.cells);
  });

  it('starts a second field at a cell the first leaves free', () => {
    expect(after('AVE', aegLcdSmall, 1)).toBe(1);
    expect(after('TALGO 200 Y MAS', aegLcdSmall, 1)).toBe(2);
    expect(fitsFrom('CORDOBA', aegLcdSmall, 1)).toBe(true);
    expect(fitsFrom('CORDOBA', aegLcdSmall, PANEL.cells)).toBe(false);
  });
});

describe('what the display shows of a train', () => {
  it('announces the time, the destination, the kind of train and where it calls', () => {
    const frame = present(view([train()]));
    expect(frame.time).toBe('10:07');
    expect(frame.text.startsWith('DESTINO ')).toBe(true);
    expect(frame.product).toBe('AVE');
    expect(frame.calls).toBe('CORDOBA');
    expect(frame.extra).toBe('');
  });

  it('steps the destination down its own names when the room runs out', () => {
    const long = train({ destination: { name: 'Sevilla-Santa Justa por Ciudad Real y Puertollano', names: ['Sevilla-Santa Justa', 'Sevilla'] } });
    expect(present(view([long])).text).toBe('DESTINO Sevilla-Santa Justa');
  });

  it('drops the calls that do not fit, from the end', () => {
    const many = train({
      callsAfter: ['Ciudad Real', 'Puertollano', 'Córdoba Central', 'Puente Genil', 'Antequera-Santa Ana'].map((name) => ({ place: { name } })),
    });
    const frame = present(view([many]));
    expect(frame.calls.startsWith('CIUDAD REAL')).toBe(true);
    expect(fitsFrom(frame.calls, aegLcdSmall, 1)).toBe(true);
  });

  it('says nothing with no train to announce', () => {
    expect(present(view([]))).toEqual(blank(view([])));
    expect(callNames(train())).toEqual(['CORDOBA']);
  });

  it('leaves the calls off a train that does not stop', () => {
    expect(present(view([train({ here: { activity: 'passes' } })])).calls).toBe('');
  });
});

describe('the drawing', () => {
  const frame = { time: '11:00', text: 'DESTINO SEVILLA SJ', product: 'AVE', calls: 'CORDOBA', extra: '', clock: '10:58' };

  it('is a standalone SVG of the unit, with what it shows in its title', () => {
    const svg = renderToString(frame, options);
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${WIDTH} ${HEIGHT}"`);
    expect(svg).toContain('<title>11:00 · DESTINO SEVILLA SJ · AVE · CORDOBA</title>');
    expect(describeFrame({ ...frame, text: '', calls: '' })).toBe('11:00 · AVE');
    // Nothing is drawn with a gradient: the panel does not light.
    expect(svg).not.toContain('Gradient');
  });

  it('puts the time in the first cell and the destination from the second', () => {
    const [top] = written(frame);
    expect(top!.filter((p) => p.cell === 0).map((p) => p.char).join('')).toBe('11:00');
    expect(top!.filter((p) => p.cell >= 1).map((p) => p.char).join('')).toBe('DESTINOSEVILLASJ');
  });

  it('switches more dots the more it is told to write', () => {
    const empty = written({ time: '', text: '', product: '', calls: '', extra: '', clock: '' });
    expect(empty.flat()).toHaveLength(0);
    expect(written(frame).flat().length).toBeGreaterThan(25);
  });

  it('is registered under an id that never changes', () => {
    expect(getReplica('aeg-anden-ave')).toBe(aegAndenAve);
    expect(aegAndenAve.viewBox).toEqual({ width: WIDTH, height: HEIGHT });
    expect(aegAndenAve.reads).toContain('services');
  });
});

describe('the clock beside it', () => {
  it('reads station time and points its hands at it', () => {
    expect(present(view([train()])).clock).toBe('10:00');
    expect(handAngles('03:00')).toEqual({ hour: 90, minute: 0 });
    expect(handAngles('12:30')).toEqual({ hour: 15, minute: 180 });
    expect(handAngles('')).toBeUndefined();
  });

  it('hangs in a box of its own, a little wider than it is tall', () => {
    expect(CLOCK_WIDTH).toBeGreaterThan(CLOCK_HEIGHT);
    expect(CLOCK_WIDTH / CLOCK_HEIGHT).toBeLessThan(1.3);
    expect(WIDTH).toBe(BOARD_WIDTH + GAP + CLOCK_WIDTH);
  });
});

describe('the proportions the photograph gives', () => {
  it('keeps the glass about 4.2 times as wide as it is tall, and the frame about 3.5', () => {
    const glass = GLASS_WIDTH / GLASS_HEIGHT;
    expect(glass).toBeGreaterThan(4.0);
    expect(glass).toBeLessThan(4.4);
    const board = BOARD_WIDTH / HEIGHT;
    expect(board).toBeGreaterThan(3.4);
    expect(board).toBeLessThan(3.7);
  });

  it('leaves the same margin on all four sides', () => {
    expect(BOARD_WIDTH - GLASS_WIDTH).toBe(2 * BEZEL);
    expect(HEIGHT - GLASS_HEIGHT).toBe(2 * BEZEL);
  });
});
