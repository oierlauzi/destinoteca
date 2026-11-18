import { hash01 } from './defects';
import type { LcdFont, LcdModule } from './lcd-modules';
import { h, num, type VNode } from './svg';

/**
 * Character cells of round LEDs, one small matrix per character, set in a
 * board built for one glass per character. A cell with a character lights
 * its dots and leaves the others dark; a blank one lights all of its dots
 * faintly, as a glass glows with nothing written on it. Cells age apart, so
 * neighbours differ a little in brightness.
 *
 * The same font interface as the liquid-crystal modules (lcd-modules.ts),
 * and the same placement: `at` is the top-left corner of the cell.
 */

export interface LedCellLook {
  /** The cell, in which the dots are centred. */
  width: number;
  height: number;
  /** Between the centres of two dots, across and down. */
  pitchX: number;
  pitchY: number;
  /** Radius of a lit dot and of a dark or faint one. */
  litRadius: number;
  radius: number;
  /** The board behind the dots. */
  back: string;
  lit: string;
  /** The dots of a blank cell. */
  faint: string;
  /** The unlit dots of a cell with a character. */
  dark: string;
  /** 0 to 1: how far the cells have drifted apart in brightness. */
  uneven: number;
  seed: number;
}

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const scaled = (hex: string, k: number): string =>
  `#${rgb(hex)
    .map((v) => Math.round(Math.min(255, Math.max(0, v * k))).toString(16).padStart(2, '0'))
    .join('')}`;

/** The colours of the cell at index `i`: each its own, fixed by the seed. */
export function ledCellShades(i: number, look: LedCellLook): { lit: string; faint: string } {
  const dim = 1 - hash01(look.seed, i, 0, 0x1ed) * look.uneven * 0.35;
  const faint = 1 - hash01(look.seed, i, 1, 0x1ed) * look.uneven * 0.5;
  return { lit: scaled(look.lit, dim), faint: scaled(look.faint, faint * dim) };
}

/** A circle as a path, so that one path holds many. */
const disc = (cx: number, cy: number, r: number): string => `M${num(cx - r)} ${num(cy)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0z`;

/**
 * The dots of a character in its cell: the lit ones, and the others. With
 * no dot lit, the cell is blank and the others are all of them.
 */
export function ledCellPaths(char: string, at: LcdModule, font: LcdFont, look: LedCellLook): { lit: string; rest: string; blank: boolean } {
  const columns = font.glyph(char);
  const x0 = at.x + (look.width - (font.cols - 1) * look.pitchX) / 2;
  const y0 = at.y + (look.height - (font.rows - 1) * look.pitchY) / 2;
  let lit = '';
  let rest = '';
  for (let col = 0; col < font.cols; col++) {
    const bits = columns[col] ?? 0;
    for (let row = 0; row < font.rows; row++) {
      const x = x0 + col * look.pitchX;
      const y = y0 + row * look.pitchY;
      if (bits & (1 << row)) lit += disc(x, y, look.litRadius);
      else rest += disc(x, y, look.radius);
    }
  }
  return { lit, rest, blank: lit === '' };
}

export interface LedCellRefs {
  lit: SVGElement[];
  rest: SVGElement[];
}

/**
 * The cells, each showing one character of `chars` (a blank past its end).
 * `first` numbers them, so that the cells of several lines on one board
 * each keep their own shade.
 */
export function ledCells(cells: LcdModule[], chars: string[], font: LcdFont, look: LedCellLook, first = 0, refs?: LedCellRefs): VNode[] {
  const nodes: VNode[] = [];
  cells.forEach((at, k) => {
    const shades = ledCellShades(first + k, look);
    const paths = ledCellPaths(chars[k] ?? ' ', at, font, look);
    nodes.push(
      h('rect', { x: at.x, y: at.y, width: look.width, height: look.height, fill: look.back }),
      h('path', { d: paths.rest, fill: paths.blank ? shades.faint : look.dark, 'data-faint': shades.faint }, [], refs ? (element) => (refs.rest[k] = element) : undefined),
      h('path', { d: paths.lit, fill: shades.lit }, [], refs ? (element) => (refs.lit[k] = element) : undefined),
    );
  });
  return nodes;
}

/** Brings cells drawn with `refs` up to date with new characters. */
export function updateLedCells(refs: LedCellRefs, cells: LcdModule[], chars: string[], font: LcdFont, look: LedCellLook): void {
  cells.forEach((at, k) => {
    const paths = ledCellPaths(chars[k] ?? ' ', at, font, look);
    const rest = refs.rest[k];
    refs.lit[k]?.setAttribute('d', paths.lit);
    if (!rest) return;
    rest.setAttribute('d', paths.rest);
    rest.setAttribute('fill', paths.blank ? (rest.getAttribute('data-faint') ?? look.faint) : look.dark);
  });
}
