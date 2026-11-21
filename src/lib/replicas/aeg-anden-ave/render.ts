import {
  aegLcdLarge, aegLcdSmall, h, layoutLine, panelNodes, toDocument, toDom, updatePanel, writeWidth,
  type PanelLook, type PanelRefs, type PanelText, type Placed, type ProportionalFont, type VNode,
} from '../../hardware';
import type { AegFrame, AegOptions } from './def';
import { aegLogo, aegLogoWidth } from '../aeg/aeg-logo';
import { BEZEL, BOARD_WIDTH, CLOCK_WIDTH, GAP, GLASS_HEIGHT, GLASS_WIDTH, HEIGHT, MARK_HEIGHT, MARK_RIGHT, PANEL, PANEL_AT, WIDTH } from './geometry';
import { clockBox } from './clock';
import { frameBack, frameFront } from './frame';

/** The face each row of cells writes in. */
export const FACES: ProportionalFont[] = [aegLcdLarge, aegLcdSmall, aegLcdSmall];

/** The frame, flat: no light is drawn, only the colours the parts are. */
const FRAME = '#2b3570';
const FRAME_EDGE = '#1a2149';
/** The dark line where the frame meets the glass. */
const OPENING = '#0c0e16';
const MARK = '#d2d5dc';

/**
 * The crystal is a pale grey-green: the part of a cell that writes, and a
 * shade apart from it the margin above and below. The seams between the
 * cells and the band around the grid are an off-white sheet, and so is the
 * clock's face.
 */
const SHEET = '#e9e7dd';

/** One tone for every cell: nothing here ages or lights apart. */
export const LOOK: PanelLook = {
  glass: '#c3c6b1',
  margin: '#cdd0bd',
  groove: SHEET,
  glassDull: '#c3c6b1',
  ink: '#24271f',
  uneven: 0,
  seed: 1,
};

/**
 * What the controller writes. Every field starts at a cell: the time takes
 * the first and the destination follows at the second; the kind of train
 * takes the first of its line and what follows it starts at the next cell
 * it leaves free.
 */
export function written(frame: AegFrame): PanelText {
  const top = fields(frame.time ?? '', frame.text ?? '', aegLcdLarge, 1);
  const middle = fields(frame.product ?? '', frame.calls ?? '', aegLcdSmall, 1);
  return [top, middle, layoutLine(frame.extra ?? '', aegLcdSmall, PANEL)];
}

/** Two fields on one line, the second starting at a cell the first leaves free. */
function fields(first: string, second: string, font: ProportionalFont, least: number): Placed[] {
  const head = layoutLine(first, font, PANEL);
  const used = head.reduce((max, p) => Math.max(max, p.cell), -1);
  const from = Math.max(least, used + 1);
  if (from >= PANEL.cells || !second.trim()) return head;
  const tail = layoutLine(second, font, { ...PANEL, cells: PANEL.cells - from }).map((p) => ({ ...p, cell: p.cell + from }));
  return [...head, ...tail];
}

export function describe(frame: AegFrame): string {
  return [frame.time, frame.text, frame.product, frame.calls, frame.extra].map((part) => (part ?? '').trim()).filter(Boolean).join(' · ');
}

function scene(frame: AegFrame, options: AegOptions, refs?: PanelRefs): VNode[] {
  const markWidth = aegLogoWidth(MARK_HEIGHT);
  const look = LOOK;
  const left = options.clockSide === 'left';
  const board = left ? CLOCK_WIDTH + GAP : 0;
  const clock = left ? 0 : BOARD_WIDTH + GAP;
  return [
    h('g', { transform: `translate(${board},0)` }, [
      frameBack({ x: 0, y: 0, width: BOARD_WIDTH, height: HEIGHT }, FRAME, FRAME_EDGE),
      ...panelNodes(PANEL, look, written(frame), FACES, PANEL_AT, refs),
      ...frameFront(
        { x: 0, y: 0, width: BOARD_WIDTH, height: HEIGHT },
        { x: BEZEL, y: BEZEL, width: GLASS_WIDTH, height: GLASS_HEIGHT },
        FRAME,
        FRAME_EDGE,
        OPENING,
      ),
      aegLogo(MARK_RIGHT - markWidth, HEIGHT - BEZEL + (BEZEL - MARK_HEIGHT) / 2, MARK_HEIGHT, MARK),
    ]),
    h('g', { transform: `translate(${clock},0)` }, clockBox(frame.clock ?? '', { frame: FRAME, edge: FRAME_EDGE, face: look.groove, ink: look.ink, line: OPENING })),
  ];
}

function root(frame: AegFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return h('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, role: 'img' }, [h('title', {}, [describe(frame)], titleRef), ...children]);
}

export function renderToString(frame: AegFrame, options: AegOptions): string {
  const svg = root(frame, scene(frame, options));
  svg.attrs.width = 1200;
  svg.attrs.height = Math.round(((1200 * HEIGHT) / WIDTH) * 100) / 100;
  return toDocument(svg, 'destinoteca · teleindicador de andén de cristal líquido de AEG · https://oierlauzi.github.io/destinoteca/');
}

/** Characters of the large face that fit in one cell, for fitting text. */
export const CELL_ROOM = writeWidth(PANEL);

export interface MountedAeg {
  setFrame(frame: AegFrame): void;
  setOptions(options: AegOptions): void;
  destroy(): void;
}

/** Liquid crystal changes at once and nothing here moves, so the dots are redrawn only when the frame does. */
export function mount(host: Element, initial: AegOptions): MountedAeg {
  const doc = host.ownerDocument;
  let options = initial;
  let frame: AegFrame = { time: '', text: '', product: '', calls: '', extra: '', clock: '' };
  let refs: PanelRefs = { ink: [] };
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;

  const build = (): void => {
    refs = { ink: [] };
    element = toDom(root(frame, scene(frame, options, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
  };
  build();

  return {
    setFrame(next: AegFrame): void {
      // The hands move with the frame, so the whole unit is redrawn.
      const sameClock = next.clock === frame.clock;
      frame = next;
      if (!sameClock) {
        build();
        return;
      }
      updatePanel(refs, PANEL, written(frame), FACES, PANEL_AT);
      if (title) title.textContent = describe(frame);
    },
    setOptions(next: AegOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      element?.remove();
    },
  };
}
