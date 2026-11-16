import {
  telenormaCp437,
  DotMatrix,
  encodeCells,
  garble,
  glyphState,
  h,
  hashText,
  marqueeWindow,
  MarqueeRun,
  overlay,
  roundLed,
  scrolls,
  textColumns,
  toCells,
  toDocument,
  toDom,
  withStuckDots,
  type DotState,
  type OctagonFlapLook,
  type RoundLedLook,
  type VNode,
} from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { CELL_COLS, CELL_ROWS, FLIP_DOT_UNLIT, flipDotFont, flipDotLines, flipDotSweep } from '../page-iberica-electromagneticos/flip-dot-lines';
import { CELLS, type AndenFrame, type AndenOptions } from './def';

// Everything is in millimetres of the reference drawing (renfe-flipdot-re,
// web-replica/reference.svg), whose origin is not the sign's corner.
const ORIGIN = { x: 4.3614364, y: 4.8301482 };
export const WIDTH = 190.87605;
export const HEIGHT = 81.160835;

const flipDots = flipDotLines({ lines: 1, cells: CELLS, x: 24.658236, y: 39.877911 });

// The LED row under the flip-dots. The original was not recovered with the
// salvaged unit; its size comes from photographs.
const LED = { x: 20.358263, y: 60.55167, width: 158.50243, height: 11.181376, rows: 7 };
const LED_PITCH = (LED.height * 12) / 95;
export const LED_COLS = Math.floor((LED.width - LED_PITCH) / LED_PITCH);
/** Blank columns between the end of a scrolling text and its restart. */
const LED_GAP = 24;
const LED_UNLIT = '#40101a';
const HEART = 0x03;

const leds = new DotMatrix<RoundLedLook>({
  modules: [{ x: LED.x + (LED.width - LED_COLS * LED_PITCH) / 2, y: LED.y + (LED.height - LED.rows * LED_PITCH) / 2 }],
  cols: LED_COLS,
  rows: LED.rows,
  pitch: LED_PITCH,
  skin: roundLed(),
  backing: () => [
    h('rect', { x: LED.x, y: LED.y, width: LED.width, height: LED.height, fill: '#2c0a11', stroke: '#000000', 'stroke-width': 0.2 }),
  ],
});

const LEGEND = '#f4f2e9';
const FONT = 'Helvetica Neue, Helvetica, Arial, sans-serif';

/** The 16 characters of the flip-dot line: the text, with the minutes written over its end. */
export function lineCells(frame: AndenFrame, options: AndenOptions): string[] {
  const cells = toCells(frame.text, CELLS);
  return options.showMinutes ? overlay(cells, frame.minutes, 'right') : cells;
}

function flipState(frame: AndenFrame, options: AndenOptions): DotState {
  const cells = lineCells(frame, options);
  // A heart in the middle of a destination was a common sight on these signs:
  // 0x03 is both the heart of the code page and the byte that ends a message.
  const codes = garble(encodeCells(cells, telenormaCp437), {
    fraction: options.hearts / 100,
    seed: options.deadSeed,
    salt: hashText(cells.join('')),
    replacement: HEART,
  });
  return withStuckDots(glyphState(codes, flipDotFont), CELL_COLS, CELL_ROWS, {
    on: options.deadOn / 100,
    off: options.deadOff / 100,
    seed: options.deadSeed,
  });
}

const flipLook = (options: AndenOptions): OctagonFlapLook => ({
  lit: options.dotColor,
  unlit: options.showOffDots ? FLIP_DOT_UNLIT : null,
});

const ledLook = (options: AndenOptions): RoundLedLook => ({ lit: options.ledColor, unlit: LED_UNLIT });

const ledStrip = (frame: AndenFrame): number[] => textColumns(frame.led, flipDotFont, telenormaCp437, 1);

const ledState = (strip: number[], offset: number): DotState => [marqueeWindow(strip, LED_COLS, offset, LED_GAP)];

/** What a screen reader says instead of 1,300 dots. */
export function describe(frame: AndenFrame, options: AndenOptions): string {
  const parts = [`Vía ${frame.platform}`.trim()];
  const line = lineCells(frame, { ...options, showMinutes: false }).join('').trim();
  if (line) parts.push(line);
  if (options.showMinutes && frame.minutes) parts.push(`${frame.minutes} min.`);
  if (frame.led) parts.push(frame.led);
  return parts.join(' · ');
}

interface Slots {
  title?: SVGElement;
  minLabel?: SVGElement;
  platform?: SVGElement;
}

/** The fixed part of the sign: frame, glass, and the legends printed on it. */
function housing(frame: AndenFrame, options: AndenOptions, dots: VNode[], slots: Slots = {}): VNode {
  return h(
    'svg',
    { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, 'font-family': FONT, role: 'img' },
    [
      h('title', {}, [describe(frame, options)], (element) => (slots.title = element)),
      h('g', { transform: `translate(${-ORIGIN.x},${-ORIGIN.y})` }, [
        h('rect', { x: ORIGIN.x, y: ORIGIN.y, width: WIDTH, height: HEIGHT, rx: 10, fill: '#121212' }),
        h('rect', { x: 12.080421, y: 11.557226, width: 176.00145, height: 67.75975, rx: 5, fill: '#303030', stroke: '#000000', 'stroke-width': 3 }),
        // "min." is printed on the glass, in the colour of the dots it sits beside.
        h(
          'text',
          { x: 215.77232, y: 38.647018, fill: options.dotColor, 'font-size': 5.65488, transform: 'scale(0.81099995,1.2330457)' },
          ['min.'],
          (element) => (slots.minLabel = element),
        ),
        h('text', { x: 58.99646, y: 33.011734, fill: LEGEND, 'font-size': 23.2833, 'font-weight': 700, 'letter-spacing': 1 }, ['Vía']),
        h('text', { fill: LEGEND, 'font-size': 7.05556, 'font-weight': 700 }, [
          h('tspan', { x: 146.3284, y: 23.902781 }, ['Próxima']),
          h('tspan', { x: 146.3284, y: 31.663897, 'letter-spacing': 0.15875 }, ['Llegada']),
        ]),
        h('line', { x1: 12.080421, y1: 35.448382, x2: 188.08187, y2: 35.448382, stroke: '#000000', 'stroke-width': 0.2 }),
        h('line', { x1: 12.080421, y1: 56.89837, x2: 188.08187, y2: 56.89837, stroke: '#000000', 'stroke-width': 0.2 }),
        // Cercanías roundel.
        h('g', { transform: 'matrix(0.05479172,0,0,0.05479172,21.284002,16.007592)' }, [
          h('circle', { cx: 150, cy: 150, r: 150, fill: '#ef2c30' }),
          h('path', {
            d: 'm 150,100 c 27.429,0 50,22.571 50,50 0,27.429 -22.571,50 -50,50 -27.429,0 -50,-22.571 -50,-50 H 50 c 0,54.858 45.142,100 100,100 54.858,0 100,-45.142 100,-100 C 250,95.142 204.858,50 150,50 Z',
            fill: '#ffffff',
          }),
        ]),
        // The platform number: a vinyl stuck on beside "Vía".
        h(
          'text',
          { x: 106.98637, y: 33.244568, fill: LEGEND, 'font-size': 23.2833, 'font-weight': 700, 'letter-spacing': 1 },
          [frame.platform],
          (element) => (slots.platform = element),
        ),
        ...dots,
      ]),
    ],
  );
}

/** One frame as a standalone SVG file, with the LED text at its start and nothing moving. */
export function renderToString(frame: AndenFrame, options: AndenOptions): string {
  const root = housing(frame, options, [
    leds.render(ledState(ledStrip(frame), 0), ledLook(options)),
    flipDots.render(flipState(frame, options), flipLook(options)),
  ]);
  root.attrs.width = 1200;
  root.attrs.height = Math.round((1200 * HEIGHT) / WIDTH * 100) / 100;
  return toDocument(root, 'destinoteca · teleindicador de andén electromagnético de PAGE Ibérica · https://oierlauzi.github.io/destinoteca/');
}

export interface MountedAnden {
  setFrame(frame: AndenFrame): void;
  setOptions(options: AndenOptions): void;
  destroy(): void;
}

export function mount(host: Element, initial: AndenOptions, env: { ticker: Ticker }): MountedAnden {
  const doc = host.ownerDocument;
  let frame: AndenFrame = { text: '', minutes: '', platform: '', led: '' };
  let options = initial;
  let flipAppearance = flipLook(options);
  let ledAppearance = ledLook(options);
  let strip = ledStrip(frame);
  let shownOffset = -1;
  let now = 0;
  const run = new MarqueeRun();
  const sweep = flipDotSweep(1, CELLS);

  const flip = flipDots.mount(doc, sweep.at(0), flipAppearance);
  const led = leds.mount(doc, ledState(strip, 0), ledAppearance);
  const slots: Slots = {};
  // The legends are built from the same tree as the export; the two dot
  // matrices are live and go in after them, LED row first.
  const root = toDom(housing(frame, options, [], slots), doc);
  root.querySelector('g')?.append(led.element, flip.element);
  root.setAttribute('width', '100%');
  root.style.display = 'block';
  host.replaceChildren(root);

  const drawLed = (force: boolean): void => {
    const moving = options.ledScroll && scrolls(strip, LED_COLS);
    // A new announcement is read from its beginning; a redraw of the same one is not.
    const offset = moving ? run.offset(now, frame.led, options.ledSpeed) : 0;
    if (!force && offset === shownOffset) return;
    shownOffset = offset;
    led.update(ledState(strip, offset), ledAppearance);
  };

  const draw = (): void => {
    // New content is swept in; without animation it simply appears.
    const target = flipState(frame, options);
    if (options.animate) sweep.retarget(target);
    else sweep.jump(target);
    flip.update(sweep.at(now), flipAppearance);
    if (slots.platform) slots.platform.textContent = frame.platform;
    slots.minLabel?.setAttribute('fill', options.dotColor);
    if (slots.title) slots.title.textContent = describe(frame, options);
    drawLed(true);
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    now = time;
    if (!sweep.settled) flip.update(sweep.at(now), flipAppearance);
    drawLed(false);
  });
  draw();

  return {
    setFrame(next: AndenFrame): void {
      if (next.led !== frame.led) strip = ledStrip(next);
      frame = next;
      draw();
    },
    setOptions(next: AndenOptions): void {
      // Looks are compared by identity further down, so only replace them when they change.
      if (next.dotColor !== options.dotColor || next.showOffDots !== options.showOffDots) flipAppearance = flipLook(next);
      if (next.ledColor !== options.ledColor) ledAppearance = ledLook(next);
      options = next;
      draw();
    },
    destroy(): void {
      unsubscribe();
      root.remove();
    },
  };
}
