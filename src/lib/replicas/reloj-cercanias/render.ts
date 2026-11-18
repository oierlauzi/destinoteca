import { h, num, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { angles, daySeconds, type Angles } from '../clock-hands';
import type { RelojCercaniasFrame, RelojCercaniasOptions } from './def';
import { C, HANDS, NUMERAL, R, RADII, SIZE, SLOT_SHARE } from './geometry';
import { layout } from './numerals';

/** The dark grey of the outer ring, of the five-minute marks and of nothing else. */
const RING = '#353d40';
const RED = '#d2282b';
/** Off-white, darker than the dial. */
const SECOND = '#d6d4cc';
const NUMERALS = '#eeeeea';
/** What a clock shows when nobody says what time it is: the time of the catalogues. */
const RESTING = 10 * 3600 + 10 * 60 + 32;

const r = (k: number): number => k * R;
/** A point at `radius` from the centre, `deg` clockwise from 12. */
const at = (radius: number, deg: number): string => {
  const a = (deg * Math.PI) / 180;
  return `${num(C + radius * Math.sin(a))},${num(C - radius * Math.cos(a))}`;
};
/** A ring sector between two angles, as a closed subpath. */
const sector = (inner: number, outer: number, from: number, to: number): string =>
  `M${at(outer, from)}A${num(outer)},${num(outer)} 0 0 1 ${at(outer, to)}L${at(inner, to)}A${num(inner)},${num(inner)} 0 0 0 ${at(inner, from)}Z`;

// --- Case and dial ------------------------------------------------------------------

function caseAndDial(prefix: string): VNode[] {
  // The bezel is polished and mirrors what is around it: light and dark bands.
  const bezel: [number, string][] = [[0, '#f4f5f6'], [0.16, '#5d646a'], [0.34, '#e6e9eb'], [0.5, '#3f454a'], [0.66, '#d9dde0'], [0.84, '#61686e'], [1, '#eef0f1']];
  // The dial is plain white. It sits back behind the glass and the print
  // shades its edge, so that through the slots it shows well below the white
  // of the bars.
  const dial: [number, string][] = [[0, '#f1f0ec'], [0.64, '#e7e6e1'], [0.74, '#c9c8c3'], [1, '#a3a29d']];
  return [
    h('defs', {}, [
      h('linearGradient', { id: `${prefix}-bezel`, x1: 0, y1: 0, x2: 1, y2: 1 }, bezel.map(([offset, color]) => h('stop', { offset, 'stop-color': color }))),
      h('radialGradient', { id: `${prefix}-dial`, cx: 0.5, cy: 0.5, r: 0.5 }, dial.map(([offset, color]) => h('stop', { offset, 'stop-color': color }))),
      h('filter', { id: `${prefix}-shadow`, x: -0.2, y: -0.2, width: 1.4, height: 1.4 }, [
        h('feDropShadow', { dx: 0.6, dy: 1, stdDeviation: 0.8, 'flood-color': '#000', 'flood-opacity': 0.25 }),
      ]),
    ]),
    h('circle', { cx: C, cy: C, r: r(RADII.bezel), fill: `url(#${prefix}-bezel)` }),
    h('circle', { cx: C, cy: C, r: r(RADII.bezelInner), fill: '#252b2d' }),
    h('circle', { cx: C, cy: C, r: r(RADII.printEdge), fill: RING }),
    h('circle', { cx: C, cy: C, r: R, fill: `url(#${prefix}-dial)` }),
  ];
}

// --- The print on the glass ------------------------------------------------------------

/**
 * Sixty white bars, one between every two minutes, split by transparent
 * slots through which the dial and the tip of the minute hand show. The
 * slot of every fifth minute is grey, but for its inner end.
 */
function glass(): VNode[] {
  const half = (SLOT_SHARE * 6) / 2;
  let bars = '';
  let marks = '';
  for (let minute = 0; minute < 60; minute++) {
    bars += sector(r(RADII.bars), R, minute * 6 + half, (minute + 1) * 6 - half);
    // A hair past the ring's edge, so that no seam shows between them.
    if (minute % 5 === 0) marks += sector(r(RADII.fiveMinute), R + 0.3, minute * 6 - half, minute * 6 + half);
  }
  return [
    h('path', { d: bars, fill: '#fbfbf8' }),
    h('path', { d: marks, fill: RING }),
  ];
}

/**
 * The numerals, centred in the dark ring. From 9 through 12 to 3 their tops
 * point outwards, from 4 to 8 towards the centre, so that none is upside down.
 */
function numerals(): VNode {
  const scale = (r(NUMERAL.height) - r(NUMERAL.stroke)) / 10;
  const nodes: VNode[] = [];
  for (let hour = 1; hour <= 12; hour++) {
    const turn = hour >= 4 && hour <= 8 ? hour * 30 - 180 : ((hour * 30 + 180) % 360) - 180;
    const digits = layout(String(hour)).map(({ d, x }) => h('path', { d, transform: `translate(${num(x)} -5)` }));
    const [x, y] = at(r(RADII.numerals), hour * 30).split(',');
    nodes.push(h('g', { transform: `translate(${x} ${y}) rotate(${turn}) scale(${num(scale)})` }, digits));
  }
  return h('g', { fill: 'none', stroke: NUMERALS, 'stroke-width': num(r(NUMERAL.stroke) / scale), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, nodes);
}

// --- The hands, pointing at 12 ------------------------------------------------------------

/** A flat hand from `tail` behind the centre to `tip`, narrowing evenly. */
function blade(hand: { tail: number; tip: number; tailWidth: number; tipWidth: number }, color: string): VNode {
  const back = C + r(hand.tail);
  const front = C - r(hand.tip);
  const w0 = r(hand.tailWidth) / 2;
  const w1 = r(hand.tipWidth) / 2;
  return h('path', { d: `M${num(C - w0)},${num(back)}L${num(C + w0)},${num(back)}L${num(C + w1)},${num(front)}L${num(C - w1)},${num(front)}Z`, fill: color });
}

export interface HandRefs {
  hour?: SVGElement;
  minute?: SVGElement;
  second?: SVGElement;
}

const rotate = (deg: number): string => `rotate(${num(deg)} ${C} ${C})`;

/** The whole clock in a square of SIZE centred on (C, C). */
export function clockScene(a: Angles, prefix: string, refs?: HandRefs): VNode[] {
  const ref = (key: keyof HandRefs) => (refs ? (element: SVGElement) => (refs[key] = element) : undefined);
  return [
    ...caseAndDial(prefix),
    h('g', { filter: `url(#${prefix}-shadow)` }, [
      h('g', { transform: rotate(a.hour) }, [blade(HANDS.hour, RED)], ref('hour')),
      h('g', { transform: rotate(a.minute) }, [blade(HANDS.minute, RED)], ref('minute')),
      h('g', { transform: rotate(a.second) }, [blade(HANDS.second, SECOND), h('circle', { cx: C, cy: num(C - r(HANDS.second.tip)), r: r(HANDS.nib), fill: RED })], ref('second')),
    ]),
    ...glass(),
    numerals(),
  ];
}

const frameSeconds = (frame: RelojCercaniasFrame): number => (frame.time === undefined ? RESTING : daySeconds(frame.time, frame.zone ?? 'Europe/Madrid'));

export function describe(frame: RelojCercaniasFrame): string {
  const s = Math.floor(frameSeconds(frame));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Reloj de Cercanías: ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}`;
}

function root(frame: RelojCercaniasFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${SIZE} ${SIZE}`, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(frame)], ref: titleRef }, ...children],
  };
}

export function renderToString(frame: RelojCercaniasFrame, options: RelojCercaniasOptions): string {
  const svg = root(frame, clockScene(angles(frameSeconds(frame), options.motion), 'cercanias'));
  svg.attrs.width = 800;
  svg.attrs.height = 800;
  return toDocument(svg, 'destinoteca · reloj de Cercanías · https://oierlauzi.github.io/destinoteca/');
}

let instances = 0;

/** A clock frozen by hand stops once its frames stop coming: frames of a running clock arrive twice a second. */
const HOLD_AFTER_MS = 1200;

export interface MountedRelojCercanias {
  setFrame(frame: RelojCercaniasFrame): void;
  setOptions(options: RelojCercaniasOptions): void;
  destroy(): void;
}

export function mount(host: Element, initial: RelojCercaniasOptions, env: { ticker: Ticker }): MountedRelojCercanias {
  const doc = host.ownerDocument;
  const prefix = `cercanias${++instances}`;
  let options = initial;
  let frame: RelojCercaniasFrame = {};
  let tick = 0;
  // The time of day the last frame gave, and when it arrived on the page's own clock.
  let anchor = { seconds: frameSeconds(frame), at: 0, running: false };
  let refs: HandRefs = {};
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let shown = '';

  const now = (): number => (anchor.running ? anchor.seconds + Math.min(tick - anchor.at, HOLD_AFTER_MS) / 1000 : anchor.seconds);

  const build = (): void => {
    refs = {};
    element = toDom(root(frame, clockScene(angles(now(), options.motion), prefix, refs), (node) => (title = node)), doc);
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
    refs.hour?.setAttribute('transform', rotate(a.hour));
    refs.minute?.setAttribute('transform', rotate(a.minute));
    refs.second?.setAttribute('transform', rotate(a.second));
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    tick = time;
    draw();
  });
  build();

  return {
    setFrame(next: RelojCercaniasFrame): void {
      frame = next;
      anchor = { seconds: frameSeconds(next), at: tick, running: next.time !== undefined };
      if (title) title.textContent = describe(next);
      draw();
    },
    setOptions(next: RelojCercaniasOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
