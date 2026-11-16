import { h, overlay, toCells, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { CELL_STEP, CELL_WIDTH } from '../page-iberica-electromagneticos/dimensions';
import { flipDotLines, flipDotSweep } from '../page-iberica-electromagneticos/flip-dot-lines';
import { mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { cercaniasRoundel, HOUSING, LEGEND, ledRow, minLegend, PANEL, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
import { PLATFORM_CELLS, type BoardRow, type VestibuloFrame } from './def';
import { boardGeometry, CELLS } from './geometry';

/** The 20 characters of a line: platform right-aligned in the first two, then the destination, minutes at the end. */
export function rowCells(row: BoardRow, options: FamilyOptions): string[] {
  let cells = toCells('', CELLS);
  cells = overlay(cells, row.platform, 'right', 0, PLATFORM_CELLS);
  cells = overlay(cells, row.destination, 'left', PLATFORM_CELLS, CELLS);
  return options.showMinutes ? overlay(cells, row.minutes, 'right') : cells;
}

export function describe(frame: VestibuloFrame, options: FamilyOptions): string {
  const rows = frame.rows
    .filter((row) => row.platform || row.destination || row.minutes)
    .map((row) =>
      [row.platform && `Vía ${row.platform}`, row.destination, options.showMinutes && row.minutes ? `${row.minutes} min.` : '']
        .filter(Boolean)
        .join(', '),
    );
  return ['Destino', ...rows, frame.led].filter(Boolean).join(' · ');
}

const blankRow: BoardRow = { platform: '', destination: '', minutes: '' };

export function spec(lines: number): SignSpec<VestibuloFrame> {
  const g = boardGeometry(lines);
  const span = (from: number, to: number) => ({ x: g.linesX + from * CELL_STEP, end: g.linesX + to * CELL_STEP - (CELL_STEP - CELL_WIDTH) });
  // The header, as photographed at Tres Cantos and Cantoblanco: "Vía" under a
  // Cercanías roundel over the platform column, "Destino" over characters 7
  // to 13, and "Próxima Llegada" over the minutes.
  const via = span(0, PLATFORM_CELLS);
  const destino = span(6, 13);
  const header: VNode[] = [
    cercaniasRoundel((via.x + via.end) / 2, g.headerTop + 4.9, 2.75),
    h('text', { x: (via.x + via.end) / 2, y: g.headerBottom - 3.1, fill: LEGEND, 'font-size': 6.2, 'font-weight': 700, 'text-anchor': 'middle' }, ['Vía']),
    h('text', { x: (destino.x + destino.end) / 2, y: g.headerBottom - 4.2, fill: LEGEND, 'font-size': 8.4, 'font-weight': 700, 'text-anchor': 'middle', 'letter-spacing': 0.3 }, ['Destino']),
    h('text', { fill: LEGEND, 'font-size': 4.3, 'font-weight': 700, 'text-anchor': 'end' }, [
      h('tspan', { x: g.minX + 8.4, y: g.headerTop + 6.6 }, ['Próxima']),
      h('tspan', { x: g.minX + 8.4, y: g.headerTop + 11.4 }, ['Llegada']),
    ]),
  ];
  const housing = (): VNode[] => [
    h('rect', { x: 0, y: 0, width: g.width, height: g.height, rx: 10, fill: HOUSING }),
    h('rect', { ...g.panel, rx: 5, fill: PANEL, stroke: '#000000', 'stroke-width': 3 }),
    ...g.dividers.map((y) => h('line', { x1: g.panel.x, y1: y, x2: g.panel.x + g.panel.width, y2: y, stroke: '#000000', 'stroke-width': 0.2 })),
    ...header,
    ...g.lineTops.map((top) => minLegend(g.minX, top)),
  ];
  return {
    width: g.width,
    height: g.height,
    credit: `panel de vestíbulo electromagnético de PAGE Ibérica, ${lines} líneas`,
    flipDots: flipDotLines({ lines, cells: CELLS, x: g.linesX, y: g.lineTops[0]!, lineGap: g.lineGap }),
    sweep: () => flipDotSweep(lines, CELLS),
    led: ledRow(g.led.x, g.led.y, g.led.width),
    cells: (frame, options) => Array.from({ length: lines }, (_, i) => rowCells(frame.rows[i] ?? blankRow, options)).flat(),
    ledText: (frame) => frame.led,
    describe,
    housing,
  };
}

const specs = new Map<number, SignSpec<VestibuloFrame>>();
const specFor = (lines: number): SignSpec<VestibuloFrame> => {
  let found = specs.get(lines);
  if (!found) specs.set(lines, (found = spec(lines)));
  return found;
};

export function renderToString(lines: number, frame: VestibuloFrame, options: FamilyOptions): string {
  return renderSign(specFor(lines), frame, options);
}

export function mount(lines: number, host: Element, options: FamilyOptions, env: { ticker: Ticker }): MountedSign<VestibuloFrame> {
  const blank: VestibuloFrame = { rows: Array.from({ length: lines }, () => blankRow), led: '' };
  return mountSign(specFor(lines), blank, host, options, env);
}

