import { h, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import type { FestinaFrame, FestinaOptions } from './def';
import { mpMark, mpWord } from '../mp-electronics-adif/mp-logo';
import { festinaMark, festinaWord } from './festina-logo';
import { angles, daySeconds, type Angles } from '../clock-hands';
import { C, R, SIZE } from './geometry';
import { GLYPHS, PLACES } from './numerals';

const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';
/** The print of the dial: a very dark blue. */
const INK = '#1b1d33';
const DIAL = '#fbfcf9';
const SECOND: Record<FestinaOptions['secondHand'], string> = { blue: '#2a34a8', dark: INK, none: INK };
/** What a clock shows when nobody says what time it is: the time of the catalogues. */
const RESTING = { hours: 10, minutes: 10, seconds: 32 };

const r = (k: number): number => k * R;
/** The outer end of the minute bars. */
const BARS = 0.97;
const fmt = (n: number): string => String(Math.round(n * 1000) / 1000);

// --- The case ---------------------------------------------------------------------

function polished(id: string, stops: [number, string][]): VNode {
  return h('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, stops.map(([offset, color]) => h('stop', { offset, 'stop-color': color })));
}

function caseNodes(options: FestinaOptions, ids: { ring: string; edge: string }): VNode[] {
  if (options.case === 'square') {
    return [
      h('rect', { x: 2, y: 2, width: SIZE - 4, height: SIZE - 4, rx: 3, fill: '#1e1f23' }),
      h('rect', { x: 10, y: 10, width: SIZE - 20, height: SIZE - 20, rx: 1, fill: DIAL }),
    ];
  }
  // The ring of the round clocks is polished metal and mirrors what is around it: light and dark bands.
  const chrome = options.case === 'chrome';
  const ring: [number, string][] = chrome
    ? [[0, '#f7f8f9'], [0.18, '#9da3a8'], [0.36, '#eef0f2'], [0.52, '#7d848a'], [0.7, '#e2e5e8'], [0.86, '#8f959b'], [1, '#f2f3f4']]
    : [[0, '#5a5e64'], [0.3, '#2a2c30'], [0.5, '#4b4f55'], [0.75, '#1f2124'], [1, '#43464b']];
  const edge: [number, string][] = chrome ? [[0, '#6f757b'], [0.5, '#d9dde0'], [1, '#5d6268']] : [[0, '#17181a'], [0.5, '#3d4045'], [1, '#141517']];
  const nodes: VNode[] = [
    h('defs', {}, [polished(ids.ring, ring), polished(ids.edge, edge)]),
    h('circle', { cx: C, cy: C, r: r(1.18), fill: `url(#${ids.ring})` }),
    h('circle', { cx: C, cy: C, r: r(1.07), fill: `url(#${ids.edge})` }),
    h('circle', { cx: C, cy: C, r: r(1.04), fill: DIAL }),
  ];
  // Some round cases carry dark blue pieces on the ring, at the hours, over
  // about a third of it: from 12 to 4, as photographed at Zaragoza-Delicias.
  if (options.inlays) {
    // Each piece is a segment of the ring, across its whole width, about 12 degrees long.
    const inner = r(1.075);
    const outer = r(1.17);
    const half = (6 * Math.PI) / 180;
    const at = (radius: number, angle: number) => `${fmt(C + radius * Math.sin(angle))},${fmt(C - radius * Math.cos(angle))}`;
    for (let hour = 0; hour <= 4; hour++) {
      const mid = (hour * 30 * Math.PI) / 180;
      const d = `M${at(outer, mid - half)}A${fmt(outer)},${fmt(outer)} 0 0 1 ${at(outer, mid + half)}L${at(inner, mid + half)}A${fmt(inner)},${fmt(inner)} 0 0 0 ${at(inner, mid - half)}Z`;
      nodes.push(h('path', { d, fill: '#24318c' }));
    }
  }
  return nodes;
}

// --- The dial ----------------------------------------------------------------------

function dial(brand: FestinaOptions['dial'] = 'festina'): VNode[] {
  const nodes: VNode[] = [];
  // A bar for every minute; the hours' are wider and a little longer, and on MP Electronics' dial, narrower and much longer.
  const mp = brand === 'mp';
  for (let minute = 0; minute < 60; minute++) {
    const hour = minute % 5 === 0;
    const width = hour ? r(mp ? 0.035 : 0.05) : r(0.017);
    const length = hour ? r(mp ? 0.15 : 0.095) : r(0.07);
    nodes.push(h('rect', { x: C - width / 2, y: C - r(BARS), width, height: length, fill: INK, transform: `rotate(${minute * 6} ${C} ${C})` }));
  }
  if (brand === 'mp') {
    nodes.push(mpMark(C, C - r(0.47), r(0.2), INK), mpWord(C, C + r(0.43), r(0.062), INK));
    return nodes;
  }
  // The numerals, traced from a photograph in units where the bars end at 100, each centred on its place.
  const unit = r(BARS) / 100;
  for (const { glyph, x, y } of PLACES) {
    const at = `translate(${fmt(C + x * unit)} ${fmt(C + y * unit)}) scale(${fmt(unit)})`;
    nodes.push(h('path', { d: GLYPHS[glyph]!, transform: at, fill: INK, 'fill-rule': 'evenodd' }));
  }
  nodes.push(festinaMark(C, C - r(0.44), r(0.14), INK), festinaWord(C, C - r(0.28), r(0.5), INK));
  return nodes;
}

// --- The hands, pointing at 12; their tips are drawn in outline ------------------------------------

const pts = (points: [number, number][]): string => 'M' + points.map(([x, y]) => `${fmt(C + r(x))},${fmt(C + r(y))}`).join('L') + 'Z';

function hourHand(): VNode[] {
  return [
    h('path', { d: pts([[-0.044, 0.14], [0.044, 0.14], [0.052, -0.24], [0.02, -0.31], [-0.02, -0.31], [-0.052, -0.24]]), fill: INK }),
    h('path', {
      d: pts([[-0.02, -0.3], [0.02, -0.3], [0.018, -0.42], [0.052, -0.5], [0, -0.6], [-0.052, -0.5], [-0.018, -0.42]]),
      fill: DIAL, stroke: INK, 'stroke-width': r(0.013), 'stroke-linejoin': 'round',
    }),
  ];
}

function minuteHand(): VNode[] {
  return [
    h('path', { d: pts([[-0.036, 0.17], [0.036, 0.17], [0.044, -0.4], [0.018, -0.47], [-0.018, -0.47], [-0.044, -0.4]]), fill: INK }),
    h('path', {
      d: pts([[-0.018, -0.46], [0.018, -0.46], [0.026, -0.8], [0, -0.9], [-0.026, -0.8]]),
      fill: DIAL, stroke: INK, 'stroke-width': r(0.013), 'stroke-linejoin': 'round',
    }),
  ];
}

/** A thin hand with a ring near its tip. */
function secondHand(color: string): VNode[] {
  return [
    h('line', { x1: C, y1: C + r(0.22), x2: C, y2: C - r(0.72), stroke: color, 'stroke-width': r(0.013) }),
    h('circle', { cx: C, cy: C - r(0.765), r: r(0.045), fill: 'none', stroke: color, 'stroke-width': r(0.013) }),
  ];
}

const frameSeconds = (frame: FestinaFrame): number =>
  frame.time === undefined ? RESTING.hours * 3600 + RESTING.minutes * 60 + RESTING.seconds : daySeconds(frame.time, frame.zone ?? 'Europe/Madrid');

export interface HandRefs {
  hour?: SVGElement;
  minute?: SVGElement;
  second?: SVGElement;
}

/** The whole clock in a 240-unit square centred on (120, 120): case, dial, hands. For the replica, and for displays with this clock built in. */
/** MP Electronics' hands: plain bars, the second hand a thin line without a ring. */
const bar = (from: number, to: number, width: number, color = INK): VNode[] => [
  h('path', { d: pts([[-width * 0.6, from], [width * 0.6, from], [width / 2, to], [-width / 2, to]]), fill: color }),
];

export function clockScene(options: FestinaOptions, a: Angles, prefix: string, refs?: HandRefs): VNode[] {
  const rotate = (deg: number) => `rotate(${fmt(deg)} ${C} ${C})`;
  const mp = options.dial === 'mp';
  const nodes: VNode[] = [
    ...caseNodes(options, { ring: `${prefix}-ring`, edge: `${prefix}-edge` }),
    ...dial(options.dial),
    h('g', { transform: rotate(a.hour) }, mp ? bar(0.16, -0.5, 0.07) : hourHand(), refs ? (element) => (refs.hour = element) : undefined),
    h('g', { transform: rotate(a.minute) }, mp ? bar(0.18, -0.86, 0.05) : minuteHand(), refs ? (element) => (refs.minute = element) : undefined),
  ];
  if (options.secondHand !== 'none') {
    const color = SECOND[options.secondHand];
    const hand = mp ? bar(0.24, -0.9, 0.014, color) : secondHand(color);
    nodes.push(h('g', { transform: rotate(a.second) }, hand, refs ? (element) => (refs.second = element) : undefined));
  }
  nodes.push(h('circle', { cx: C, cy: C, r: r(0.055), fill: INK }));
  if (options.secondHand !== 'none') nodes.push(h('circle', { cx: C, cy: C, r: r(0.022), fill: SECOND[options.secondHand] }));
  return nodes;
}

export function describe(frame: FestinaFrame): string {
  const s = Math.floor(frameSeconds(frame));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Reloj Festina de ADIF: ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}`;
}

function root(frame: FestinaFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${SIZE} ${SIZE}`, 'font-family': FONT, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(frame)], ref: titleRef }, ...children],
  };
}

export function renderToString(frame: FestinaFrame, options: FestinaOptions): string {
  const svg = root(frame, clockScene(options, angles(frameSeconds(frame), options.motion), `festina-${options.case}`));
  svg.attrs.width = 800;
  svg.attrs.height = 800;
  return toDocument(svg, 'destinoteca · reloj Festina para ADIF · https://oierlauzi.github.io/destinoteca/');
}

let instances = 0;

/** A clock frozen by hand stops once its frames stop coming: frames of a running clock arrive twice a second. */
const HOLD_AFTER_MS = 1200;

export interface MountedFestina {
  setFrame(frame: FestinaFrame): void;
  setOptions(options: FestinaOptions): void;
  destroy(): void;
}

export function mount(host: Element, initial: FestinaOptions, env: { ticker: Ticker }): MountedFestina {
  const doc = host.ownerDocument;
  const prefix = `festina${++instances}`;
  let options = initial;
  let frame: FestinaFrame = {};
  let tick = 0;
  // The time of day the last frame gave, and when it arrived on the page's own clock.
  let anchor = { seconds: frameSeconds(frame), at: 0, running: false };
  let refs: HandRefs = {};
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let shown = '';

  const now = (): number => {
    if (!anchor.running) return anchor.seconds;
    return anchor.seconds + Math.min(tick - anchor.at, HOLD_AFTER_MS) / 1000;
  };

  const build = (): void => {
    refs = {};
    element = toDom(root(frame, clockScene(options, angles(now(), options.motion), prefix, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
    shown = '';
  };

  const draw = (): void => {
    const a = angles(now(), options.motion);
    const key = `${a.hour.toFixed(2)}/${a.minute.toFixed(2)}/${a.second.toFixed(2)}`;
    if (key === shown) return;
    shown = key;
    refs.hour?.setAttribute('transform', `rotate(${fmt(a.hour)} ${C} ${C})`);
    refs.minute?.setAttribute('transform', `rotate(${fmt(a.minute)} ${C} ${C})`);
    refs.second?.setAttribute('transform', `rotate(${fmt(a.second)} ${C} ${C})`);
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    tick = time;
    draw();
  });
  build();

  return {
    setFrame(next: FestinaFrame): void {
      frame = next;
      anchor = { seconds: frameSeconds(next), at: tick, running: next.time !== undefined };
      if (title) title.textContent = describe(next);
      draw();
    },
    setOptions(next: FestinaOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
