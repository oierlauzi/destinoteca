import { cp437, h, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import type { SolariFrame, SolariOptions, SolariRow } from './def';
import { rowsOf } from './def';
import { FLAP, FLAP_GAP, layout, MINUTE_DOT, TITLES, type Layout, type Variant } from './geometry';

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

function parts(l: Layout, variant: Variant, rows: number): { flaps: Flap[]; lamps: Lamp[] } {
  const flaps: Flap[] = [];
  const lamps: Lamp[] = [];
  for (let row = 0; row < rows; row++) {
    const y = l.rowY(row);
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
          const hourWidth = charsWidth(2);
          flaps.push({ ...base, kind: 'hour', x: field.x, width: hourWidth, seq: HOURS, index: 0 });
          const minutesX = field.x + hourWidth + MINUTE_DOT;
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

function textAttrs(flap: Flap, line: number, lines: number, value: string): Record<string, string | number | undefined> {
  const cx = flap.x + flap.width / 2;
  const cy = flap.y + FLAP.height / 2;
  if (flap.kind !== 'word') return { x: cx, y: cy + FLAP.height * 0.27, 'font-size': FLAP.height * 0.74, 'text-anchor': 'middle' };
  const size = lines === 1 ? FLAP.height * 0.42 : FLAP.height * 0.3;
  const y = lines === 1 ? cy + size * 0.36 : cy + (line === 0 ? -0.6 : size + 0.4);
  // Every word is set to a width of its own, never wider than the flap, so that it fits whatever the font.
  const room = flap.width * 0.9;
  const width = Math.min(room, value.length * size * 0.52);
  return {
    x: cx,
    y,
    'font-size': size,
    'text-anchor': 'middle',
    textLength: value ? width : undefined,
    lengthAdjust: value ? 'spacingAndGlyphs' : undefined,
  };
}

interface FlapRefs {
  lines: SVGElement[];
  shade?: SVGElement;
  /** The dot after an hour, shown only with one. */
  dot?: SVGElement;
}

function flapNodes(flap: Flap, value: string, refs?: FlapRefs): VNode[] {
  const half = FLAP.height / 2;
  const nodes: VNode[] = [
    h('rect', { x: flap.x, y: flap.y, width: flap.width, height: half, rx: 0.4, fill: FLAP_TOP }),
    h('rect', { x: flap.x, y: flap.y + half, width: flap.width, height: half, rx: 0.4, fill: FLAP_BOTTOM }),
  ];
  // A word flap keeps two lines ready, so that a change from one line to two needs no new element.
  const count = flap.kind === 'word' ? 2 : 1;
  const lines = flap.kind === 'word' ? wordLines(value) : [value];
  for (let i = 0; i < count; i++) {
    const textValue = lines[i] ?? '';
    nodes.push(h('text', { ...textAttrs(flap, i, lines.length, textValue), fill: INK }, [textValue], refs ? (element) => (refs.lines[i] = element) : undefined));
  }
  nodes.push(
    // The falling half, shaded while it turns.
    h('rect', { x: flap.x, y: flap.y, width: flap.width, height: half, fill: '#000000', opacity: 0 }, [], refs ? (element) => (refs.shade = element) : undefined),
    h('line', { x1: flap.x, y1: flap.y + half, x2: flap.x + flap.width, y2: flap.y + half, stroke: '#070707', 'stroke-width': 0.3 }),
  );
  if (flap.kind === 'hour') {
    nodes.push(h('circle', { cx: flap.x + flap.width + MINUTE_DOT / 2, cy: flap.y + FLAP.height * 0.78, r: 0.55, fill: INK, opacity: value ? 1 : 0 }, [], refs ? (element) => (refs.dot = element) : undefined));
  }
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
  const rows = rowsOf(options, variant);
  const l = layout(variant, rows);
  const { flaps, lamps } = parts(l, variant, rows);
  const nodes: VNode[] = [...board(variant, l)];
  flaps.forEach((flap, i) => {
    const flapRefs = refs ? (refs.flaps[i] = { lines: [] }) : undefined;
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

function root(variant: Variant, frame: SolariFrame, options: SolariOptions, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  const l = layout(variant, rowsOf(options, variant));
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${l.width} ${l.height}`, 'font-family': FONT, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(variant, frame)], ref: titleRef }, ...children],
  };
}

export function renderToString(variant: Variant, frame: SolariFrame, options: SolariOptions): string {
  const svg = root(variant, frame, options, scene(variant, frame, options));
  const l = layout(variant, rowsOf(options, variant));
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * l.height) / l.width) * 100) / 100;
  return toDocument(svg, 'destinoteca · panel de paletas de Solari · https://oierlauzi.github.io/destinoteca/');
}

// --- Live: the flaps fall one by one until each shows what it should ---------------------------

interface FlapState {
  flap: Flap;
  refs: FlapRefs;
  /** Where in its sequence it is, and what it shows. */
  position: number;
  shown: string;
  target: string;
  steps: number;
  nextAt: number;
  shadeOffAt: number;
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
  let lampRefs: SVGElement[] = [];
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let now = 0;

  const show = (state: FlapState, value: string): void => {
    state.shown = value;
    const lines = state.flap.kind === 'word' ? wordLines(value) : [value];
    state.refs.lines.forEach((line, i) => {
      const text = lines[i] ?? '';
      const attrs = textAttrs(state.flap, i, lines.length, text);
      for (const [name, attr] of Object.entries(attrs)) {
        if (attr === undefined) line.removeAttribute(name);
        else line.setAttribute(name, String(attr));
      }
      line.textContent = text;
    });
    state.refs.dot?.setAttribute('opacity', value ? '1' : '0');
  };

  const build = (): void => {
    const refs = { flaps: [] as FlapRefs[], lamps: [] as SVGElement[] };
    const rows = rowsOf(options, variant);
    const { flaps } = parts(layout(variant, rows), variant, rows);
    element = toDom(root(variant, frame, options, scene(variant, frame, options, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
    lampRefs = refs.lamps;
    states = flaps.map((flap, i) => {
      const value = flapValue(flap, frame.rows[flap.row]);
      const position = Math.max(0, flap.seq.indexOf(value));
      return { flap, refs: refs.flaps[i]!, position, shown: value, target: value, steps: 0, nextAt: 0, shadeOffAt: 0 };
    });
  };

  const stepMs = (): number => 1000 / Math.max(1, options.speed);

  const unsubscribe = env.ticker.subscribe((time) => {
    now = time;
    for (const state of states) {
      if (state.shadeOffAt && now >= state.shadeOffAt) {
        state.refs.shade?.setAttribute('opacity', '0');
        state.shadeOffAt = 0;
      }
      if (state.steps <= 0 || now < state.nextAt) continue;
      state.steps--;
      state.position = (state.position + 1) % state.flap.seq.length;
      show(state, state.steps === 0 ? state.target : (state.flap.seq[state.position] ?? ''));
      state.refs.shade?.setAttribute('opacity', '0.45');
      state.shadeOffAt = now + stepMs() / 2;
      state.nextAt = now + stepMs();
    }
  });
  build();

  return {
    setFrame(next: SolariFrame): void {
      frame = next;
      if (title) title.textContent = describe(variant, next);
      for (const state of states) {
        const target = flapValue(state.flap, next.rows[state.flap.row]);
        if (target === state.target && (state.steps > 0 || target === state.shown)) continue;
        state.target = target;
        if (!options.animate) {
          state.steps = 0;
          state.position = Math.max(0, state.flap.seq.indexOf(target));
          show(state, target);
          continue;
        }
        state.steps = stepsBetween(state.flap.seq, state.position, target);
        if (state.steps === 0) show(state, target);
        state.nextAt = now;
      }
      lampRefs.forEach((lamp, i) => {
        const rows = rowsOf(options, variant);
        const { lamps } = parts(layout(variant, rows), variant, rows);
        const info = lamps[i];
        if (info) lamp.setAttribute('fill', info.which < lampsLit(next.rows[info.row]) ? LAMP_ON : LAMP_OFF);
      });
    },
    setOptions(next: SolariOptions): void {
      const reshape = rowsOf(next, variant) !== rowsOf(options, variant);
      options = next;
      if (reshape) build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
