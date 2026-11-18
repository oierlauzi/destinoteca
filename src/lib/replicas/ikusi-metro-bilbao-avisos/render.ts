import { h, MarqueeRun, toCells, toDocument, toDom, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { ikusiLogo, ikusiLogoWidth } from '../ikusi/ikusi-logo';
import { railRow } from '../ikusi/modules';
import { navilensPlate } from '../ikusi-metro-bilbao/navilens';
import { boxNodes, cellNodes, fold, newCellRefs, updateCells, windowNodes, type CellRefs } from '../ikusi-metro-bilbao/parts';
import { CHARS, plateOf, RUN_GAP, type AvisosFrame, type AvisosOptions } from './def';
import { layout, logoAt, LOGO_HEIGHT, type Layout } from './geometry';

const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';

const layoutOf = (options: AvisosOptions): Layout => layout(plateOf(options));

/** Whether a line is longer than its row, and so runs. */
export const runs = (line: string): boolean => Array.from(fold(line)).length > CHARS;

/**
 * A row's 35 characters, `offset` characters into its text. A text that
 * fits stands at the left; a longer one moves to the left one character at
 * a time and comes round again after a gap of blanks. At an offset of 0 its
 * beginning stands at the left end, as on a still picture.
 */
export function lineCells(line: string, offset: number): string[] {
  const chars = Array.from(fold(line));
  if (chars.length <= CHARS) return toCells(chars.join(''), CHARS);
  const loop = [...chars, ...Array.from({ length: RUN_GAP }, () => ' ')];
  const at = ((Math.floor(offset) % loop.length) + loop.length) % loop.length;
  return Array.from({ length: CHARS }, (_, i) => loop[(at + i) % loop.length]!);
}

export function describe(frame: AvisosFrame): string {
  return ['Metro Bilbao', ...frame.lines.map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean)].join(' · ');
}

function scene(frame: AvisosFrame, options: AvisosOptions, offsets: number[], refs: CellRefs[]): VNode[] {
  const l = layoutOf(options);
  const nodes: VNode[] = [...boxNodes(l.box, 0.9), ...windowNodes(l.window)];
  l.rows.forEach((row, i) => nodes.push(...railRow(row), ...cellNodes('lcd', row.glasses, lineCells(frame.lines[i] ?? '', offsets[i] ?? 0), options, i * CHARS, refs[i])));
  const width = ikusiLogoWidth(LOGO_HEIGHT);
  const logo = logoAt(l, width);
  nodes.push(ikusiLogo(logo.x, logo.y, LOGO_HEIGHT, '#c9cbc6'));
  if (l.plate) nodes.push(navilensPlate(l.plate.x, l.plate.y));
  return nodes;
}

function root(frame: AvisosFrame, options: AvisosOptions, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  const l = layoutOf(options);
  return h('svg', { viewBox: `0 0 ${l.width} ${l.height}`, 'font-family': FONT, role: 'img' }, [h('title', {}, [describe(frame)], titleRef), ...children]);
}

export function renderToString(frame: AvisosFrame, options: AvisosOptions): string {
  const l = layoutOf(options);
  const svg = root(frame, options, scene(frame, options, [], frame.lines.map(() => newCellRefs())));
  svg.attrs.width = 1600;
  svg.attrs.height = Math.round(((1600 * l.height) / l.width) * 100) / 100;
  return toDocument(svg, 'destinoteca · tablero de avisos de cristal líquido de Ikusi para Metro Bilbao · https://oierlauzi.github.io/destinoteca/');
}

export interface MountedAvisos {
  setFrame(frame: AvisosFrame): void;
  setOptions(options: AvisosOptions): void;
  destroy(): void;
}

/** Liquid crystal changes at once; a line that does not fit runs a character at a time on the shared ticker. */
export function mount(host: Element, initial: AvisosOptions, env: { ticker: Ticker }): MountedAvisos {
  const doc = host.ownerDocument;
  let options = initial;
  let frame: AvisosFrame = { lines: ['', '', ''] };
  let refs: CellRefs[] = [];
  let shown: number[] = [];
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;
  let now = 0;
  const marquees = [new MarqueeRun(), new MarqueeRun(), new MarqueeRun()];

  const offsets = (): number[] => frame.lines.map((line, i) => (options.scroll && runs(line) ? marquees[i]!.offset(now, line, options.speed) : 0));

  const build = (): void => {
    refs = frame.lines.map(() => newCellRefs());
    shown = offsets();
    element = toDom(root(frame, options, scene(frame, options, shown, refs), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
  };

  const draw = (force: boolean): void => {
    const next = offsets();
    const rows = layoutOf(options).rows;
    next.forEach((offset, i) => {
      if (!force && offset === shown[i]) return;
      const row = rows[i];
      const cells = refs[i];
      if (row && cells) updateCells('lcd', cells, row.glasses, lineCells(frame.lines[i] ?? '', offset), options);
    });
    shown = next;
  };

  const unsubscribe = env.ticker.subscribe((time) => {
    now = time;
    draw(false);
  });
  build();

  return {
    setFrame(next: AvisosFrame): void {
      frame = next;
      if (title) title.textContent = describe(next);
      draw(true);
    },
    setOptions(next: AvisosOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      unsubscribe();
      element?.remove();
    },
  };
}
