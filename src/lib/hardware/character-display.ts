import { hash01 } from './defects';
import type { DotModule, DotState } from './dot-matrix';
import type { BitmapFont, Charset } from './fonts/types';

/**
 * Character displays: dot matrices made of one module per character, driven
 * with character codes. Everything here is layout and arithmetic; drawing is
 * dot-matrix.ts and a skin.
 */

export interface CellGridSpec {
  /** Rows of text. */
  lines: number;
  /** Characters per row. */
  cells: number;
  /** Dots per character. */
  cols: number;
  rows: number;
  pitch: number;
  /** Distance between rows of dots, where it differs from `pitch`. */
  pitchY?: number;
  /** Space between two characters, and between two lines. */
  cellGap: number;
  lineGap?: number;
  x?: number;
  y?: number;
}

/** The modules of a lines x cells character display, line by line. */
export function cellGrid(spec: CellGridSpec): DotModule[] {
  const out: DotModule[] = [];
  const stepX = spec.cols * spec.pitch + spec.cellGap;
  const stepY = spec.rows * (spec.pitchY ?? spec.pitch) + (spec.lineGap ?? 0);
  for (let line = 0; line < spec.lines; line++) {
    for (let cell = 0; cell < spec.cells; cell++) {
      out.push({ x: (spec.x ?? 0) + cell * stepX, y: (spec.y ?? 0) + line * stepY });
    }
  }
  return out;
}

/** Text as exactly `cells` characters: cut if longer, padded with spaces if shorter. */
export function toCells(text: string, cells: number): string[] {
  const out = Array.from(text).slice(0, cells);
  while (out.length < cells) out.push(' ');
  return out;
}

/**
 * Writes `text` over part of a line, as a controller does when it sends a
 * field to a fixed position. Right-aligned text ends at the last cell.
 */
export function overlay(cells: string[], text: string, align: 'left' | 'right', from = 0, to = cells.length): string[] {
  const out = [...cells];
  const width = to - from;
  const chars = align === 'right' ? Array.from(text).slice(-width) : Array.from(text).slice(0, width);
  const start = align === 'right' ? to - chars.length : from;
  chars.forEach((char, i) => {
    out[start + i] = char;
  });
  return out;
}

export function encodeCells(cells: string[], charset: Charset): number[] {
  return cells.map((char) => charset.encode(char));
}

export interface Garble {
  /** Fraction of cells affected. */
  fraction: number;
  seed: number;
  /** Changes with the message, so that each message is garbled afresh but stays put while shown. */
  salt: number;
  /** The code that turns up instead. */
  replacement: number;
}

/** Cells showing the wrong character, as when a byte is corrupted on its way to the display. */
export function garble(codes: number[], fault: Garble): number[] {
  if (fault.fraction <= 0) return codes;
  return codes.map((code, i) => (hash01(fault.seed, i, fault.salt, 0x48) < fault.fraction ? fault.replacement : code));
}

/** The dots of a sequence of character codes, one module per code. */
export function glyphState(codes: number[], font: BitmapFont): DotState {
  return codes.map((code) => font.columns(code));
}

/** Text as one continuous strip of columns, with `spacing` blank columns after each character. */
export function textColumns(text: string, font: BitmapFont, charset: Charset, spacing = 1): number[] {
  const out: number[] = [];
  for (const char of text) {
    out.push(...font.columns(charset.encode(char)));
    for (let i = 0; i < spacing; i++) out.push(0);
  }
  return out;
}
