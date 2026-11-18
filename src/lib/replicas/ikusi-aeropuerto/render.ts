import { h, ikusiLcd, lcdModules, num, toDocument, toDom, updateLcd, type LcdLook, type LcdRefs, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { ikusiLogo, ikusiLogoWidth, IKUSI_GREEN } from '../ikusi/ikusi-logo';
import { IKUSI_GLASSES } from '../ikusi/glass';
import { CELL, DOTS, railRow } from '../ikusi/modules';
import { aenaPictogram, AENA_YELLOW } from './aena-pictograms';
import { columnLegend, columnSpans, composeRow, layoutOf, legendLines, TITLES, type BoardRow, type Mode, type Regional } from './columns';
import type { AirportFrame, AirportOptions, FrameColor } from './def';
import { boardRow, boardSize, clockLayout, CLOCK, CORNER, FRAME, FRAME_BOTTOM, glassX, HEADER_BOTTOM, LOGO_HEIGHT, panel, PICTO_SIZES, shapeOf, type BoardShape, type PictoSize } from './geometry';

const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
/** The printed front panel. */
const PANEL = '#1b1d20';
/** What the pictogram's aeroplane is printed in. */
const INK = '#17191c';
const WHITE = '#e9e9e4';
/** The yellow line round the front of the boards with a clock. */
const LINE = '#c9a53c';

const FRAMES: Record<FrameColor, { fill: string; rim: string; shade: string; logo: { word: string; symbol: string } }> = {
  gris: { fill: '#34363a', rim: '#4d5055', shade: '#202225', logo: { word: '#c9cbc6', symbol: '#c9cbc6' } },
  // On the aluminium frames only the symbol takes its green; the word is dark.
  plata: { fill: '#c8c9cc', rim: '#e6e7e9', shade: '#9a9ca0', logo: { word: '#3b3e42', symbol: IKUSI_GREEN } },
  negro: { fill: '#15181c', rim: '#2a2e33', shade: '#0b0c0e', logo: { word: '#c9cbc6', symbol: '#c9cbc6' } },
};

export function lcdLook(options: AirportOptions): LcdLook {
  const tint = IKUSI_GLASSES[options.glass] ?? IKUSI_GLASSES.oliva;
  return { ...DOTS, ...tint, uneven: options.uneven / 100, delamination: options.delamination / 100, seed: options.wearSeed };
}

const modeOf = (options: AirportOptions): Mode => (options.mode === 'arrivals' ? 'arrivals' : 'departures');
const regionalOf = (options: AirportOptions): Regional => (['va', 'ca', 'eu', 'de'].includes(options.regional) ? options.regional : '');

const foldRow = (row: BoardRow): BoardRow => {
  const f = ikusiLcd.foldKeepingRanges;
  return { time: f(row.time), place: f(row.place), flight: f(row.flight), counter: f(row.counter), second: f(row.second), gate: f(row.gate), remarks: f(row.remarks) };
};

/** Each row of the board as the characters of its modules. */
export function rowChars(frame: AirportFrame, options: AirportOptions): string[][] {
  const { rows, cells } = shapeOf(options);
  const layout = layoutOf(options.layout);
  return Array.from({ length: rows }, (_, i) => {
    const row = frame.rows[i];
    return row ? composeRow(foldRow(row), layout, modeOf(options), cells) : Array.from({ length: cells }, () => ' ');
  });
}

const clockChars = (frame: AirportFrame, options: AirportOptions): string[] => {
  const text = options.clockOn === false ? '' : ikusiLcd.fold(frame.clock ?? '').slice(0, CLOCK.chars);
  return Array.from({ length: CLOCK.chars }, (_, i) => text[i] ?? ' ');
};

export function describe(frame: AirportFrame, options: AirportOptions): string {
  const title = TITLES[modeOf(options)].es;
  const rows = rowChars(frame, options)
    .map((chars) => chars.join('').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return [title, ...rows].join(' · ');
}

// --- Printed text -----------------------------------------------------------------

/** Rough advance widths of Helvetica, in ems, to place printed text. */
function textWidth(value: string, size: number, bold: boolean): number {
  let em = 0;
  for (const char of value) {
    if (char === ' ') em += 0.278;
    else if ('il.,:;\'|!'.includes(char)) em += 0.24;
    else if ('fjtrI/'.includes(char)) em += 0.31;
    else if ('mwMW'.includes(char)) em += 0.86;
    else if (char >= 'A' && char <= 'Z') em += 0.68;
    else em += 0.55;
  }
  return em * size * (bold ? 1.06 : 1);
}

const print = (x: number, y: number, size: number, fill: string, weight: number, value: string, anchor = 'start'): VNode =>
  h('text', { x, y, 'font-size': size, 'font-weight': weight, fill, 'text-anchor': anchor }, [value]);

/** Legends of the columns: up to three lines over each, the Spanish one last, yellow and bold. */
function legends(options: AirportOptions, cells: number): VNode[] {
  const mode = modeOf(options);
  const regional = regionalOf(options);
  const size = 0.76 * CELL;
  const spacing = 0.9 * CELL;
  const last = HEADER_BOTTOM - 0.34 * CELL;
  const nodes: VNode[] = [];
  const spans = columnSpans(layoutOf(options.layout)[mode], cells).filter((span) => span.width > 0);
  spans.forEach((span, k) => {
    const lines = legendLines(columnLegend(span.key, mode, options.model === 'reloj'), regional);
    // A legend wider than its column is printed smaller, as «Zona/Puerta» is.
    const next = spans[k + 1];
    const room = next ? glassX(next.start) - glassX(span.start) - 0.3 * CELL : Infinity;
    lines.forEach((line, i) => {
      const y = last - (lines.length - 1 - i) * spacing;
      const es = line.lang === 'es';
      const fit = Math.min(size, (size * room) / textWidth(line.text, size, es));
      nodes.push(print(glassX(span.start), y, Math.round(fit * 1000) / 1000, es ? AENA_YELLOW : WHITE, es ? 700 : 400, line.text));
    });
  });
  return nodes;
}

/** How deep the column legends are, from the top of their first line to the rows. */
const legendDepth = (lines: number): number => 0.34 * CELL + (lines - 1) * 0.9 * CELL + 0.6 * CELL;

/**
 * The title: Aena's pictogram, and beside it the title in each language,
 * the Spanish last, yellow and bold; on some boards the terminal, large.
 * Centred over the board, or, on boards with a clock, from about a quarter
 * of the way across, after the clock, with the terminal between the
 * pictogram and the title.
 */
function title(options: AirportOptions, width: number): VNode[] {
  const mode = modeOf(options);
  const regional = regionalOf(options);
  const size = PICTO_SIZES[options.picto as PictoSize] ?? PICTO_SIZES.grande;
  const words = TITLES[mode];
  const lines = [...(regional ? [{ text: words.regional[regional], es: false }] : []), { text: words.en, es: false }, { text: words.es, es: true }];
  const legendLinesCount = regional ? 3 : 2;
  const top = FRAME + (HEADER_BOTTOM - FRAME - legendDepth(legendLinesCount) - size) / 2;
  const three = lines.length === 3;
  const font = size * (three ? 0.34 : options.model === 'reloj' ? 0.42 : 0.4);
  const spacing = size * (three ? 0.36 : 0.5);
  const firstBaseline = top + size * (three ? 0.24 : 0.38);
  const titleWidth = Math.max(...lines.map((line) => textWidth(line.text, font, line.es)));
  const terminal = String(options.terminal ?? '').trim();
  const gap = 0.75 * CELL;

  const titleAt = (x: number): VNode[] => lines.map((line, i) => print(x, firstBaseline + i * spacing, font, line.es ? AENA_YELLOW : WHITE, line.es ? 700 : 500, line.text));
  const middle = top + size / 2;

  if (options.model === 'reloj') {
    // «Terminal» and, larger, its name, then the title.
    const word = size * 0.58;
    const name = size * 1.0;
    const x0 = 0.25 * width;
    const wordX = x0 + size + 1.0 * CELL;
    const nameX = wordX + textWidth('Terminal', word, true) + 0.9 * CELL;
    const titleX = (terminal ? nameX + textWidth(terminal, name, true) : wordX - 1.0 * CELL + gap) + 1.6 * CELL;
    return [
      aenaPictogram(mode, x0, top, size, INK),
      ...(terminal
        ? [print(wordX, middle + 0.36 * word, word, AENA_YELLOW, 700, 'Terminal'), print(nameX, middle + 0.36 * name, name, AENA_YELLOW, 700, terminal)]
        : []),
      ...titleAt(titleX),
    ];
  }

  const termFont = size * 0.72;
  const termText = terminal ? `Terminal ${terminal}` : '';
  const termGap = 2.4 * CELL;
  const group = size + gap + titleWidth + (terminal ? termGap + textWidth(termText, termFont, true) : 0);
  const x0 = 0.48 * width - group / 2;
  return [
    aenaPictogram(mode, x0, top, size, INK),
    ...titleAt(x0 + size + gap),
    ...(terminal ? [print(x0 + size + gap + titleWidth + termGap, middle + 0.36 * termFont, termFont, AENA_YELLOW, 700, termText)] : []),
  ];
}

// --- The board --------------------------------------------------------------------

interface Slots {
  rows: LcdRefs[];
  clock: LcdRefs;
}

const newSlots = (rows: number): Slots => ({ rows: Array.from({ length: rows }, () => ({ glyph: [] })), clock: { glyph: [] } });

function frameNodes(options: AirportOptions, shape: BoardShape): VNode[] {
  const { width, height } = boardSize(shape);
  const colors = FRAMES[options.frame] ?? FRAMES.gris;
  const rx = options.rounded ? CORNER.rounded : CORNER.square;
  const inner = panel(shape);
  const nodes: VNode[] = [
    h('rect', { x: 0, y: 0, width, height, rx, fill: colors.fill }),
    // The light along the outer edge, and the shade where the frame meets the panel.
    h('rect', { x: 0.3, y: 0.3, width: width - 0.6, height: height - 0.6, rx: Math.max(0, rx - 0.3), fill: 'none', stroke: colors.rim, 'stroke-width': 0.6 }),
    h('rect', { x: inner.x - 0.4, y: inner.y - 0.4, width: inner.width + 0.8, height: inner.height + 0.8, rx: options.rounded ? 0.6 * CELL : 0, fill: colors.shade }),
    h('rect', { ...inner, rx: options.rounded ? 0.5 * CELL : 0, fill: PANEL }),
  ];
  const logoWidth = ikusiLogoWidth(LOGO_HEIGHT);
  // On the boards with a yellow line the logo stands further in, and the line is broken for it.
  const logoX = width - (options.model === 'reloj' ? 2.6 : 0.75) * CELL - logoWidth;
  const logoMiddle = height - FRAME_BOTTOM / 2;
  if (options.model === 'reloj') nodes.push(yellowLine(width, logoMiddle, logoX, logoX + logoWidth));
  nodes.push(ikusiLogo(logoX, logoMiddle - LOGO_HEIGHT / 2, LOGO_HEIGHT, colors.logo.word, colors.logo.symbol));
  return nodes;
}

/**
 * The yellow line of the boards with a clock: near the outer edge on the
 * sides and the top, through the middle of the bottom band, with rounded
 * corners, and stopping on either side of the logo.
 */
function yellowLine(width: number, bottom: number, logoFrom: number, logoTo: number): VNode {
  const inset = 0.42 * CELL;
  const r = 0.5 * CELL;
  const gap = 0.35 * CELL;
  const arc = (x: number, y: number) => `A${r} ${r} 0 0 1 ${num(x)} ${num(y)}`;
  const d = [
    `M${num(logoFrom - gap)} ${num(bottom)}`,
    `H${num(inset + r)}`,
    arc(inset, bottom - r),
    `V${num(inset + r)}`,
    arc(inset + r, inset),
    `H${num(width - inset - r)}`,
    arc(width - inset, inset + r),
    `V${num(bottom - r)}`,
    arc(width - inset - r, bottom),
    `H${num(logoTo + gap)}`,
  ].join('');
  return h('path', { d, fill: 'none', stroke: LINE, 'stroke-width': 0.5 });
}

/** A clock switched off, as in Asturias: no glow behind its glasses. */
const clockLook = (options: AirportOptions, look: LcdLook): LcdLook => (options.clockOn === false ? { ...look, blank: '#2c2d2a', blankDull: '#1d1e1c' } : look);

function clockNodes(frame: AirportFrame, options: AirportOptions, rowsLook: LcdLook, first: number, slots: Slots): VNode[] {
  const clock = clockLayout();
  const box = clock.window;
  const look = clockLook(options, rowsLook);
  return [
    h('rect', { x: box.x - 0.5, y: box.y - 0.5, width: box.width + 1, height: box.height + 1, fill: '#060707' }),
    h('g', { transform: clock.transform }, [...railRow(clock.row), ...lcdModules(clock.row.glasses, clockChars(frame, options), ikusiLcd, look, first, slots.clock)]),
  ];
}

function scene(frame: AirportFrame, options: AirportOptions, slots: Slots): VNode[] {
  const shape = shapeOf(options);
  const { width } = boardSize(shape);
  const look = lcdLook(options);
  const chars = rowChars(frame, options);
  const nodes: VNode[] = [...frameNodes(options, shape), ...title(options, width), ...legends(options, shape.cells)];
  if (options.model === 'reloj') nodes.push(...clockNodes(frame, options, look, shape.rows * shape.cells, slots));
  for (let i = 0; i < shape.rows; i++) {
    const row = boardRow(i, shape.cells);
    nodes.push(...railRow(row), ...lcdModules(row.glasses, chars[i]!, ikusiLcd, look, i * shape.cells, slots.rows[i]));
  }
  return nodes;
}

function root(frame: AirportFrame, options: AirportOptions, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  const { width, height } = boardSize(shapeOf(options));
  return h('svg', { viewBox: `0 0 ${width} ${height}`, 'font-family': FONT, role: 'img' }, [h('title', {}, [describe(frame, options)], titleRef), ...children]);
}

export function renderToString(frame: AirportFrame, options: AirportOptions): string {
  const shape = shapeOf(options);
  const { width, height } = boardSize(shape);
  const svg = root(frame, options, scene(frame, options, newSlots(shape.rows)));
  svg.attrs.width = 1600;
  svg.attrs.height = Math.round(((1600 * height) / width) * 100) / 100;
  return toDocument(svg, 'destinoteca · panel de salidas y llegadas de cristal líquido de Ikusi · https://oierlauzi.github.io/destinoteca/');
}

export interface MountedAirport {
  setFrame(frame: AirportFrame): void;
  setOptions(options: AirportOptions): void;
  destroy(): void;
}

/** Liquid crystal changes at once: the characters are redrawn when the frame changes, and nothing moves in between. */
export function mount(host: Element, initial: AirportOptions, _env: { ticker: Ticker }): MountedAirport {
  const doc = host.ownerDocument;
  let options = initial;
  let frame: AirportFrame = { rows: [], clock: '' };
  let slots = newSlots(0);
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;

  const build = (): void => {
    slots = newSlots(shapeOf(options).rows);
    element = toDom(root(frame, options, scene(frame, options, slots), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
  };
  build();

  return {
    setFrame(next: AirportFrame): void {
      frame = next;
      const shape = shapeOf(options);
      const look = lcdLook(options);
      const chars = rowChars(frame, options);
      for (let i = 0; i < shape.rows; i++) updateLcd(slots.rows[i]!, boardRow(i, shape.cells).glasses, chars[i]!, ikusiLcd, look);
      if (options.model === 'reloj') updateLcd(slots.clock, clockLayout().row.glasses, clockChars(frame, options), ikusiLcd, look);
      if (title) title.textContent = describe(frame, options);
    },
    setOptions(next: AirportOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      element?.remove();
    },
  };
}
