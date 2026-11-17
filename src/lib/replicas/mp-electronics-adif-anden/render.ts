import { h, marqueeWindow, MarqueeRun, mpElectronicsAdif as font, scrolls, textStrip, toDocument, toDom, type VNode } from '../../hardware';
import { RealClock } from '../../model';
import type { Ticker } from '../../player/ticker';
import type { FestinaOptions } from '../festina-adif/def';
import { angles, clockScene, daySeconds, type HandRefs } from '../festina-adif/render';
import { columnLegend, type Regional } from '../mp-electronics-adif/labels';
import { mpLogo } from '../mp-electronics-adif/mp-logo';
import {
  BEZEL,
  BEZEL_EDGE,
  BODY,
  BODY_EDGE,
  cellText,
  FONT_FAMILY,
  GREEN,
  LEGEND_STRONG,
  LEGEND_ES,
  ledPattern,
  PANEL,
  panelBits,
  runsPath,
  UNLIT,
  withFaults,
} from '../mp-electronics-adif/render';
import type { AndenFrame, AndenOptions } from './def';
import { layout, PANEL_ROWS, ROW_TOPS, ROWS_WIDTH, TIME_COLS, TIME_TRAIN_GAP, TRAIN_COLS, type Kind, type Layout } from './geometry';

/** Blank columns between the end of the running line and its start again. */
const LINE_GAP = 32;
const CLOCK_SIZE = 240;
/** What a clock shows with no time to show: the catalogues' 10:10. */
const RESTING = 10 * 3600 + 10 * 60 + 32;

interface Panel {
  key: 'time' | 'train' | 'destination' | 'line';
  x: number;
  y: number;
  cols: number;
}

function panels(l: Layout): Panel[] {
  const { x, y } = l.rows;
  return [
    { key: 'time', x, y: y + ROW_TOPS.time, cols: TIME_COLS },
    { key: 'train', x: x + TIME_COLS + TIME_TRAIN_GAP, y: y + ROW_TOPS.time, cols: TRAIN_COLS },
    { key: 'destination', x, y: y + ROW_TOPS.destination, cols: ROWS_WIDTH },
    { key: 'line', x, y: y + ROW_TOPS.line, cols: ROWS_WIDTH },
  ];
}

const lineStrip = (text: string): number[] => textStrip(font.fold(text), font);

/** The lit dots of every panel. `offset` is how far the running line has gone. */
function litPaths(frame: AndenFrame, options: AndenOptions, l: Layout, offset: number): string[] {
  const strip = lineStrip(frame.line);
  return panels(l).map((panel, i) => {
    let bits: number[];
    if (panel.key === 'line') {
      // A line that fits stands at the left, as the rows do; a longer one runs.
      const moving = options.lineScroll && scrolls(strip, panel.cols);
      bits = moving ? marqueeWindow(strip, panel.cols, offset, LINE_GAP) : Array.from({ length: panel.cols }, (_, c) => strip[c] ?? 0);
    } else {
      const text = panel.key === 'train' ? cellText('train', frame.train) : font.fold(frame[panel.key]);
      bits = panelBits(text, panel.cols);
    }
    return runsPath(withFaults(bits, i, options), panel.x, panel.y);
  });
}

/** "Hora | TIME", with the regional language between when there is one. */
function legend(x: number, y: number, column: 'time' | 'train' | 'place' | 'platform', regional: Regional): VNode {
  const words = columnLegend(column, 'departures', 'REMARKS');
  const parts: VNode[] = [h('tspan', { 'font-size': 4.6, 'font-weight': 700, fill: LEGEND_STRONG }, [words.es])];
  if (regional) {
    parts.push(h('tspan', { 'font-size': 4.6, fill: LEGEND_ES, dx: 1 }, ['|']), h('tspan', { 'font-size': 4.6, 'font-weight': 700, fill: LEGEND_STRONG, dx: 1 }, [words.regional[regional]]));
  }
  parts.push(h('tspan', { 'font-size': 4.6, fill: LEGEND_ES, dx: 1 }, ['|']), h('tspan', { 'font-size': 2.9, 'font-weight': 700, fill: LEGEND_ES, dx: 1, 'letter-spacing': 0.15 }, [words.en]));
  return h('text', { x, y }, parts);
}

function clockOptions(options: AndenOptions, kind: Kind): FestinaOptions {
  return { case: kind === 'vertical' ? 'dark' : 'chrome', inlays: kind === 'clock' && options.dial !== 'mp', secondHand: 'dark', motion: 'step', dial: options.dial };
}

interface Ids {
  unlit: string;
  lit: string;
  line: string;
  clip: (i: number) => string;
}

const idsFor = (prefix: string): Ids => ({ unlit: `${prefix}-u`, lit: `${prefix}-l`, line: `${prefix}-r`, clip: (i) => `${prefix}-c${i}` });

interface Refs {
  clips: SVGElement[];
  patterns: SVGElement[];
  hands: HandRefs;
  platform?: SVGElement;
}

function scene(kind: Kind, frame: AndenFrame, options: AndenOptions, seconds: number, ids: Ids, paths: string[], refs?: Refs): VNode[] {
  const l = layout(kind, options.side);
  const all = panels(l);
  const defs = h('defs', {}, [
    ledPattern(ids.unlit, UNLIT, false),
    ledPattern(ids.lit, options.color, true, refs ? (element) => (refs.patterns[0] = element) : undefined),
    ledPattern(ids.line, options.lineColor, true, refs ? (element) => (refs.patterns[1] = element) : undefined),
    ...all.map((_, i) => h('clipPath', { id: ids.clip(i) }, [h('path', { d: paths[i] ?? '' }, [], refs ? (element) => (refs.clips[i] = element) : undefined)])),
  ]);
  const { x, y } = l.rows;
  const nodes: VNode[] = [
    defs,
    h('rect', { x: 0, y: 0, width: l.width, height: l.height, rx: 2, fill: BODY, stroke: BODY_EDGE, 'stroke-width': 0.6 }),
    h('rect', { ...l.stripe, fill: GREEN }),
    legend(x + 0.5, y + ROW_TOPS.legend1, 'time', options.regional),
    legend(x + TIME_COLS + TIME_TRAIN_GAP + 0.5, y + ROW_TOPS.legend1, 'train', options.regional),
    legend(x + 0.5, y + ROW_TOPS.legend2, 'place', options.regional),
  ];
  // The platform: "Vía" over "PLATFORM" beside the number, or on one line above it.
  const p = l.platform;
  const via = columnLegend('platform', 'departures', 'REMARKS');
  if (p.stacked) {
    nodes.push(
      h('text', { x: p.x, y: p.legendY, 'text-anchor': 'middle', 'font-size': 5, 'font-weight': 700, fill: LEGEND_STRONG }, [options.regional ? `${via.es} / ${via.regional[options.regional]}` : via.es]),
      h('text', { x: p.x, y: p.legendY + 3.6, 'text-anchor': 'middle', 'font-size': 2.9, 'font-weight': 700, fill: LEGEND_ES, 'letter-spacing': 0.15 }, [via.en]),
    );
  } else {
    nodes.push(legend(p.x - 12, p.legendY, 'platform', options.regional));
  }
  nodes.push(
    h('text', { x: p.x, y: p.numberY, 'text-anchor': p.anchor, 'font-size': p.size, 'font-weight': 500, fill: '#dfe2de' }, [frame.platform], refs ? (element) => (refs.platform = element) : undefined),
    mpLogo(l.logo.cx + 10, l.logo.baseline, 1.3, '#7f8386'),
  );
  if (l.clock) {
    const scale = l.clock.diameter / 236;
    const a = angles(seconds, 'step');
    nodes.push(
      h('g', { transform: `translate(${l.clock.cx - (CLOCK_SIZE / 2) * scale},${l.clock.cy - (CLOCK_SIZE / 2) * scale}) scale(${scale})` }, clockScene(clockOptions(options, kind), a, `${ids.unlit}-k`, refs?.hands)),
    );
  }
  nodes.push(
    ...all.flatMap((panel, i) => [
      h('rect', { x: panel.x - 1.3, y: panel.y - 1.3, width: panel.cols + 2.6, height: PANEL_ROWS + 2.6, rx: 1.4, fill: BEZEL, stroke: BEZEL_EDGE, 'stroke-width': 0.35 }),
      h('rect', { x: panel.x - 0.4, y: panel.y - 0.4, width: panel.cols + 0.8, height: PANEL_ROWS + 0.8, rx: 0.5, fill: PANEL }),
      h('rect', { x: panel.x, y: panel.y, width: panel.cols, height: PANEL_ROWS, fill: `url(#${ids.unlit})` }),
      h('rect', { x: panel.x, y: panel.y, width: panel.cols, height: PANEL_ROWS, fill: `url(#${panel.key === 'line' ? ids.line : ids.lit})`, 'clip-path': `url(#${ids.clip(i)})` }),
    ]),
  );
  return nodes;
}

export function describe(frame: AndenFrame): string {
  return [frame.platform && `Vía ${frame.platform}`, frame.time, frame.train, frame.destination, frame.line].filter(Boolean).join(' · ');
}

const frameSeconds = (frame: AndenFrame): number => (frame.clock === undefined ? RESTING : daySeconds(frame.clock, frame.zone ?? 'Europe/Madrid'));

function root(kind: Kind, frame: AndenFrame, options: AndenOptions, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  const l = layout(kind, options.side);
  return {
    tag: 'svg',
    attrs: { viewBox: `0 0 ${l.width} ${l.height}`, 'font-family': FONT_FAMILY, role: 'img' },
    children: [{ tag: 'title', attrs: {}, children: [describe(frame)], ref: titleRef }, ...children],
  };
}

export function renderToString(kind: Kind, frame: AndenFrame, options: AndenOptions): string {
  const l = layout(kind, options.side);
  const svg = root(kind, frame, options, scene(kind, frame, options, frameSeconds(frame), idsFor(`anden-${kind}-${options.side}`), litPaths(frame, options, l, 0)));
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * l.height) / l.width) * 100) / 100;
  return toDocument(svg, 'destinoteca · teleindicador de andén de MP Electronics para ADIF · https://oierlauzi.github.io/destinoteca/');
}

let instances = 0;
/** Frames of a running clock arrive twice a second; one that stops coming is held. */
const HOLD_AFTER_MS = 1200;

export interface MountedAnden {
  setFrame(frame: AndenFrame): void;
  setOptions(options: AndenOptions): void;
  destroy(): void;
}

export function mount(kind: Kind, host: Element, initial: AndenOptions, env: { ticker: Ticker }): MountedAnden {
  const doc = host.ownerDocument;
  const ids = idsFor(`anden${++instances}`);
  const wallClock = new RealClock();
  let options = initial;
  let frame: AndenFrame = { time: '', train: '', destination: '', line: '', platform: '' };
  let tick = 0;
  let anchor = { seconds: RESTING, at: 0 };
  const run = new MarqueeRun();
  let refs: Refs = { clips: [], patterns: [], hands: {} };
  let shown: string[] = [];
  let shownOffset = -1;
  let shownHands = '';
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;

  // A hand-typed frame carries no time: the clock then keeps the viewer's.
  const seconds = (): number =>
    frame.clock === undefined ? daySeconds(wallClock.now(), 'Europe/Madrid') : anchor.seconds + Math.min(tick - anchor.at, HOLD_AFTER_MS) / 1000;
  const offset = (): number => {
    const strip = lineStrip(frame.line);
    return options.lineScroll && scrolls(strip, ROWS_WIDTH) ? run.offset(tick, frame.line, options.lineSpeed) : 0;
  };

  const build = (): void => {
    refs = { clips: [], patterns: [], hands: {} };
    shownOffset = offset();
    shown = litPaths(frame, options, layout(kind, options.side), shownOffset);
    element = toDom(root(kind, frame, options, scene(kind, frame, options, seconds(), ids, shown, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
    shownHands = '';
  };

  const drawLeds = (force: boolean): void => {
    const now = offset();
    if (!force && now === shownOffset) return;
    shownOffset = now;
    const next = litPaths(frame, options, layout(kind, options.side), now);
    next.forEach((d, i) => {
      if (d !== shown[i]) refs.clips[i]?.setAttribute('d', d);
    });
    shown = next;
  };

  const drawHands = (): void => {
    if (kind === 'plain') return;
    const a = angles(seconds(), 'step');
    const key = `${a.hour.toFixed(2)}/${a.minute.toFixed(2)}/${a.second}`;
    if (key === shownHands) return;
    shownHands = key;
    const rotate = (deg: number) => `rotate(${Math.round(deg * 1000) / 1000} ${CLOCK_SIZE / 2} ${CLOCK_SIZE / 2})`;
    refs.hands.hour?.setAttribute('transform', rotate(a.hour));
    refs.hands.minute?.setAttribute('transform', rotate(a.minute));
    refs.hands.second?.setAttribute('transform', rotate(a.second));
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    tick = time;
    drawLeds(false);
    drawHands();
  });
  build();

  return {
    setFrame(next: AndenFrame): void {
      frame = next;
      if (next.clock !== undefined) anchor = { seconds: frameSeconds(next), at: tick };
      if (title) title.textContent = describe(next);
      if (refs.platform) refs.platform.textContent = next.platform;
      drawLeds(true);
      drawHands();
    },
    setOptions(next: AndenOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
