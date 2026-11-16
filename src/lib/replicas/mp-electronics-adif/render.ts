import { h, hash01, marqueeWindow, MarqueeRun, mpElectronicsAdif as font, scrolls, textStrip, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { adifLogo } from './adif-logo';
import type { AdifFrame, AdifOptions, AdifRow } from './def';
import {
  BOARD_GAP,
  BOARD_WIDTH,
  CELLS,
  COLUMNS,
  FIELD_X,
  HEADER,
  PANEL_ROWS,
  panelCols,
  ROWS,
  layout,
  stackSize,
  type Layout,
} from './geometry';
import { columnLegend, TITLES, type Column, type Legend, type Regional } from './labels';

/**
 * Drawing the boards. A board has some 44 000 LEDs, too many for one element
 * each: every panel is a rectangle filled with a pattern of unlit LEDs, under
 * a second rectangle filled with lit ones and clipped to the runs of lit
 * dots. A change of text only rewrites those clip paths.
 */
const FONT_FAMILY = 'Myriad Pro, Frutiger, Segoe UI, Helvetica Neue, Arial, sans-serif';
const BODY = '#24272b';
const BODY_EDGE = '#3b3f44';
const GREEN = '#00703c';
const TAB = '#e6e7e4';
const TAB_INK = '#4d4f51';
const LEGEND_ES = '#c4c7c3';
const LEGEND_STRONG = '#eceeea';
const PANEL = '#2c2f31';
const UNLIT = '#555a5b';
/** Blank columns between the end of a running text and its start again. */
const WIDE_GAP = 32;

type Bits = number[];

const boardCount = (options: AdifOptions) => ({ across: Math.max(1, Math.min(4, options.across || 1)), down: Math.max(1, Math.min(3, options.down || 1)) });
const layoutOf = (_options: AdifOptions): Layout => layout();
const sizeOf = (options: AdifOptions) => {
  const { across, down } = boardCount(options);
  return stackSize(across, down);
};

/** A field's text in its cells: most from the left, the platform from the right, the train split in two. */
export function cellText(column: Column, value: string): string {
  const cells = CELLS[column];
  const folded = font.fold(value).slice(0, cells);
  if (column === 'platform') return folded.trim().padStart(cells);
  if (column === 'train') {
    const words = folded.trim().split(/\s+/).filter(Boolean);
    if (words.length > 1) {
      const number = words.pop()!;
      const product = words.join(' ').slice(0, Math.max(0, cells - number.length - 1));
      return product.padEnd(cells - number.length) + number;
    }
  }
  return folded.padEnd(cells);
}

/** The columns of a panel, `cols` wide. */
const panelBits = (text: string, cols: number): Bits => {
  const strip = textStrip(text, font);
  return Array.from({ length: cols }, (_, c) => strip[c] ?? 0);
};

/** Faults: dots stuck on or off, and whole rows of LEDs gone dark in a panel. Fixed by the seed. */
function withFaults(bits: Bits, panel: number, options: AdifOptions): Bits {
  const on = options.deadOn / 100;
  const off = options.deadOff / 100;
  const deadRows = options.deadRows / 100;
  if (on <= 0 && off <= 0 && deadRows <= 0) return bits;
  let rowMask = 0;
  for (let r = 0; r < PANEL_ROWS; r++) if (hash01(options.deadSeed, panel, 9999, r) < deadRows) rowMask |= 1 << r;
  return bits.map((byte, c) => {
    let out = byte;
    for (let r = 0; r < PANEL_ROWS; r++) {
      const roll = hash01(options.deadSeed, panel, c, r);
      if (roll < on) out |= 1 << r;
      else if (roll < on + off) out &= ~(1 << r);
    }
    return out & ~rowMask;
  });
}

/** Runs of lit dots as one path of rectangles, a dot being the unit square at (x + c, y + r). */
export function runsPath(bits: Bits, x: number, y: number): string {
  let d = '';
  for (let r = 0; r < PANEL_ROWS; r++) {
    let start = -1;
    for (let c = 0; c <= bits.length; c++) {
      const on = c < bits.length && ((bits[c]! >> r) & 1) === 1;
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        d += `M${x + start},${y + r}h${c - start}v1h${start - c}z`;
        start = -1;
      }
    }
  }
  return d;
}

interface Panel {
  /** Unique within the stack, for the fault seed. */
  index: number;
  x: number;
  y: number;
  cols: number;
  wide: boolean;
}

/** Every panel of the stack, in a fixed order. */
function panels(options: AdifOptions): Panel[] {
  const { across, down } = boardCount(options);
  const board = layoutOf(options);
  const out: Panel[] = [];
  for (let b = 0; b < across * down; b++) {
    const bx = (b % across) * (BOARD_WIDTH + BOARD_GAP);
    const by = Math.floor(b / across) * (board.height + BOARD_GAP);
    for (let row = 0; row < ROWS; row++) {
      COLUMNS.forEach((column, f) => {
        out.push({ index: b * 100 + row * 10 + f, x: bx + FIELD_X[column], y: by + board.rowY(row), cols: panelCols(column), wide: false });
      });
    }
    out.push({ index: b * 100 + 99, x: bx + board.wide.x, y: by + board.wide.y, cols: board.wide.cols, wide: true });
  }
  return out;
}

/** What each panel shows: the rows board after board, and the wide row's window. */
function panelTexts(frame: AdifFrame, options: AdifOptions): string[] {
  const { across, down } = boardCount(options);
  const texts: string[] = [];
  for (let b = 0; b < across * down; b++) {
    for (let row = 0; row < ROWS; row++) {
      const data: AdifRow | undefined = frame.rows[b * ROWS + row];
      for (const column of COLUMNS) texts.push(cellText(column, data ? data[keyOf(column)] : ''));
    }
    texts.push('');
  }
  return texts;
}

const keyOf = (column: Column): keyof AdifRow => (column === 'time' ? 'time' : column);

const wideStrip = (text: string): number[] => textStrip(font.fold(text), font);

/** The lit dots of every panel. `wideOffset` is how far the wide row has run. */
function litPaths(frame: AdifFrame, options: AdifOptions, wideOffset: number): string[] {
  const texts = panelTexts(frame, options);
  const { wide } = layoutOf(options);
  const strip = wideStrip(frame.wide);
  const moving = options.wideScroll && scrolls(strip, wide.cols);
  const window = marqueeWindow(strip, wide.cols, moving ? wideOffset : 0, WIDE_GAP);
  return panels(options).map((panel, i) => {
    const bits = panel.wide ? window : panelBits(texts[i]!, panel.cols);
    return runsPath(withFaults(bits, panel.index, options), panel.x, panel.y);
  });
}

// --- The printed parts -------------------------------------------------------------

const legendText = (legend: Legend, regional: Regional): { es: string; regional?: string; en: string } => ({
  es: legend.es,
  regional: regional ? legend.regional[regional] : undefined,
  en: legend.en,
});

/** A rough width of a text, to size the grey tab around the title. */
const roughWidth = (text: string, size: number, perChar = 0.53): number => text.length * size * perChar;

function header(options: AdifOptions): VNode[] {
  const title = legendText(TITLES[options.mode], options.regional);
  const big = 12.5;
  const small = 7.5;
  const tab = options.header === 'tab';
  const ink = tab ? TAB_INK : '#ffffff';
  const parts: VNode[] = [];
  const spans: VNode[] = [
    h('tspan', { 'font-size': big, 'font-weight': title.regional ? 400 : 700 }, [title.es]),
    h('tspan', { 'font-size': big, 'font-weight': 300, dx: 2.5, opacity: 0.8 }, ['|']),
  ];
  if (title.regional) {
    spans.push(h('tspan', { 'font-size': big, 'font-weight': 700, dx: 2.5 }, [title.regional]));
    spans.push(h('tspan', { 'font-size': big, 'font-weight': 300, dx: 2.5, opacity: 0.8 }, ['|']));
  }
  spans.push(h('tspan', { 'font-size': small, 'font-weight': 700, dx: 2.5, 'letter-spacing': 0.3 }, [title.en]));
  // Capitals in bold, spaced out, are wider than the mixed-case words.
  const width =
    roughWidth(title.es, big) + 8 + (title.regional ? roughWidth(title.regional, big, 0.56) + 8 : 0) + roughWidth(title.en, small, 0.76) + 10;
  parts.push(h('path', { d: `M2,0H${BOARD_WIDTH - 2}Q${BOARD_WIDTH},0 ${BOARD_WIDTH},2V${HEADER}H0V2Q0,0 2,0Z`, fill: GREEN }));
  if (tab) parts.push(h('path', { d: `M2,0H${FIELD_X.time + width}V${HEADER}H0V2Q0,0 2,0Z`, fill: TAB }));
  parts.push(h('text', { x: FIELD_X.time, y: 18.5, fill: ink }, spans));
  if (options.logo) parts.push(adifLogo(BOARD_WIDTH - 12, HEADER / 2, 10.5, '#ffffff'));
  return parts;
}

function legends(options: AdifOptions): VNode[] {
  const out: VNode[] = [];
  const base = layoutOf(options).rowsTop - 3.5;
  for (const column of COLUMNS) {
    const legend = legendText(columnLegend(column, options.mode, options.remarksEn), options.regional);
    const x = FIELD_X[column] + 0.5;
    const lines: VNode[] = [h('text', { x, y: base, 'font-size': 3.6, 'font-weight': 700, 'letter-spacing': 0.15, fill: LEGEND_ES }, [legend.en])];
    if (legend.regional) {
      lines.push(h('text', { x, y: base - 5.2, 'font-size': 6, 'font-weight': 700, fill: LEGEND_STRONG }, [legend.regional]));
      lines.push(h('text', { x, y: base - 11.4, 'font-size': 6, 'font-weight': 400, fill: LEGEND_ES }, [legend.es]));
    } else {
      lines.push(h('text', { x, y: base - 5.2, 'font-size': 6, 'font-weight': 700, fill: LEGEND_STRONG }, [legend.es]));
    }
    out.push(...lines);
  }
  return out;
}

/** One board's frame, header and legends, its origin at (0, 0). */
function board(options: AdifOptions): VNode[] {
  return [
    h('rect', { x: 0, y: 0, width: BOARD_WIDTH, height: layoutOf(options).height, rx: 2, fill: BODY, stroke: BODY_EDGE, 'stroke-width': 0.6 }),
    ...header(options),
    ...legends(options),
    h('text', { x: BOARD_WIDTH - 12, y: layoutOf(options).height - 4, 'font-size': 2.4, 'font-weight': 700, 'text-anchor': 'end', fill: '#8a8e90', 'letter-spacing': 0.2 }, ['MP ELECTRONICS']),
  ];
}

// --- The whole picture ---------------------------------------------------------------

interface Ids {
  unlit: string;
  lit: string;
  wideLit: string;
  clip: (i: number) => string;
}

const idsFor = (prefix: string): Ids => ({
  unlit: `${prefix}-unlit`,
  lit: `${prefix}-lit`,
  wideLit: `${prefix}-wide`,
  clip: (i) => `${prefix}-c${i}`,
});

const ledPattern = (id: string, fill: string, glow: boolean, ref?: (element: SVGElement) => void): VNode =>
  h('pattern', { id, width: 1, height: 1, patternUnits: 'userSpaceOnUse' }, [
    // A lit LED glows past its edge, which makes the strokes read bolder than the dots are.
    ...(glow ? [h('circle', { cx: 0.5, cy: 0.5, r: 0.5, fill, opacity: 0.4 })] : []),
    h('circle', { cx: 0.5, cy: 0.5, r: glow ? 0.42 : 0.3, fill }),
  ], ref);

function scene(options: AdifOptions, ids: Ids, paths: string[], refs?: { clips: SVGElement[]; patterns: SVGElement[] }): VNode[] {
  const { across, down } = boardCount(options);
  const all = panels(options);
  const defs = h('defs', {}, [
    ledPattern(ids.unlit, UNLIT, false),
    ledPattern(ids.lit, options.color, true, refs ? (element) => (refs.patterns[0] = element) : undefined),
    ledPattern(ids.wideLit, options.wideColor, true, refs ? (element) => (refs.patterns[1] = element) : undefined),
    ...all.map((_, i) =>
      h('clipPath', { id: ids.clip(i) }, [h('path', { d: paths[i] ?? '' }, [], refs ? (element) => (refs.clips[i] = element) : undefined)]),
    ),
  ]);
  const boards: VNode[] = [];
  for (let b = 0; b < across * down; b++) {
    const bx = (b % across) * (BOARD_WIDTH + BOARD_GAP);
    const by = Math.floor(b / across) * (layoutOf(options).height + BOARD_GAP);
    boards.push(h('g', { transform: `translate(${bx},${by})` }, board(options)));
  }
  const leds: VNode[] = all.flatMap((panel, i) => [
    h('rect', { x: panel.x - 0.4, y: panel.y - 0.4, width: panel.cols + 0.8, height: PANEL_ROWS + 0.8, fill: PANEL }),
    h('rect', { x: panel.x, y: panel.y, width: panel.cols, height: PANEL_ROWS, fill: `url(#${ids.unlit})` }),
    h('rect', { x: panel.x, y: panel.y, width: panel.cols, height: PANEL_ROWS, fill: `url(#${panel.wide ? ids.wideLit : ids.lit})`, 'clip-path': `url(#${ids.clip(i)})` }),
  ]);
  return [defs, ...boards, ...leds];
}

export function describe(frame: AdifFrame, options: AdifOptions): string {
  const title = `${TITLES[options.mode].es} / ${TITLES[options.mode].en}`;
  const rows = frame.rows
    .filter((row) => row.time || row.place)
    .map((row) => [row.time, row.place, row.train, row.platform !== '-' ? row.platform : '', row.remarks].filter(Boolean).join(' '));
  return [title, ...rows, frame.wide].filter(Boolean).join(' · ');
}

function root(frame: AdifFrame, options: AdifOptions, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  const { width, height } = sizeOf(options);
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${width} ${height}`, 'font-family': FONT_FAMILY, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(frame, options)], ref: titleRef }, ...children],
  };
}

export function renderToString(frame: AdifFrame, options: AdifOptions): string {
  const svg = root(frame, options, scene(options, idsFor('adif'), litPaths(frame, options, 0)));
  const { width, height } = sizeOf(options);
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * height) / width) * 100) / 100;
  return toDocument(svg, 'destinoteca · teleindicador LED de MP Electronics para ADIF · https://oierlauzi.github.io/destinoteca/');
}

let instances = 0;

export interface MountedAdif {
  setFrame(frame: AdifFrame): void;
  setOptions(options: AdifOptions): void;
  destroy(): void;
}

export function mount(host: Element, initial: AdifOptions, env: { ticker: Ticker }): MountedAdif {
  const doc = host.ownerDocument;
  const ids = idsFor(`adif${++instances}`);
  let frame: AdifFrame = { rows: [], wide: '' };
  let options = initial;
  let now = 0;
  const run = new MarqueeRun();
  let shown: string[] = [];
  let shownOffset = -1;
  let refs = { clips: [] as SVGElement[], patterns: [] as SVGElement[] };
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let built = '';

  /** The parts that do not move are rebuilt only when an option that shapes them changes. */
  const shapeKey = (o: AdifOptions): string =>
    JSON.stringify([o.mode, o.regional, o.header, o.logo, o.remarksEn, o.across, o.down]);

  const wideOffset = (): number => {
    const strip = wideStrip(frame.wide);
    return options.wideScroll && scrolls(strip, layoutOf(options).wide.cols) ? run.offset(now, frame.wide, options.wideSpeed) : 0;
  };

  const build = (): void => {
    refs = { clips: [], patterns: [] };
    shownOffset = wideOffset();
    shown = litPaths(frame, options, shownOffset);
    element = toDom(root(frame, options, scene(options, ids, shown, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
    built = shapeKey(options);
  };

  const draw = (force: boolean): void => {
    const offset = wideOffset();
    if (!force && offset === shownOffset) return;
    shownOffset = offset;
    const next = litPaths(frame, options, offset);
    next.forEach((d, i) => {
      if (d !== shown[i]) refs.clips[i]?.setAttribute('d', d);
    });
    shown = next;
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    now = time;
    draw(false);
  });
  build();

  return {
    setFrame(next: AdifFrame): void {
      frame = next;
      if (title) title.textContent = describe(frame, options);
      draw(true);
    },
    setOptions(next: AdifOptions): void {
      const previous = options;
      options = next;
      if (shapeKey(next) !== built) {
        build();
        return;
      }
      if (next.color !== previous.color) refs.patterns[0]?.querySelectorAll('circle').forEach((circle) => circle.setAttribute('fill', next.color));
      if (next.wideColor !== previous.wideColor) refs.patterns[1]?.querySelectorAll('circle').forEach((circle) => circle.setAttribute('fill', next.wideColor));
      draw(true);
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
