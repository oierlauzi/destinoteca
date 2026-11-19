import { h, num, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { angles, daySeconds, type Angles } from '../clock-hands';
import type { RelojEuskotrenFrame, RelojEuskotrenOptions } from './def';
import { C, DOT, HANDS, NUMERAL, R, RADII, SIZE, WEDGE, WORDMARK } from './geometry';

/** The blue of everything printed on the dial, as it reads in the photographs. */
const BLUE = '#2f7cb8';
/**
 * The hands are a shade deeper than the print, and they stand above the dial
 * and shade it, so that one crossing a mark still reads as a hand.
 */
const HAND = '#1f6aa3';
/** «Eusko» is in black; only «Tren» is blue. */
const BLACK = '#1b1b1b';
/** The ring around the face, and the shadow it casts on the dial's edge. */
const BEZEL = '#23272a';

const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
/** Helvetica's capitals, as a share of the font size. */
const CAP = 0.718;

/** What a clock shows when nobody says what time it is: the time of the catalogues. */
const RESTING = 10 * 3600 + 10 * 60 + 32;

const r = (k: number): number => k * R;
/** A point at `radius` from the centre, `deg` clockwise from 12. */
const at = (radius: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [C + radius * Math.sin(a), C - radius * Math.cos(a)];
};

// --- Case and dial ------------------------------------------------------------------

function caseAndDial(prefix: string): VNode[] {
  // The dial is white enamel, a little dished, so its edge falls away into
  // the shadow of the ring that holds it.
  const dial: [number, string][] = [[0, '#fbfbf9'], [0.72, '#f3f4f2'], [0.9, '#e4e6e4'], [1, '#c9ccca'] ];
  return [
    h('defs', {}, [
      h('radialGradient', { id: `${prefix}-dial`, cx: 0.5, cy: 0.46, r: 0.54 }, dial.map(([offset, color]) => h('stop', { offset, 'stop-color': color }))),
      h('filter', { id: `${prefix}-shadow`, x: -0.2, y: -0.2, width: 1.4, height: 1.4 }, [
        h('feDropShadow', { dx: 0.5, dy: 0.9, stdDeviation: 0.7, 'flood-color': '#0b2235', 'flood-opacity': 0.3 }),
      ]),
    ]),
    h('circle', { cx: C, cy: C, r: r(RADII.bezel), fill: BEZEL }),
    h('circle', { cx: C, cy: C, r: R, fill: `url(#${prefix}-dial)` }),
  ];
}

// --- The print on the dial ------------------------------------------------------------

/** How far back from a point of `angle` degrees the sides reach full `width`. */
const taper = (width: number, angle: number): number => width / 2 / Math.tan((angle / 2 / 180) * Math.PI);

/**
 * The minutes: a round dot at each one, and at every fifth a bar in its
 * place, cut off square at the outer end, its sides running straight and
 * then closing to a point towards the centre.
 */
function minutes(): VNode[] {
  let dots = '';
  let wedges = '';
  for (let minute = 0; minute < 60; minute++) {
    const deg = minute * 6;
    if (minute % 5 === 0) {
      const half = r(WEDGE.width) / 2;
      const outer = r(RADII.wedgeOuter);
      const inner = r(RADII.wedgeInner);
      const waist = inner + taper(r(WEDGE.width), WEDGE.tipAngle);
      // Across the bar, square to the radius.
      const a = ((deg + 90) * Math.PI) / 180;
      const [dx, dy] = [half * Math.sin(a), -half * Math.cos(a)];
      const [ox, oy] = at(outer, deg);
      const [wx, wy] = at(waist, deg);
      const [ix, iy] = at(inner, deg);
      wedges +=
        `M${num(ox - dx)},${num(oy - dy)}L${num(ox + dx)},${num(oy + dy)}` +
        `L${num(wx + dx)},${num(wy + dy)}L${num(ix)},${num(iy)}L${num(wx - dx)},${num(wy - dy)}Z`;
    } else {
      const [x, y] = at(r(RADII.dots), deg);
      const d = r(DOT) / 2;
      dots += `M${num(x - d)},${num(y)}a${num(d)},${num(d)} 0 1 0 ${num(2 * d)},0a${num(d)},${num(d)} 0 1 0 ${num(-2 * d)},0Z`;
    }
  }
  return [h('path', { d: dots, fill: BLUE }), h('path', { d: wedges, fill: BLUE })];
}

/**
 * The numerals 12, 3, 6 and 9, upright, out near the minute marks. Each is
 * set to the width it has on the dial, so that it comes out the same
 * wherever the page is drawn.
 */
function numerals(): VNode {
  const cap = r(NUMERAL.height);
  const nodes = [12, 3, 6, 9].map((hour) => {
    const [x, y] = at(r(RADII.numerals), hour * 30);
    const text = String(hour);
    return h(
      'text',
      {
        x: num(x), y: num(y + cap / 2), 'font-size': num(cap / CAP), fill: BLUE, 'text-anchor': 'middle',
        textLength: num(r(NUMERAL.width) * text.length), lengthAdjust: 'spacingAndGlyphs',
      },
      [text],
    );
  });
  return h('g', { 'font-family': FONT }, nodes);
}

/**
 * EuskoTren's wordmark, as it is printed over the hands' pivot: «Eusko» in
 * black and «Tren» in blue, in the bold oblique of the company's artwork.
 * Each word is set to the width it has there, so that it reads the same
 * wherever the page is drawn.
 */
function wordmark(): VNode {
  const width = r(WORDMARK.width);
  const left = C - width / 2;
  const baseline = C - r(RADII.wordmark) + r(WORDMARK.height) / 2;
  const common = { y: num(baseline), 'font-size': num(r(WORDMARK.height) / CAP), 'font-weight': 700, 'font-style': 'italic', lengthAdjust: 'spacingAndGlyphs' };
  return h('g', { 'font-family': FONT }, [
    h('text', { ...common, x: num(left), textLength: num(width * WORDMARK.black), fill: BLACK }, ['Eusko']),
    h('text', { ...common, x: num(left + width * WORDMARK.blueAt), textLength: num(width * (1 - WORDMARK.blueAt)), fill: BLUE }, ['Tren']),
  ]);
}

// --- The hands, pointing at 12 ------------------------------------------------------------

/**
 * A flat bar from `tail` behind the pivot to `tip`, cut off square at the
 * back, drawing in very slightly along its length and closing in front to a
 * point.
 */
function blade(hand: { tail: number; tip: number; width: number }): VNode {
  const back = C + r(hand.tail);
  const front = C - r(hand.tip);
  const w = r(hand.width) / 2;
  const nose = w * HANDS.taperTo;
  const shoulder = front + taper(2 * nose, HANDS.tipAngle);
  return h('path', {
    d:
      `M${num(C - w)},${num(back)}L${num(C + w)},${num(back)}L${num(C + nose)},${num(shoulder)}` +
      `L${num(C)},${num(front)}L${num(C - nose)},${num(shoulder)}Z`,
    fill: HAND,
  });
}

export interface HandRefs {
  hour?: SVGElement;
  minute?: SVGElement;
}

const rotate = (deg: number): string => `rotate(${num(deg)} ${C} ${C})`;

/** The whole clock in a square of SIZE centred on (C, C). */
export function clockScene(a: Angles, prefix: string, logo: boolean, refs?: HandRefs): VNode[] {
  const ref = (key: keyof HandRefs) => (refs ? (element: SVGElement) => (refs[key] = element) : undefined);
  return [
    ...caseAndDial(prefix),
    ...minutes(),
    numerals(),
    ...(logo ? [wordmark()] : []),
    h('g', { filter: `url(#${prefix}-shadow)` }, [
      h('g', { transform: rotate(a.hour) }, [blade(HANDS.hour)], ref('hour')),
      h('g', { transform: rotate(a.minute) }, [blade(HANDS.minute)], ref('minute')),
    ]),
    // The pivot the hands turn on, a small brass screw.
    h('circle', { cx: C, cy: C, r: num(r(0.012)), fill: '#8a7a4a' }),
  ];
}

const frameSeconds = (frame: RelojEuskotrenFrame): number => (frame.time === undefined ? RESTING : daySeconds(frame.time, frame.zone ?? 'Europe/Madrid'));

export function describe(frame: RelojEuskotrenFrame): string {
  const s = Math.floor(frameSeconds(frame));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Reloj de Euskotren: ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}`;
}

function root(frame: RelojEuskotrenFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${SIZE} ${SIZE}`, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(frame)], ref: titleRef }, ...children],
  };
}

export function renderToString(frame: RelojEuskotrenFrame, options: RelojEuskotrenOptions): string {
  const svg = root(frame, clockScene(angles(frameSeconds(frame), options.motion), 'euskotren', options.logo));
  svg.attrs.width = 800;
  svg.attrs.height = 800;
  return toDocument(svg, 'destinoteca · reloj de Euskotren · https://oierlauzi.github.io/destinoteca/');
}

let instances = 0;

/** A clock frozen by hand stops once its frames stop coming: frames of a running clock arrive twice a second. */
const HOLD_AFTER_MS = 1200;

export interface MountedRelojEuskotren {
  setFrame(frame: RelojEuskotrenFrame): void;
  setOptions(options: RelojEuskotrenOptions): void;
  destroy(): void;
}

export function mount(host: Element, initial: RelojEuskotrenOptions, env: { ticker: Ticker }): MountedRelojEuskotren {
  const doc = host.ownerDocument;
  const prefix = `euskotren${++instances}`;
  let options = initial;
  let frame: RelojEuskotrenFrame = {};
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
    element = toDom(root(frame, clockScene(angles(now(), options.motion), prefix, options.logo, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
    shown = '';
  };

  const draw = (): void => {
    const a = angles(now(), options.motion);
    const key = `${a.hour.toFixed(2)}/${a.minute.toFixed(2)}`;
    if (key === shown) return;
    shown = key;
    refs.hour?.setAttribute('transform', rotate(a.hour));
    refs.minute?.setAttribute('transform', rotate(a.minute));
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    tick = time;
    draw();
  });
  build();

  return {
    setFrame(next: RelojEuskotrenFrame): void {
      frame = next;
      anchor = { seconds: frameSeconds(next), at: tick, running: next.time !== undefined };
      if (title) title.textContent = describe(next);
      draw();
    },
    setOptions(next: RelojEuskotrenOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
