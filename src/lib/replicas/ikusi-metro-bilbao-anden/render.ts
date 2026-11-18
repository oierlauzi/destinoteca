import { h, toDocument, toDom, type VNode } from '../../hardware';
import { RealClock } from '../../model';
import type { Ticker } from '../../player/ticker';
import { angles, daySeconds } from '../festina-adif/render';
import { railRow } from '../ikusi/modules';
import { navilensPlate } from '../ikusi-metro-bilbao/navilens';
import { boxNodes, cellNodes, fold, newCellRefs, updateCells, windowNodes, type CellRefs } from '../ikusi-metro-bilbao/parts';
import { clockNodes, rotate, type HandRefs } from './clock';
import { composeRow, sideOf, techOf, type BilbaoFrame, type BilbaoOptions } from './def';
import { CHARS, layout, type Layout } from './geometry';

const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
/** What a clock shows with no time to show: the catalogues' 10:10. */
const RESTING = 10 * 3600 + 10 * 60 + 32;

const layoutOf = (options: BilbaoOptions): Layout => layout(sideOf(options), options.navilens === true);

/** Each row as its 19 characters, the same in glasses and in LED. */
export function rowChars(frame: BilbaoFrame): string[][] {
  return frame.rows.map((row) => composeRow(row, fold));
}

export function describe(frame: BilbaoFrame): string {
  const rows = frame.rows.map((row) => [row.destination, row.bracket && `(${row.bracket})`, row.minutes].filter((part) => part.trim()).join(' ')).filter(Boolean);
  return ['Metro Bilbao', ...rows].join(' · ');
}

interface Refs {
  rows: CellRefs[];
  hands: HandRefs;
}

const newRefs = (): Refs => ({ rows: [newCellRefs(), newCellRefs()], hands: {} });

function scene(frame: BilbaoFrame, options: BilbaoOptions, seconds: number, id: string, refs: Refs): VNode[] {
  const l = layoutOf(options);
  const tech = techOf(options);
  const chars = rowChars(frame);
  const nodes: VNode[] = [...boxNodes(l.box, 0.9), ...windowNodes(l.window)];
  l.rows.forEach((row, i) => nodes.push(...railRow(row), ...cellNodes(tech, row.glasses, chars[i] ?? [], options, i * CHARS, refs.rows[i])));
  nodes.push(...clockNodes(l.clock.cx, l.clock.cy, l.clock.r, angles(seconds, 'step'), `${id}-clock`, refs.hands));
  if (l.plate) nodes.push(navilensPlate(l.plate.x, l.plate.y));
  return nodes;
}

function root(frame: BilbaoFrame, options: BilbaoOptions, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  const l = layoutOf(options);
  return h('svg', { viewBox: `0 0 ${l.width} ${l.height}`, 'font-family': FONT, role: 'img' }, [h('title', {}, [describe(frame)], titleRef), ...children]);
}

const frameSeconds = (frame: BilbaoFrame): number => (frame.clock === undefined ? RESTING : daySeconds(frame.clock, frame.zone ?? 'Europe/Madrid'));

export function renderToString(frame: BilbaoFrame, options: BilbaoOptions): string {
  const l = layoutOf(options);
  const svg = root(frame, options, scene(frame, options, frameSeconds(frame), `bilbao-${sideOf(options)}`, newRefs()));
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * l.height) / l.width) * 100) / 100;
  return toDocument(svg, 'destinoteca · teleindicador de andén de Ikusi para Metro Bilbao · https://oierlauzi.github.io/destinoteca/');
}

export interface MountedBilbao {
  setFrame(frame: BilbaoFrame): void;
  setOptions(options: BilbaoOptions): void;
  destroy(): void;
}

let instances = 0;
/** Frames of a running clock arrive twice a second; one that stops coming is held. */
const HOLD_AFTER_MS = 1200;

/** The characters change at once, when the frame does; the clock's hands run on the shared ticker. */
export function mount(host: Element, initial: BilbaoOptions, env: { ticker: Ticker }): MountedBilbao {
  const doc = host.ownerDocument;
  const id = `bilbao${++instances}`;
  const wallClock = new RealClock();
  let options = initial;
  let frame: BilbaoFrame = { rows: [] };
  let tick = 0;
  let anchor = { seconds: RESTING, at: 0 };
  let refs = newRefs();
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let shownHands = '';

  // A hand-typed frame carries no time: the clock then keeps the viewer's.
  const seconds = (): number =>
    frame.clock === undefined ? daySeconds(wallClock.now(), 'Europe/Madrid') : anchor.seconds + Math.min(tick - anchor.at, HOLD_AFTER_MS) / 1000;

  const build = (): void => {
    refs = newRefs();
    element = toDom(root(frame, options, scene(frame, options, seconds(), id, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
    shownHands = '';
  };

  const drawHands = (): void => {
    const a = angles(seconds(), 'step');
    const key = `${a.hour.toFixed(2)}/${a.minute.toFixed(2)}/${a.second}`;
    if (key === shownHands) return;
    shownHands = key;
    const { cx, cy } = layoutOf(options).clock;
    refs.hands.hour?.setAttribute('transform', rotate(a.hour, cx, cy));
    refs.hands.minute?.setAttribute('transform', rotate(a.minute, cx, cy));
    refs.hands.second?.setAttribute('transform', rotate(a.second, cx, cy));
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    tick = time;
    drawHands();
  });
  build();

  return {
    setFrame(next: BilbaoFrame): void {
      frame = next;
      if (next.clock !== undefined) anchor = { seconds: frameSeconds(next), at: tick };
      const tech = techOf(options);
      const chars = rowChars(frame);
      layoutOf(options).rows.forEach((row, i) => updateCells(tech, refs.rows[i]!, row.glasses, chars[i] ?? [], options));
      if (title) title.textContent = describe(next);
      drawHands();
    },
    setOptions(next: BilbaoOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
