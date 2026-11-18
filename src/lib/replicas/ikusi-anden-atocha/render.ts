import { DotMatrix, MarqueeRun, h, ikusi7x9, lcdModules, roundLed, telenorma5x7, telenormaCp437, textColumns, toCells, toDocument, toDom, updateLcd, type DotState, type LcdLook, type LcdModule, type LcdRefs, type RoundLedLook, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import type { IkusiFrame, IkusiOptions } from './def';
import { ikusiLogo } from '../ikusi/ikusi-logo';
import { IKUSI_GLASSES } from '../ikusi/glass';
import { railRow } from '../ikusi/modules';
import { CELL, DOTS, DOTS_7X9, HEIGHT, LINE, LOGO_HEIGHT, STRIP, TIME, TOP_Y, WIDTH, labelSpan, lineModules, lineRow, logoAt, openings, timeModules, timeRow, type Box } from './geometry';

const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
/** The front sheet. */
const SHEET = '#1e2122';
/** The edge of the box, catching the light. */
const RIM = '#3b4042';
/** The red strip's opening, darker than the others. */
const STRIP_BACK = '#030404';
const PRINT = '#ebeae3';

/**
 * In the photographs the characters are the amber yellow of the airport
 * boards' amber modules, never lime, over a faint, greyish green glow of
 * their own, measured on the photographs; the glasses glow some more than
 * others.
 */
export const lcdLook = (options: IkusiOptions): LcdLook => ({
  ...DOTS_7X9,
  lit: IKUSI_GLASSES.ambar.lit,
  litAged: IKUSI_GLASSES.ambar.litAged,
  blank: '#4a6a4a',
  blankDull: '#26332a',
  uneven: options.uneven / 100,
  delamination: options.delamination / 100,
  seed: options.wearSeed,
});

/** The five characters of the time and the twelve of the line, numbered one after the other. */
export function lines(frame: IkusiFrame): { time: string[]; line: string[] } {
  return { time: toCells(ikusi7x9.fold(frame.time), TIME), line: toCells(ikusi7x9.fold(frame.text), LINE) };
}

export function describe(frame: IkusiFrame): string {
  return [`Vía ${frame.platform}`.trim(), frame.time.trim(), frame.text.trim(), (frame.led ?? '').trim()].filter(Boolean).join(' · ');
}

// --- The LED row --------------------------------------------------------------

/*
 * A red LED matrix seven dots high in the strip under the destination, like
 * the rows of PAGE Ibérica's platform signs, and drawn the same way: round
 * LEDs, their proportions, their colours and their 5 × 7 characters.
 */
const LED_ROWS = 7;
const LED_PITCH = (STRIP.height * 12) / 95;
export const LED_COLS = Math.floor((STRIP.width - LED_PITCH) / LED_PITCH);
const LED_LOOK: RoundLedLook = { lit: '#ff3b2e', unlit: '#40101a' };

const ledMatrix = new DotMatrix<RoundLedLook>({
  modules: [{ x: STRIP.x + (STRIP.width - LED_COLS * LED_PITCH) / 2, y: STRIP.y + (STRIP.height - LED_ROWS * LED_PITCH) / 2 }],
  cols: LED_COLS,
  rows: LED_ROWS,
  pitch: LED_PITCH,
  skin: roundLed(),
  backing: () => [h('rect', { ...STRIP, fill: '#2c0a11', stroke: '#000000', 'stroke-width': 0.2 })],
});

/** A text as columns of the LED row. */
export const ledStrip = (text: string): number[] => textColumns(telenormaCp437.fold(text), telenorma5x7, telenormaCp437, 1);

/**
 * The row `offset` columns into its run. The text comes in from the right,
 * crosses the row and leaves on the left, and then comes in again; at an
 * offset of `LED_COLS` its beginning stands at the left end, as on a still
 * picture or with scrolling turned off.
 */
export function ledWindow(strip: number[], offset: number): DotState {
  const run = LED_COLS + strip.length;
  const at = ((Math.floor(offset) % run) + run) % run;
  return [Array.from({ length: LED_COLS }, (_, c) => strip[at - LED_COLS + c] ?? 0)];
}

interface Slots {
  number?: SVGElement;
  time: LcdRefs;
  line: LcdRefs;
}

const newSlots = (): Slots => ({ time: { glyph: [] }, line: { glyph: [] } });

/** The red strip's opening in the sheet: sunk, with a shadow along its top and the light catching its lower lip. */
function opening(box: Box, fill: string): VNode[] {
  return [
    h('rect', { ...box, rx: 0.5, fill, stroke: '#070808', 'stroke-width': 0.4 }),
    h('rect', { x: box.x + 0.2, y: box.y + 0.2, width: box.width - 0.4, height: 0.6, fill: '#000000', 'fill-opacity': 0.35 }),
    h('rect', { x: box.x + 0.4, y: box.y + box.height, width: box.width - 0.8, height: 0.3, fill: RIM, 'fill-opacity': 0.7 }),
  ];
}

function scene(frame: IkusiFrame, options: IkusiOptions, slots: Slots): VNode[] {
  const side = options.side === 'right' ? 'right' : 'left';
  const look = lcdLook(options);
  const { time, line } = lines(frame);
  const label = labelSpan(side);
  const open = openings(side);
  const logo = logoAt(side);
  // The foot of the characters: where the eleventh row of 7 × 11 dots ends, and the ninth of 7 × 9.
  const baseline = TOP_Y + DOTS.pad + 10 * DOTS.pitch + DOTS.dot;
  return [
    // A deep box with square corners, whose front is one sheet with three openings, one per row.
    h('rect', { x: 0.3, y: 0.3, width: WIDTH - 0.6, height: HEIGHT - 0.6, fill: SHEET, stroke: RIM, 'stroke-width': 0.6 }),
    ...railRow(timeRow(side)),
    ...railRow(lineRow()),
    ...opening(open.strip, STRIP_BACK),
    // «VIA» and the number, printed on the sheet, with the number at the end nearer the pole on either side.
    h('text', { x: label.from, y: baseline, 'font-size': 12.3, 'font-weight': 700, fill: PRINT, textLength: 2.8 * CELL, lengthAdjust: 'spacingAndGlyphs' }, ['VIA']),
    h('text', { x: label.to, y: baseline, 'font-size': 12.3, 'font-weight': 700, fill: PRINT, 'text-anchor': 'end' }, [frame.platform], (element) => (slots.number = element)),
    ...lcdModules(timeModules(side), time, ikusi7x9, look, 0, slots.time),
    ...lcdModules(lineModules(), line, ikusi7x9, look, TIME, slots.line),
    ikusiLogo(logo.x, logo.y, LOGO_HEIGHT, '#c9cbc6'),
  ];
}

function root(frame: IkusiFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return h('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, 'font-family': FONT, role: 'img' }, [h('title', {}, [describe(frame)], titleRef), ...children]);
}

export function renderToString(frame: IkusiFrame, options: IkusiOptions): string {
  const svg = root(frame, [...scene(frame, options, newSlots()), ledMatrix.render(ledWindow(ledStrip(frame.led ?? ''), LED_COLS), LED_LOOK)]);
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * HEIGHT) / WIDTH) * 100) / 100;
  return toDocument(svg, 'destinoteca · teleindicador de andén de cristal líquido de Ikusi · https://oierlauzi.github.io/destinoteca/');
}

export interface MountedIkusi {
  setFrame(frame: IkusiFrame): void;
  setOptions(options: IkusiOptions): void;
  destroy(): void;
}

/**
 * Liquid crystal changes at once, so the characters are only redrawn when the
 * frame changes; the LED row runs on the shared ticker.
 */
export function mount(host: Element, initial: IkusiOptions, env: { ticker: Ticker }): MountedIkusi {
  const doc = host.ownerDocument;
  let options = initial;
  let frame: IkusiFrame = { time: '', text: '', platform: '', led: '' };
  let slots = newSlots();
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let strip = ledStrip(frame.led);
  let now = 0;
  let shown = -1;
  const run = new MarqueeRun();
  let led = ledMatrix.mount(doc, ledWindow(strip, LED_COLS), LED_LOOK);

  const modules = (): { time: LcdModule[]; line: LcdModule[] } => {
    const side = options.side === 'right' ? 'right' : 'left';
    return { time: timeModules(side), line: lineModules() };
  };

  /** Starts with the text's beginning at the left end, as the still picture shows it. */
  const offset = (): number => (options.ledScroll && strip.length > 0 ? LED_COLS + run.offset(now, frame.led ?? '', options.ledSpeed) : LED_COLS);

  const drawLed = (force: boolean): void => {
    const at = offset();
    if (!force && at === shown) return;
    shown = at;
    led.update(ledWindow(strip, at), LED_LOOK);
  };

  const build = (): void => {
    slots = newSlots();
    element = toDom(root(frame, scene(frame, options, slots), (node) => (title = node)), doc);
    led = ledMatrix.mount(doc, ledWindow(strip, offset()), LED_LOOK);
    element.append(led.element);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    now = time;
    drawLed(false);
  });
  build();

  return {
    setFrame(next: IkusiFrame): void {
      if (next.led !== frame.led) strip = ledStrip(next.led ?? '');
      frame = next;
      const look = lcdLook(options);
      const { time, line } = lines(frame);
      const at = modules();
      updateLcd(slots.time, at.time, time, ikusi7x9, look);
      updateLcd(slots.line, at.line, line, ikusi7x9, look);
      if (slots.number) slots.number.textContent = frame.platform;
      if (title) title.textContent = describe(frame);
      drawLed(true);
    },
    setOptions(next: IkusiOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
