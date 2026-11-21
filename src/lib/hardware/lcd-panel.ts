import { hash01 } from './defects';
import { h, num, type VNode } from './svg';
import type { ProportionalFont } from './fonts/proportional';

/**
 * A liquid-crystal panel built of cells: a grid of glasses butted together,
 * with a groove between them, as against lcd-modules.ts, where one glass
 * holds one character.
 *
 * Inside a cell the writing is inset: a margin above and below it, in a
 * slightly different shade from the part that writes. The characters have
 * widths of their own, but no character is ever drawn across a groove — one
 * that would be is pushed to the beginning of the next cell.
 *
 * Nothing here lights. The crystal is dark where it is switched and every
 * other part is its own flat colour.
 */

export interface PanelSpec {
  /** Cells across. */
  cells: number;
  /** Height of each row of cells, in dots. */
  rowHeights: readonly number[];
  /** Width of a cell, in dots, groove included. */
  cellWidth: number;
  /** How tall the part of a cell that writes is, per row. */
  writeHeights: readonly number[];
  pitch: number;
  dot: number;
  /** The groove between two cells. */
  groove: number;
  /** The band of groove around the whole grid, in dots. Defaults to half a groove. */
  pad?: number;
}

export interface PanelLook {
  /** The part of a cell that writes. */
  glass: string;
  /** The margin above and below it. */
  margin: string;
  /** The groove between the cells. */
  groove: string;
  /** What a glass drifts towards as the cells age apart. */
  glassDull: string;
  /** Switched crystal. */
  ink: string;
  /** 0 to 1: how far the cells have drifted apart in shade. */
  uneven: number;
  seed: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const panelWidth = (spec: PanelSpec): number => spec.cells * spec.cellWidth * spec.pitch;
export const panelHeight = (spec: PanelSpec): number => spec.rowHeights.reduce((a, b) => a + b, 0) * spec.pitch;

/**
 * The glass runs past the cells on every side, in the colour of the grooves:
 * a band around the grid, wider than the ones between the cells.
 */
export const panelPad = (spec: PanelSpec): number => (spec.pad ?? spec.groove / 2) * spec.pitch;
export function panelOuter(spec: PanelSpec, at: { x: number; y: number }): Box {
  const pad = panelPad(spec);
  return { x: at.x - pad, y: at.y - pad, width: panelWidth(spec) + 2 * pad, height: panelHeight(spec) + 2 * pad };
}

/** The top of a row of cells, in dots. */
export function rowTop(spec: PanelSpec, line: number): number {
  let y = 0;
  for (let i = 0; i < line; i++) y += spec.rowHeights[i]!;
  return y;
}

/** Dots a cell can write in, inside its grooves. */
export const writeWidth = (spec: PanelSpec): number => spec.cellWidth - spec.groove;

/** The glass of one cell, and the part of it that writes. */
export function cellBoxes(spec: PanelSpec, line: number, cell: number, at: { x: number; y: number }): { glass: Box; write: Box } {
  const half = (spec.groove * spec.pitch) / 2;
  const glass = {
    x: at.x + cell * spec.cellWidth * spec.pitch + half,
    y: at.y + rowTop(spec, line) * spec.pitch + half,
    width: spec.cellWidth * spec.pitch - spec.groove * spec.pitch,
    height: spec.rowHeights[line]! * spec.pitch - spec.groove * spec.pitch,
  };
  const height = spec.writeHeights[line]! * spec.pitch;
  return { glass, write: { x: glass.x, y: glass.y + (glass.height - height) / 2, width: glass.width, height } };
}

/** Where one character of a line goes: its cell, and the dot it starts at inside it. */
export interface Placed {
  char: string;
  cell: number;
  /** Dots from the cell's left edge. */
  at: number;
}

/** How wide a run of characters is, with the spacing between them. */
function runWidth(chars: readonly string[], font: ProportionalFont): number {
  let width = 0;
  chars.forEach((char, i) => {
    const columns = char === ' ' ? font.space : (font.glyph(char)?.length ?? 0);
    width += columns + (i ? font.spacing : 0);
  });
  return width;
}

/**
 * A line laid out over the cells. Characters follow one another with their
 * own widths, and a word that does not fit in what is left of a cell starts
 * the next one, so that it reads whole; only a word too long for any cell is
 * broken, and then at the last character that fits. No character is ever
 * drawn across a groove, and a blank left at the head of a cell is dropped.
 */
export function layoutLine(text: string, font: ProportionalFont, spec: PanelSpec): Placed[] {
  const room = writeWidth(spec);
  const out: Placed[] = [];
  let cell = 0;
  let at = 0;
  // Words, with the blanks that follow them.
  const words = font.fold(text).match(/\S+\s*|\s+/g) ?? [];
  for (const word of words) {
    const chars = Array.from(word.trimEnd());
    if (chars.length === 0) {
      at += font.space + font.spacing;
      continue;
    }
    const width = runWidth(chars, font);
    // A word that fits a cell but not what is left of this one waits for the next.
    if (at > 0 && at + width > room && width <= room) {
      cell++;
      at = 0;
    }
    if (cell >= spec.cells) break;
    for (const char of chars) {
      const columns = font.glyph(char);
      if (!columns) continue;
      if (at + columns.length > room) {
        cell++;
        at = 0;
        if (cell >= spec.cells) break;
      }
      out.push({ char, cell, at });
      at += columns.length + font.spacing;
    }
    if (cell >= spec.cells) break;
    at += font.space + font.spacing;
    if (at >= room) {
      cell++;
      at = 0;
    }
  }
  return out;
}

/** The first dot of the cell that starts after `used` dots of the line. */
export function nextCell(spec: PanelSpec, cell: number): number {
  return Math.min(spec.cells - 1, cell + 1);
}

/** The shade of the cell at index `i`: its own, fixed by the seed. */
export function cellShade(i: number, look: PanelLook): string {
  if (look.uneven <= 0) return look.glass;
  const t = hash01(look.seed, i, 0, 0x9a1) * look.uneven;
  const [ar, ag, ab] = rgb(look.glass);
  const [br, bg, bb] = rgb(look.glassDull);
  const part = (a: number, b: number) => Math.round(a + (b - a) * t).toString(16).padStart(2, '0');
  return `#${part(ar, br)}${part(ag, bg)}${part(ab, bb)}`;
}

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** The switched dots of what one cell of one line writes, as one path. */
export function cellInk(placed: readonly Placed[], font: ProportionalFont, spec: PanelSpec, write: Box): string {
  const inset = (spec.pitch - spec.dot) / 2;
  let d = '';
  for (const { char, at } of placed) {
    const columns = font.glyph(char);
    if (!columns) continue;
    columns.forEach((bits, c) => {
      for (let r = 0; r < font.rows; r++) {
        if (!(bits & (1 << r))) continue;
        const x = write.x + (at + c) * spec.pitch + inset;
        const y = write.y + r * spec.pitch + inset;
        d += `M${num(x)} ${num(y)}h${num(spec.dot)}v${num(spec.dot)}h${num(-spec.dot)}z`;
      }
    });
  }
  return d;
}

export interface PanelRefs {
  ink: SVGElement[];
}

/** What every line of the panel writes, already laid out. */
export type PanelText = readonly (readonly Placed[])[];

/**
 * The panel with its top-left corner at (x, y): the grooves behind, every
 * cell's glass over them with the part that writes inset, and the switched
 * dots in that part.
 */
export function panelNodes(spec: PanelSpec, look: PanelLook, text: PanelText, fonts: readonly ProportionalFont[], at: { x: number; y: number }, refs?: PanelRefs): VNode[] {
  const nodes: VNode[] = [h('rect', { ...panelOuter(spec, at), fill: look.groove })];
  const inks: VNode[] = [];
  let i = 0;
  spec.rowHeights.forEach((_, line) => {
    for (let cell = 0; cell < spec.cells; cell++) {
      const index = i++;
      const { glass, write } = cellBoxes(spec, line, cell, at);
      nodes.push(h('rect', { ...glass, fill: look.margin }));
      nodes.push(h('rect', { ...write, fill: cellShade(index, look) }));
      const placed = (text[line] ?? []).filter((p) => p.cell === cell);
      inks.push(h('path', { d: cellInk(placed, fonts[line]!, spec, write), fill: look.ink }, [], refs ? (element) => (refs.ink[index] = element) : undefined));
    }
  });
  return [...nodes, ...inks];
}

/** Brings a panel drawn with `refs` up to date with what is written now. */
export function updatePanel(refs: PanelRefs, spec: PanelSpec, text: PanelText, fonts: readonly ProportionalFont[], at: { x: number; y: number }): void {
  let i = 0;
  spec.rowHeights.forEach((_, line) => {
    for (let cell = 0; cell < spec.cells; cell++) {
      const { write } = cellBoxes(spec, line, cell, at);
      const placed = (text[line] ?? []).filter((p) => p.cell === cell);
      refs.ink[i++]?.setAttribute('d', cellInk(placed, fonts[line]!, spec, write));
    }
  });
}
