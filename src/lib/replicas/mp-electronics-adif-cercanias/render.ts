import { cp437, h, telenorma5x7, textColumns, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { adifLogo } from '../mp-electronics-adif/adif-logo';
import { mpLogo } from '../mp-electronics-adif/mp-logo';
import { BEZEL, BODY, BODY_EDGE, FONT_FAMILY, GREEN, LEGEND_ES, LEGEND_STRONG, ledPattern, PANEL, runsPath, UNLIT, withFaults } from '../mp-electronics-adif/render';
import { cercaniasRoundel } from '../page-iberica-electromagneticos/parts';
import type { CercaniasFrame, CercaniasOptions, CercaniasRow } from './def';
import { ADVANCE, AT, CELLS, HEADER, ROW_COLS, ROW_DOTS, ROW_CELLS, ROWS, ROWS_TOP, ROWS_X, rowY, SIZE } from './geometry';

/**
 * The glyphs of this board have not been read from a photograph: a standard
 * 5 x 7 alphabet is used, which they resemble.
 */
const font = telenorma5x7;
const charset = cp437;

/** A row's 26 characters: the platform to the right of its two, the destination after a gap, the time at the end. */
export function rowText(row: CercaniasRow): string {
  const cells = Array.from({ length: ROW_CELLS }, () => ' ');
  const put = (text: string, from: number, width: number, right: boolean, keepCase = false) => {
    // Names are in capitals; the minutes keep their lowercase "min" and "m.".
    const folded = (keepCase ? text : charset.fold(text)).slice(0, width);
    const start = right ? from + width - folded.length : from;
    Array.from(folded).forEach((char, i) => (cells[start + i] = char));
  };
  put(row.platform.trim(), AT.platform, CELLS.platform, true);
  put(row.destination.trim(), AT.destination, CELLS.destination, false);
  put(row.time.trim(), AT.time, CELLS.time, true, true);
  return cells.join('');
}

const rowBits = (row: CercaniasRow): number[] => {
  const strip = textColumns(rowText(row), font, charset, ADVANCE - font.cols);
  return Array.from({ length: ROW_COLS }, (_, c) => strip[c] ?? 0);
};

/** The lit dots of every row, faults included, kept inside its seven rows. */
function litPaths(frame: CercaniasFrame, options: CercaniasOptions): string[] {
  const mask = (1 << ROW_DOTS) - 1;
  return Array.from({ length: ROWS }, (_, i) => {
    const bits = withFaults(rowBits(frame.rows[i] ?? { platform: '', destination: '', time: '' }), i, options).map((byte) => byte & mask);
    return runsPath(bits, ROWS_X, rowY(i));
  });
}

function legend(x: number, y: number, es: string, en: string, anchor: 'start' | 'end' = 'start'): VNode[] {
  return [
    h('text', { x, y, 'font-size': 4.6, 'font-weight': 700, fill: LEGEND_STRONG, 'text-anchor': anchor }, [es]),
    h('text', { x, y: y + 3.2, 'font-size': 2.6, 'font-weight': 700, fill: LEGEND_ES, 'letter-spacing': 0.12, 'text-anchor': anchor }, [en]),
  ];
}

interface Ids {
  unlit: string;
  lit: string;
  clip: (i: number) => string;
}
const idsFor = (prefix: string): Ids => ({ unlit: `${prefix}-u`, lit: `${prefix}-l`, clip: (i) => `${prefix}-c${i}` });

function scene(options: CercaniasOptions, ids: Ids, paths: string[], refs?: { clips: SVGElement[]; pattern?: SVGElement }): VNode[] {
  const { width, height } = SIZE;
  const top = ROWS_TOP - 6.5;
  const nodes: VNode[] = [
    h('defs', {}, [
      ledPattern(ids.unlit, UNLIT, false),
      ledPattern(ids.lit, options.color, true, refs ? (element) => (refs.pattern = element) : undefined),
      ...paths.map((d, i) => h('clipPath', { id: ids.clip(i) }, [h('path', { d }, [], refs ? (element) => (refs.clips[i] = element) : undefined)])),
    ]),
    h('rect', { x: 0, y: 0, width, height, rx: 1.5, fill: BODY, stroke: BODY_EDGE, 'stroke-width': 0.6 }),
    h('path', { d: `M1.5,0H${width - 1.5}Q${width},0 ${width},1.5V${HEADER}H0V1.5Q0,0 1.5,0Z`, fill: GREEN }),
    h('text', { x: ROWS_X, y: HEADER / 2 + 2.6, fill: '#ffffff' }, [
      h('tspan', { 'font-size': 7, 'font-weight': 700 }, ['Salidas']),
      h('tspan', { 'font-size': 7, 'font-weight': 300, dx: 1.6, opacity: 0.8 }, ['|']),
      h('tspan', { 'font-size': 4.2, 'font-weight': 700, dx: 1.6, 'letter-spacing': 0.2 }, ['DEPARTURES']),
    ]),
    adifLogo(width - ROWS_X, HEADER / 2, 6, '#ffffff'),
    // The roundel stands in the middle of the grey band, halfway between the header and the first row.
    cercaniasRoundel(width / 2, (HEADER + ROWS_TOP - 1) / 2, 4.6),
    ...legend(ROWS_X, top, 'Vía', 'PLATFORM'),
    ...legend(ROWS_X + AT.destination * ADVANCE, top, 'Destino', 'DESTINATION'),
    ...legend(ROWS_X + ROW_COLS, top, 'Próximo tren', 'NEXT TRAIN', 'end'),
    mpLogo(width - ROWS_X, height - 2.2, 1.3, '#7f8386'),
  ];
  for (let i = 0; i < ROWS; i++) {
    const y = rowY(i);
    nodes.push(
      h('rect', { x: ROWS_X - 1, y: y - 1, width: ROW_COLS + 2, height: ROW_DOTS + 2, rx: 0.6, fill: BEZEL }),
      h('rect', { x: ROWS_X - 0.3, y: y - 0.3, width: ROW_COLS + 0.6, height: ROW_DOTS + 0.6, fill: PANEL }),
      h('rect', { x: ROWS_X, y, width: ROW_COLS, height: ROW_DOTS, fill: `url(#${ids.unlit})` }),
      h('rect', { x: ROWS_X, y, width: ROW_COLS, height: ROW_DOTS, fill: `url(#${ids.lit})`, 'clip-path': `url(#${ids.clip(i)})` }),
    );
  }
  return nodes;
}

export function describe(frame: CercaniasFrame): string {
  const rows = frame.rows
    .filter((row) => row.destination)
    .map((row) => [row.platform && `Vía ${row.platform}`, row.destination, row.time].filter(Boolean).join(' '));
  return ['Salidas / Departures', ...rows].join(' · ');
}

function root(frame: CercaniasFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${SIZE.width} ${SIZE.height}`, 'font-family': FONT_FAMILY, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(frame)], ref: titleRef }, ...children],
  };
}

export function renderToString(frame: CercaniasFrame, options: CercaniasOptions): string {
  const svg = root(frame, scene(options, idsFor('cercanias'), litPaths(frame, options)));
  svg.attrs.width = 1000;
  svg.attrs.height = Math.round(((1000 * SIZE.height) / SIZE.width) * 100) / 100;
  return toDocument(svg, 'destinoteca · panel LED de Cercanías de MP Electronics para ADIF · https://oierlauzi.github.io/destinoteca/');
}

let instances = 0;

export interface MountedCercanias {
  setFrame(frame: CercaniasFrame): void;
  setOptions(options: CercaniasOptions): void;
  destroy(): void;
}

export function mount(host: Element, initial: CercaniasOptions, _env: { ticker: Ticker }): MountedCercanias {
  const doc = host.ownerDocument;
  const ids = idsFor(`cercanias${++instances}`);
  let options = initial;
  let frame: CercaniasFrame = { rows: [] };
  let refs: { clips: SVGElement[]; pattern?: SVGElement } = { clips: [] };
  let shown: string[] = [];
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;

  const build = (): void => {
    refs = { clips: [] };
    shown = litPaths(frame, options);
    element = toDom(root(frame, scene(options, ids, shown, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
  };
  build();

  return {
    setFrame(next: CercaniasFrame): void {
      frame = next;
      if (title) title.textContent = describe(next);
      const paths = litPaths(frame, options);
      paths.forEach((d, i) => {
        if (d !== shown[i]) refs.clips[i]?.setAttribute('d', d);
      });
      shown = paths;
    },
    setOptions(next: CercaniasOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      element?.remove();
    },
  };
}
