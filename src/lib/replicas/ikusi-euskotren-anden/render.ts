import { h, ikusi7x9, lcdModules, toCells, toDocument, toDom, updateLcd, type LcdRefs, type VNode } from '../../hardware';
import type { Ticker } from '../../player/ticker';
import { ikusiLogo, ikusiLogoWidth } from '../ikusi/ikusi-logo';
import { railRow } from '../ikusi/modules';
import { BODY, CAP, FONT, LOGO, RIM, WHITE, YELLOW, lcdLook } from '../ikusi-euskotren/parts';
import type { EuskotrenFrame, EuskotrenOptions } from './def';
import {
  CHARS,
  CORNER,
  HEIGHT,
  LEGEND_BASELINES,
  LEGEND_CAP,
  LEGENDS,
  LINE,
  LOGO_HEIGHT,
  NUMBER_CAP,
  PLATE,
  TEXT,
  TEXT_AT,
  TIME,
  WIDTH,
  WINDOW,
  logoAt,
  moduleX,
  row,
} from './geometry';

/** The row's 21 characters: the time in the first five, a blank, and the destination. */
export function rowChars(frame: Pick<EuskotrenFrame, 'time' | 'text'>): string[] {
  const time = toCells(ikusi7x9.fold(frame.time), TIME);
  const text = toCells(ikusi7x9.fold(frame.text), TEXT);
  return [...time, ...Array.from({ length: TEXT_AT - TIME }, () => ' '), ...text].slice(0, CHARS);
}

export function describe(frame: EuskotrenFrame): string {
  return ['Euskotren', frame.platform.trim() && `Vía ${frame.platform.trim()}`, frame.time.trim(), frame.text.trim()].filter(Boolean).join(' · ');
}

interface Slots {
  number?: SVGElement;
  glyphs: LcdRefs;
}

const newSlots = (): Slots => ({ glyphs: { glyph: [] } });

function legend(x: number, baseline: number, text: string, width: number, fill: string, weight: number): VNode {
  return h('text', { x, y: baseline, 'font-size': LEGEND_CAP / CAP, 'font-weight': weight, fill, textLength: width, lengthAdjust: 'spacingAndGlyphs' }, [text]);
}

function scene(frame: EuskotrenFrame, options: EuskotrenOptions, slots: Slots): VNode[] {
  const r = row();
  const logoWidth = ikusiLogoWidth(LOGO_HEIGHT);
  const logo = logoAt(logoWidth);
  const plateCentre = { x: PLATE.x + PLATE.width / 2, y: PLATE.y + PLATE.height / 2 };
  return [
    h('rect', { x: 0, y: 0, width: WIDTH, height: HEIGHT, rx: CORNER, fill: BODY }),
    h('rect', { x: 0.3, y: 0.3, width: WIDTH - 0.6, height: HEIGHT - 0.6, rx: CORNER - 0.3, fill: 'none', stroke: RIM, 'stroke-width': 0.6 }),
    // The plate with the platform's number.
    h('rect', {
      x: PLATE.x,
      y: PLATE.y,
      width: PLATE.width,
      height: PLATE.height,
      rx: PLATE.corner,
      fill: 'none',
      stroke: YELLOW,
      'stroke-width': PLATE.stroke,
    }),
    h('text', { x: plateCentre.x, y: plateCentre.y + NUMBER_CAP / 2, 'font-size': NUMBER_CAP / CAP, 'font-weight': 700, fill: YELLOW, 'text-anchor': 'middle' }, [frame.platform], (element) => (slots.number = element)),
    h('rect', { x: LINE.x1, y: LINE.y - LINE.width / 2, width: LINE.x2 - LINE.x1, height: LINE.width, fill: YELLOW }),
    ...LEGENDS.flatMap((l) => [
      legend(moduleX(l.at), LEGEND_BASELINES.eu, l.eu.text, l.eu.width, WHITE, 400),
      legend(moduleX(l.at), LEGEND_BASELINES.es, l.es.text, l.es.width, YELLOW, 700),
    ]),
    // The window, sunk, with the rail and its modules in it.
    h('rect', { x: WINDOW.x - 0.5, y: WINDOW.y - 0.5, width: WINDOW.width + 1, height: WINDOW.height + 1, rx: 0.4, fill: '#0b0b0b' }),
    ...railRow(r),
    ...lcdModules(r.glasses, rowChars(frame), ikusi7x9, lcdLook(options), 0, slots.glyphs),
    ikusiLogo(logo.x, logo.y, LOGO_HEIGHT, LOGO),
  ];
}

function root(frame: EuskotrenFrame, children: VNode[], titleRef?: (element: SVGElement) => void): VNode {
  return h('svg', { viewBox: `0 0 ${WIDTH} ${HEIGHT}`, 'font-family': FONT, role: 'img' }, [h('title', {}, [describe(frame)], titleRef), ...children]);
}

export function renderToString(frame: EuskotrenFrame, options: EuskotrenOptions): string {
  const svg = root(frame, scene(frame, options, newSlots()));
  svg.attrs.width = 1600;
  svg.attrs.height = Math.round(((1600 * HEIGHT) / WIDTH) * 100) / 100;
  return toDocument(svg, 'destinoteca · teleindicador de andén de cristal líquido de Ikusi para Euskotren · https://oierlauzi.github.io/destinoteca/');
}

export interface MountedEuskotren {
  setFrame(frame: EuskotrenFrame): void;
  setOptions(options: EuskotrenOptions): void;
  destroy(): void;
}

/** Liquid crystal changes at once: the characters are redrawn only when the frame changes. */
export function mount(host: Element, initial: EuskotrenOptions, _env: { ticker: Ticker }): MountedEuskotren {
  const doc = host.ownerDocument;
  let options = initial;
  let frame: EuskotrenFrame = { time: '', text: '', platform: '' };
  let slots = newSlots();
  let title: SVGElement | undefined;
  let element: SVGElement | undefined;

  const build = (): void => {
    slots = newSlots();
    element = toDom(root(frame, scene(frame, options, slots), (node) => (title = node)), doc);
    element.setAttribute('width', '100%');
    element.style.display = 'block';
    host.replaceChildren(element);
  };
  build();

  return {
    setFrame(next: EuskotrenFrame): void {
      frame = next;
      updateLcd(slots.glyphs, row().glasses, rowChars(frame), ikusi7x9, lcdLook(options));
      if (slots.number) slots.number.textContent = frame.platform;
      if (title) title.textContent = describe(frame);
    },
    setOptions(next: EuskotrenOptions): void {
      options = next;
      build();
    },
    destroy(): void {
      element?.remove();
    },
  };
}
