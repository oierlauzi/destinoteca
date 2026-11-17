import { cp437, h, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import type { SolariFrame, SolariOptions, SolariRow } from './def';
import { boardsOf } from './def';
import { boardOrigin, DEFAULT_ROWS, FLAP, FLAP_GAP, layout, MINUTE_DOT, stackSize, TITLES, type Layout, type Variant } from './geometry';

/** The dark skin: a light frame, black flaps with white lettering. */
const FONT = "'DIN Condensed', 'Oswald', 'Roboto Condensed', 'Arial Narrow', sans-serif";
const FRAME_FILL = '#e8e3cc';
const FRAME_EDGE = '#b8b297';
const TITLE_INK = '#3b3a35';
const PANEL_FILL = '#141514';
const FLAP_TOP = '#2b2c2b';
const FLAP_BOTTOM = '#212221';
const INK = '#f1eee2';
const LEGEND_INK = '#c4c2b8';
const LAMP_OFF = '#4a1c15';
const LAMP_ON = '#ff5b38';

const fold = cp437.fold;

// --- What each flap can show, in the order its flaps fall --------------------------------

const CHARS = Array.from(' ABCDEFGHIJKLMNÑOPQRSTUVWXYZ0123456789-./');
const DIGITS = Array.from(' 0123456789');
const HOURS = ['', ...Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))];
const PLATFORMS = ['', ...Array.from({ length: 30 }, (_, i) => String(i + 1))];
/** The words of the train flaps, as far as the photographs show them. */
const WORDS: Record<Variant, string[]> = {
  largo: ['', 'TALGO', 'TALGO PENDULAR', 'TALGO EXTREMADURA', 'RAPIDO', 'RAP. ARAGON', 'EXPRESO', 'ELECTROTREN', 'INTERURBANO', 'TER', 'ESTRELLA'],
  cercanias: ['', 'TRANVIA'],
};

type FlapKind = 'char' | 'digit' | 'hour' | 'platform' | 'word';

interface Flap {
  kind: FlapKind;
  x: number;
  y: number;
  width: number;
  seq: string[];
  /** Which row and field it belongs to, and for a character, its place in the field. */
  row: number;
  key: string;
  index: number;
}

interface Lamp {
  cx: number;
  cy: number;
  row: number;
  which: number;
}

const charsWidth = (count: number): number => count * FLAP.width + (count - 1) * FLAP_GAP;

/** Every flap and lamp of a stack of boards; rows are numbered board after board. */
function stackParts(variant: Variant, options: SolariOptions): { flaps: Flap[]; lamps: Lamp[] } {
  const { across, down } = boardsOf(options);
  const perBoard = DEFAULT_ROWS[variant];
  const l = layout(variant, perBoard);
  const flaps: Flap[] = [];
  const lamps: Lamp[] = [];
  for (let b = 0; b < across * down; b++) {
    const origin = boardOrigin(variant, across, b);
    const board = parts(l, variant, perBoard, b * perBoard);
    flaps.push(...board.flaps.map((flap) => ({ ...flap, x: flap.x + origin.x, y: flap.y + origin.y })));
    lamps.push(...board.lamps.map((lamp) => ({ ...lamp, cx: lamp.cx + origin.x, cy: lamp.cy + origin.y })));
  }
  return { flaps, lamps };
}

function parts(l: Layout, variant: Variant, rows: number, first = 0): { flaps: Flap[]; lamps: Lamp[] } {
  const flaps: Flap[] = [];
  const lamps: Lamp[] = [];
  for (let line = 0; line < rows; line++) {
    const y = l.rowY(line);
    const row = first + line;
    for (const field of l.fields) {
      const base = { y, row, key: field.key };
      switch (field.kind) {
        case 'word':
          flaps.push({ ...base, kind: 'word', x: field.x, width: field.width, seq: field.key === 't' ? WORDS[variant] : [''], index: 0 });
          break;
        case 'place':
          for (let i = 0; i < 12; i++) flaps.push({ ...base, kind: 'char', x: field.x + i * (FLAP.width + FLAP_GAP), width: FLAP.width, seq: CHARS, index: i });
          break;
        case 'time': {
          // The hour flap is a little wider than two digits: the dot after the hour is printed on it.
          const hourWidth = charsWidth(2) + MINUTE_DOT - FLAP_GAP;
          flaps.push({ ...base, kind: 'hour', x: field.x, width: hourWidth, seq: HOURS, index: 0 });
          const minutesX = field.x + hourWidth + FLAP_GAP;
          for (let i = 0; i < 2; i++) flaps.push({ ...base, kind: 'digit', x: minutesX + i * (FLAP.width + FLAP_GAP), width: FLAP.width, seq: DIGITS, index: i + 1 });
          break;
        }
        case 'platform':
          flaps.push({ ...base, kind: 'platform', x: field.x, width: field.width, seq: PLATFORMS, index: 0 });
          break;
        case 'lamps':
          for (let i = 0; i < 2; i++) lamps.push({ cx: field.x + 1.4 + i * 3.2, cy: y + FLAP.height / 2, row, which: i });
          break;
      }
    }
  }
  return { flaps, lamps };
}

/** What one flap should show for a row of the frame. */
function flapValue(flap: Flap, row: SolariRow | undefined): string {
  const value = row?.[flap.key] ?? '';
  switch (flap.kind) {
    case 'word':
      return fold(value).trim();
    case 'char':
      return fold(value).padEnd(12).slice(0, 12)[flap.index] ?? ' ';
    case 'platform':
      return value.trim();
    case 'hour':
    case 'digit': {
      const match = /^\s*(\d{1,2})[.:h](\d{2})\s*$/.exec(value);
      if (!match) return flap.kind === 'hour' ? '' : ' ';
      if (flap.kind === 'hour') return match[1]!.padStart(2, '0');
      return match[2]![flap.index - 1] ?? ' ';
    }
  }
}

const lampsLit = (row: SolariRow | undefined): number => Math.max(0, Math.min(2, Number(row?.l) || 0));

// --- Drawing ----------------------------------------------------------------------

/** A word too long for one line goes on two; lettering wider than the flap is squeezed. */
function wordLines(text: string): string[] {
  if (text.length <= 9 || !text.includes(' ')) return [text];
  const cut = text.lastIndexOf(' ', Math.ceil(text.length / 2) + 2);
  const at = cut > 0 ? cut : text.indexOf(' ');
  return [text.slice(0, at), text.slice(at + 1)];
}

type Half = 'top' | 'bottom';

/** What is printed on a flap showing `value`, in board coordinates. The dot of an hour is low enough to be on its bottom half only. */
function printed(flap: Flap, value: string, half: Half): VNode[] {
  const cy = flap.y + FLAP.height / 2;
  if (flap.kind === 'word') {
    const lines = wordLines(value);
    const size = lines.length === 1 ? FLAP.height * 0.42 : FLAP.height * 0.3;
    const room = flap.width * 0.9;
    return lines.filter(Boolean).map((line, i) => {
      const y = lines.length === 1 ? cy + size * 0.36 : cy + (i === 0 ? -0.6 : size + 0.4);
      // Every word is set to a width of its own, never wider than the flap, so that it fits whatever the font.
      const width = Math.min(room, line.length * size * 0.52);
      return h('text', { x: flap.x + flap.width / 2, y, 'font-size': size, 'text-anchor': 'middle', textLength: width, lengthAdjust: 'spacingAndGlyphs', fill: INK }, [line]);
    });
  }
  if (!value.trim()) return [];
  const digitsWidth = flap.kind === 'hour' ? charsWidth(2) : flap.width;
  const nodes = [h('text', { x: flap.x + digitsWidth / 2, y: cy + FLAP.height * 0.27, 'font-size': FLAP.height * 0.74, 'text-anchor': 'middle', fill: INK }, [value])];
  // The hour's dot is printed on its flap, after the digits.
  if (flap.kind === 'hour' && half === 'bottom') nodes.push(h('circle', { cx: flap.x + charsWidth(2) + (MINUTE_DOT - FLAP_GAP) / 2, cy: flap.y + FLAP.height * 0.78, r: 0.55, fill: INK }));
  return nodes;
}

/** One half of a flap: its card and whatever of the lettering falls in it. */
function halfNodes(flap: Flap, half: Half, value: string): VNode {
  const top = half === 'top' ? flap.y : flap.y + FLAP.height / 2;
  const box = { x: flap.x, y: top, width: flap.width, height: FLAP.height / 2 };
  return h('svg', { ...box, viewBox: `${box.x} ${box.y} ${box.width} ${box.height}`, overflow: 'hidden' }, halfContent(flap, half, value));
}

const halfContent = (flap: Flap, half: Half, value: string): VNode[] => [
  h('rect', { x: flap.x, y: half === 'top' ? flap.y : flap.y + FLAP.height / 2, width: flap.width, height: FLAP.height / 2, rx: 0.4, fill: half === 'top' ? FLAP_TOP : FLAP_BOTTOM }),
  ...printed(flap, value, half),
];

interface FlapRefs {
  top?: SVGElement;
  bottom?: SVGElement;
  /** The leaf that turns over the hinge during a change. */
  leaf?: SVGElement;
  leafHalf?: SVGElement;
}

function flapNodes(flap: Flap, value: string, refs?: FlapRefs): VNode[] {
  const ref = (key: keyof FlapRefs) => (refs ? (element: SVGElement) => (refs[key] = element) : undefined);
  const nodes: VNode[] = [
    // The opening each flap turns in, with a small bezel round it.
    h('rect', { x: flap.x - 0.45, y: flap.y - 0.45, width: flap.width + 0.9, height: FLAP.height + 0.9, rx: 0.7, fill: '#090909', stroke: '#3c3d3b', 'stroke-width': 0.25 }),
    { ...halfNodes(flap, 'top', value), ref: ref('top') },
    { ...halfNodes(flap, 'bottom', value), ref: ref('bottom') },
  ];
  if (refs) nodes.push(h('g', { display: 'none' }, [{ ...halfNodes(flap, 'top', value), ref: ref('leafHalf') }], ref('leaf')));
  const hinge = flap.y + FLAP.height / 2;
  nodes.push(h('line', { x1: flap.x, y1: hinge, x2: flap.x + flap.width, y2: hinge, stroke: '#070707', 'stroke-width': 0.3 }));
  return nodes;
}

function board(variant: Variant, l: Layout): VNode[] {
  const { panel, frame } = l;
  return [
    h('rect', { x: 0, y: 0, width: l.width, height: l.height, rx: 1.2, fill: FRAME_FILL, stroke: FRAME_EDGE, 'stroke-width': 0.6 }),
    h('text', { x: l.width / 2, y: frame.title - 3.4, 'text-anchor': 'middle', 'font-size': 7, 'letter-spacing': 2.4, fill: TITLE_INK }, [TITLES[variant]]),
    h('rect', { ...panel, fill: PANEL_FILL }),
    ...l.fields
      .filter((field) => field.legend)
      .map((field) =>
        h('text', { x: field.x + field.width / 2, y: l.legendY, 'text-anchor': 'middle', 'font-size': 4.4, 'font-style': 'italic', fill: LEGEND_INK }, [field.legend]),
      ),
    h('text', { x: panel.x + panel.width - 2, y: l.height - 2.4, 'text-anchor': 'end', 'font-size': 2.4, fill: '#57554c' }, ['solari&c. udine, italy']),
  ];
}

const lampNode = (lamp: Lamp, lit: boolean, ref?: (element: SVGElement) => void): VNode =>
  h('circle', { cx: lamp.cx, cy: lamp.cy, r: 1.15, fill: lit ? LAMP_ON : LAMP_OFF }, [], ref);

function scene(variant: Variant, frame: SolariFrame, options: SolariOptions, refs?: { flaps: FlapRefs[]; lamps: SVGElement[] }): VNode[] {
  const { across, down } = boardsOf(options);
  const l = layout(variant, DEFAULT_ROWS[variant]);
  const { flaps, lamps } = stackParts(variant, options);
  const nodes: VNode[] = [];
  for (let b = 0; b < across * down; b++) {
    const origin = boardOrigin(variant, across, b);
    nodes.push(h('g', { transform: `translate(${origin.x},${origin.y})` }, board(variant, l)));
  }
  flaps.forEach((flap, i) => {
    const flapRefs = refs ? (refs.flaps[i] = {}) : undefined;
    nodes.push(...flapNodes(flap, flapValue(flap, frame.rows[flap.row]), flapRefs));
  });
  lamps.forEach((lamp, i) => nodes.push(lampNode(lamp, lamp.which < lampsLit(frame.rows[lamp.row]), refs ? (element) => (refs.lamps[i] = element) : undefined)));
  return nodes;
}

export function describe(variant: Variant, frame: SolariFrame): string {
  const rows = frame.rows
    .map((row) => Object.entries(row).filter(([key, value]) => key !== 'l' && value).map(([, value]) => value).join(' '))
    .filter(Boolean);
  return [TITLES[variant], ...rows].join(' · ');
}

const sizeOf = (variant: Variant, options: SolariOptions) => {
  const { across, down } = boardsOf(options);
  return stackSize(variant, across, down);
};

function root(variant: Variant, frame: SolariFrame, options: SolariOptions, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  const { width, height } = sizeOf(variant, options);
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${width} ${height}`, 'font-family': FONT, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(variant, frame)], ref: titleRef }, ...children],
  };
}

export function renderToString(variant: Variant, frame: SolariFrame, options: SolariOptions): string {
  const svg = root(variant, frame, options, scene(variant, frame, options));
  const { width, height } = sizeOf(variant, options);
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * height) / width) * 100) / 100;
  return toDocument(svg, 'destinoteca · panel de paletas de Solari · https://oierlauzi.github.io/destinoteca/');
}

// --- Live: the flaps turn one by one until each shows what it should ---------------------------

interface FlapState {
  flap: Flap;
  refs: FlapRefs;
  /** Where in its sequence it is, what it shows, and what it is turning to. */
  position: number;
  shown: string;
  target: string;
  steps: number;
  /** The flap turning now: from `shown` to `next`, started at `since`. */
  next?: string;
  since: number;
  phase: 0 | 1 | 2;
}

/** How many flaps fall to go from `from` to `to`; a value not on the flaps comes after a few. */
function stepsBetween(seq: string[], from: number, to: string): number {
  const at = seq.indexOf(to);
  if (at < 0) return Math.min(seq.length, 6);
  return (at - from + seq.length) % seq.length;
}

let instances = 0;

export interface MountedSolari {
  setFrame(frame: SolariFrame): void;
  setOptions(options: SolariOptions): void;
  destroy(): void;
}

export function mount(variant: Variant, host: Element, initial: SolariOptions, env: { ticker: Ticker }): MountedSolari {
  const doc = host.ownerDocument;
  instances++;
  let options = initial;
  let frame: SolariFrame = { rows: [] };
  let states: FlapState[] = [];
  let lamps: Lamp[] = [];
  let lampRefs: SVGElement[] = [];
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let now = 0;

  const paint = (target: SVGElement | undefined, flap: Flap, half: Half, value: string): void => {
    if (!target) return;
    const top = half === 'top' ? flap.y : flap.y + FLAP.height / 2;
    target.setAttribute('y', String(top));
    target.setAttribute('viewBox', `${flap.x} ${top} ${flap.width} ${FLAP.height / 2}`);
    target.replaceChildren(...halfContent(flap, half, value).map((node) => toDom(node, doc)));
  };

  const build = (): void => {
    const refs = { flaps: [] as FlapRefs[], lamps: [] as SVGElement[] };
    const shape = stackParts(variant, options);
    lamps = shape.lamps;
    element = toDom(root(variant, frame, options, scene(variant, frame, options, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
    lampRefs = refs.lamps;
    states = shape.flaps.map((flap, i) => {
      const value = flapValue(flap, frame.rows[flap.row]);
      return { flap, refs: refs.flaps[i]!, position: Math.max(0, flap.seq.indexOf(value)), shown: value, target: value, steps: 0, since: 0, phase: 0 };
    });
  };

  const stepMs = (): number => 1000 / Math.max(1, options.speed);

  /** The next card falls: the top already shows it, the old top falls over the hinge. */
  const beginStep = (state: FlapState): void => {
    state.position = (state.position + 1) % state.flap.seq.length;
    state.next = state.steps === 1 ? state.target : (state.flap.seq[state.position] ?? '');
    state.since = now;
    state.phase = 1;
    paint(state.refs.top, state.flap, 'top', state.next);
    paint(state.refs.leafHalf, state.flap, 'top', state.shown);
    state.refs.leaf?.removeAttribute('display');
  };

  const endStep = (state: FlapState): void => {
    state.shown = state.next ?? state.shown;
    state.next = undefined;
    state.steps--;
    state.phase = 0;
    paint(state.refs.bottom, state.flap, 'bottom', state.shown);
    state.refs.leaf?.setAttribute('display', 'none');
  };

  const hinge = (state: FlapState, scale: number): string => {
    const y = state.flap.y + FLAP.height / 2;
    return `matrix(1,0,0,${Math.max(0.001, scale)},0,${y * (1 - Math.max(0.001, scale))})`;
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    now = time;
    for (const state of states) {
      if (state.steps <= 0) continue;
      if (state.phase === 0) beginStep(state);
      const t = (now - state.since) / stepMs();
      if (t >= 1) {
        endStep(state);
        if (state.steps > 0) beginStep(state);
        continue;
      }
      // First half: the old top folds down to the hinge. Second half: the new bottom unfolds from it.
      if (t >= 0.5 && state.phase === 1) {
        state.phase = 2;
        paint(state.refs.leafHalf, state.flap, 'bottom', state.next ?? '');
      }
      state.refs.leaf?.setAttribute('transform', hinge(state, state.phase === 1 ? 1 - 2 * t : 2 * t - 1));
    }
  });
  build();

  return {
    setFrame(next: SolariFrame): void {
      frame = next;
      if (title) title.textContent = describe(variant, next);
      for (const state of states) {
        const target = flapValue(state.flap, next.rows[state.flap.row]);
        if (target === state.target) continue;
        state.target = target;
        if (!options.animate) {
          if (state.phase) endStep(state);
          state.steps = 0;
          state.position = Math.max(0, state.flap.seq.indexOf(target));
          state.shown = target;
          paint(state.refs.top, state.flap, 'top', target);
          paint(state.refs.bottom, state.flap, 'bottom', target);
          continue;
        }
        // A flap already turning finishes its card, then goes on towards the new value.
        state.steps = (state.phase ? 1 : 0) + stepsBetween(state.flap.seq, state.position, target);
        if (state.steps === 0 && target !== state.shown) state.steps = 1;
      }
      lampRefs.forEach((lamp, i) => {
        const info = lamps[i];
        if (info) lamp.setAttribute('fill', info.which < lampsLit(next.rows[info.row]) ? LAMP_ON : LAMP_OFF);
      });
    },
    setOptions(next: SolariOptions): void {
      const reshape = JSON.stringify(boardsOf(next)) !== JSON.stringify(boardsOf(options));
      options = next;
      if (reshape) build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
