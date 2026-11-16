import { h, overlay, toCells, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { CELL_GAP, CELL_STEP, CELL_WIDTH, LINE_HEIGHT } from '../page-iberica-electromagneticos/dimensions';
import { flipDotLines, flipDotSweep } from '../page-iberica-electromagneticos/flip-dot-lines';
import { characterDots, mountSign, renderSign, type MountedSign, type SignSpec } from '../page-iberica-electromagneticos/live';
import { cercaniasRoundel, flipLook, HOUSING, LEGEND, ledRow, MIN_LEGEND, minLegend, PANEL, type FamilyOptions } from '../page-iberica-electromagneticos/parts';
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

export function spec(lines: number, nextArrival: boolean): SignSpec<VestibuloFrame> {
  const g = boardGeometry(lines);
  const span = (from: number, to: number) => ({ x: g.linesX + from * CELL_STEP, end: g.linesX + to * CELL_STEP - (CELL_STEP - CELL_WIDTH) });
  // The header, as photographed at Tres Cantos and Cantoblanco: the
  // Cercanías roundel over "Vía" at the start of the platform column,
  // "Destino" over characters 7 to 13, both about as tall as a character, and
  // at Cantoblanco only, "Próxima Llegada" over the minutes.
  const via = span(0, PLATFORM_CELLS);
  const destino = span(6, 13);
  // Middle anchoring counts the spacing after the last letter, hence the half-spacing shift.
  const VIA_SPACING = 1.2;
  const viaCentre = via.x + 11.2;
  const header: VNode[] = [
    // The roundel sits on the same centre line as "Vía", whose left edge is at the first character.
    cercaniasRoundel(viaCentre, g.headerTop + 6.6, 5),
    h('text', { x: viaCentre + VIA_SPACING / 2, y: g.headerBottom - 3.4, fill: LEGEND, 'font-size': 12.5, 'font-weight': 700, 'letter-spacing': VIA_SPACING, 'text-anchor': 'middle' }, ['Vía']),
    h('text', { x: (destino.x + destino.end) / 2, y: g.headerBottom - 3.9, fill: LEGEND, 'font-size': 15.5, 'font-weight': 700, 'text-anchor': 'middle', 'letter-spacing': 0.4 }, ['Destino']),
  ];
  if (nextArrival) {
    header.push(
      h('text', { fill: LEGEND, 'font-size': 8, 'font-weight': 700, 'text-anchor': 'end' }, [
        h('tspan', { x: g.minX + 8.4, y: g.headerTop + 9.6 }, ['Próxima']),
        h('tspan', { x: g.minX + 8.4, y: g.headerTop + 18.4 }, ['Llegada']),
      ]),
    );
  }
  // On some boards an amber ":" vinyl, the colour of "min.", stands in the gap before the last two characters.
  const colonX = g.linesX + (CELLS - 2) * CELL_STEP - CELL_GAP / 2;
  const colon = (ref?: (element: SVGElement) => void): VNode =>
    h(
      'g',
      { fill: MIN_LEGEND },
      g.lineTops.flatMap((top) => [0.32, 0.72].map((at) => h('rect', { x: colonX - 0.55, y: top + LINE_HEIGHT * at - 0.55, width: 1.1, height: 1.1, rx: 0.2 }))),
      ref,
    );
  const housing = (_frame: VestibuloFrame, options: FamilyOptions, slots: Record<string, SVGElement>): VNode[] => [
    h('rect', { x: 0, y: 0, width: g.width, height: g.height, rx: 10, fill: HOUSING }),
    h('rect', { ...g.panel, rx: 5, fill: PANEL, stroke: '#000000', 'stroke-width': 3 }),
    ...g.dividers.map((y) => h('line', { x1: g.panel.x, y1: y, x2: g.panel.x + g.panel.width, y2: y, stroke: '#000000', 'stroke-width': 0.2 })),
    ...header,
    ...g.lineTops.map((top) => minLegend(g.minX, top)),
    ...(options.colon ? [colon((element) => (slots.colon = element))] : []),
  ];
  // Live, the colon is added the first time it is asked for, then shown or hidden.
  const fill = (_frame: VestibuloFrame, slots: Record<string, SVGElement>, options: FamilyOptions): void => {
    if (options.colon && !slots.colon && slots.title?.parentNode) {
      slots.colon = toDom(colon(), slots.title.ownerDocument);
      slots.title.parentNode.appendChild(slots.colon);
    }
    if (slots.colon) slots.colon.style.display = options.colon ? '' : 'none';
  };
  return {
    width: g.width,
    height: g.height,
    credit: `panel electromagnético de vestíbulo de PAGE Ibérica, ${lines} líneas`,
    flipDots: flipDotLines({ lines, cells: CELLS, x: g.linesX, y: g.lineTops[0]!, lineGap: g.lineGap }),
    sweep: () => flipDotSweep(lines, CELLS),
    led: ledRow(g.led.x, g.led.y, g.led.width),
    dots: (frame, options) => characterDots(Array.from({ length: lines }, (_, i) => rowCells(frame.rows[i] ?? blankRow, options)).flat(), options),
    look: flipLook,
    ledText: (frame) => frame.led,
    describe,
    housing,
    fill,
  };
}

export interface BoardShape {
  lines: number;
  /** Whether "Próxima Llegada" is printed in the header. */
  nextArrival: boolean;
}

const specs = new Map<string, SignSpec<VestibuloFrame>>();
const specFor = ({ lines, nextArrival }: BoardShape): SignSpec<VestibuloFrame> => {
  const key = `${lines}/${nextArrival}`;
  let found = specs.get(key);
  if (!found) specs.set(key, (found = spec(lines, nextArrival)));
  return found;
};

export function renderToString(shape: BoardShape, frame: VestibuloFrame, options: FamilyOptions): string {
  return renderSign(specFor(shape), frame, options);
}

export function mount(shape: BoardShape, host: Element, options: FamilyOptions, env: { ticker: Ticker }): MountedSign<VestibuloFrame> {
  const blank: VestibuloFrame = { rows: Array.from({ length: shape.lines }, () => blankRow), led: '' };
  return mountSign(specFor(shape), blank, host, options, env);
}

