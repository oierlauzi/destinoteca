import { h, ikusiLcd, lcdModules, toCells, toDocument, toDom, updateLcd, type LcdLook, type LcdModule, type LcdRefs, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import type { IkusiFrame, IkusiOptions } from './def';
import { ikusiLogo } from './ikusi-logo';
import { CELL, DOTS, GLASS, HEIGHT, INSET, LINE, LOGO_HEIGHT, MODULE, STRIP, TIME, TOP_Y, WIDTH, labelSpan, lineModules, lineRow, logoAt, openings, timeModules, timeRow, type Box, type RowLayout } from './geometry';

const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
/** The front sheet. */
const SHEET = '#1e2122';
/** The edge of the box, catching the light. */
const RIM = '#3b4042';
/** The rail the modules are clipped onto, and its lips. */
const RAIL = '#2a2e33';
const RAIL_LIGHT = '#474c53';
const RAIL_SHADOW = '#0f1113';
/** The modules' dark plastic, and the light along their top edge. */
const PLASTIC = '#1c1f23';
const PLASTIC_LIGHT = '#2e3238';
const GROOVE = '#0c0d0f';
/** The red strip's opening, darker than the others. */
const STRIP_BACK = '#030404';
const PRINT = '#ebeae3';
const RED = '#ff2b1c';

/**
 * In the photographs the characters are yellow over the green glow of their
 * glass, and the glasses glow some more than others.
 */
export const lcdLook = (options: IkusiOptions): LcdLook => ({
  ...DOTS,
  lit: '#f6ec66',
  litAged: '#b5d64c',
  blank: '#3e9558',
  blankDull: '#163723',
  uneven: options.uneven / 100,
  delamination: options.delamination / 100,
  seed: options.wearSeed,
});

/** The five characters of the time and the twelve of the line, numbered one after the other. */
export function lines(frame: IkusiFrame): { time: string[]; line: string[] } {
  return { time: toCells(ikusiLcd.fold(frame.time), TIME), line: toCells(ikusiLcd.fold(frame.text), LINE) };
}

export function describe(frame: IkusiFrame): string {
  return [`Vía ${frame.platform}`.trim(), frame.time.trim(), frame.text.trim()].filter(Boolean).join(' · ');
}

/**
 * The red strip, lit end to end: what it showed is not known, so it is
 * drawn as a glow, with layers of fading red around it instead of a filter.
 */
function strip(x: number): VNode[] {
  const { y, height, width } = STRIP;
  const halo = [1.3, 0.85, 0.45].map((grow, i) =>
    h('rect', { x: x - grow, y: y - grow, width: width + 2 * grow, height: height + 2 * grow, rx: grow, fill: RED, 'fill-opacity': [0.12, 0.2, 0.35][i] }),
  );
  return [
    ...halo,
    h('rect', { x, y, width, height, fill: RED }),
    h('rect', { x: x + 0.8, y: y + height * 0.3, width: width - 1.6, height: height * 0.4, fill: '#ff6a4c', 'fill-opacity': 0.35 }),
  ];
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

/** A row: the rail across its opening, the modules on it, blank ones at the ends, and a recess round each glass. */
function railRow(row: RowLayout): VNode[] {
  const { rail, moduleY } = row;
  const width = CELL - MODULE.seam;
  const nodes: VNode[] = [
    h('rect', { ...rail, fill: RAIL, stroke: '#070808', 'stroke-width': 0.3 }),
    h('rect', { x: rail.x, y: rail.y, width: rail.width, height: 0.25, fill: RAIL_LIGHT }),
    h('rect', { x: rail.x, y: rail.y + rail.height - 0.3, width: rail.width, height: 0.3, fill: RAIL_SHADOW }),
  ];
  for (const module of row.modules) {
    const x = module.x + MODULE.seam / 2;
    nodes.push(
      h('rect', { x, y: moduleY, width, height: MODULE.height, rx: 0.25, fill: PLASTIC }),
      h('rect', { x: x + 0.2, y: moduleY, width: width - 0.4, height: 0.22, fill: PLASTIC_LIGHT }),
    );
    // The grooves along the ledges above and below the glass: a dark line, lit along its lower edge.
    for (const y of [moduleY + INSET.y / 2, moduleY + MODULE.height - INSET.y / 2]) {
      nodes.push(
        h('rect', { x, y: y - 0.16, width, height: 0.32, fill: GROOVE }),
        h('rect', { x, y: y + 0.16, width, height: 0.14, fill: PLASTIC_LIGHT }),
      );
    }
  }
  for (const glass of row.glasses) {
    nodes.push(h('rect', { x: glass.x - 0.2, y: glass.y - 0.2, width: GLASS.width + 0.4, height: GLASS.height + 0.4, fill: '#0b0c0e' }));
  }
  return nodes;
}

function scene(frame: IkusiFrame, options: IkusiOptions, slots: Slots): VNode[] {
  const side = options.side === 'right' ? 'right' : 'left';
  const look = lcdLook(options);
  const { time, line } = lines(frame);
  const label = labelSpan(side);
  const open = openings(side);
  const logo = logoAt(side);
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
    ...lcdModules(timeModules(side), time, ikusiLcd, look, 0, slots.time),
    ...lcdModules(lineModules(), line, ikusiLcd, look, TIME, slots.line),
    ...strip(STRIP.x),
    ikusiLogo(logo.x, logo.y, LOGO_HEIGHT, '#c9cbc6'),
  ];
}

function root(frame: IkusiFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return h('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, 'font-family': FONT, role: 'img' }, [h('title', {}, [describe(frame)], titleRef), ...children]);
}

export function renderToString(frame: IkusiFrame, options: IkusiOptions): string {
  const svg = root(frame, scene(frame, options, newSlots()));
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * HEIGHT) / WIDTH) * 100) / 100;
  return toDocument(svg, 'destinoteca · teleindicador de andén de cristal líquido de Ikusi · https://oierlauzi.github.io/destinoteca/');
}

export interface MountedIkusi {
  setFrame(frame: IkusiFrame): void;
  setOptions(options: IkusiOptions): void;
  destroy(): void;
}

/** Liquid crystal changes at once: nothing moves between frames, so the sign is only redrawn when they change. */
export function mount(host: Element, initial: IkusiOptions, _env: { ticker: Ticker }): MountedIkusi {
  const doc = host.ownerDocument;
  let options = initial;
  let frame: IkusiFrame = { time: '', text: '', platform: '' };
  let slots = newSlots();
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;

  const modules = (): { time: LcdModule[]; line: LcdModule[] } => {
    const side = options.side === 'right' ? 'right' : 'left';
    return { time: timeModules(side), line: lineModules() };
  };

  const build = (): void => {
    slots = newSlots();
    element = toDom(root(frame, scene(frame, options, slots), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
  };

  build();

  return {
    setFrame(next: IkusiFrame): void {
      frame = next;
      const look = lcdLook(options);
      const { time, line } = lines(frame);
      const at = modules();
      updateLcd(slots.time, at.time, time, ikusiLcd, look);
      updateLcd(slots.line, at.line, line, ikusiLcd, look);
      if (slots.number) slots.number.textContent = frame.platform;
      if (title) title.textContent = describe(frame);
    },
    setOptions(next: IkusiOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      element?.remove();
    },
  };
}
