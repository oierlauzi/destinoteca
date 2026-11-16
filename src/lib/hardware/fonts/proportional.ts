/**
 * Proportional dot fonts: glyphs of varying width, laid out on a continuous
 * matrix rather than one character per module. Glyphs are addressed by the
 * character itself; there is no code page in between.
 */
export interface ProportionalFont {
  id: string;
  rows: number;
  /** Blank columns between two glyphs. */
  spacing: number;
  /** Columns of a space, not counting the spacing on either side. */
  space: number;
  /** One number per column, bit 0 being the top dot; undefined for a character the font lacks. */
  glyph(char: string): number[] | undefined;
  /** Text as the display would spell it (case, accents it lacks). */
  fold(text: string): string;
}

/** Glyphs drawn as rows of `#` and `.`, top row first, all rows the same width. */
export function fromRows(rows: string[]): number[] {
  const width = rows[0]?.length ?? 0;
  const columns: number[] = [];
  for (let c = 0; c < width; c++) {
    let byte = 0;
    rows.forEach((row, r) => {
      if (row[c] === '#') byte |= 1 << r;
    });
    columns.push(byte);
  }
  return columns;
}

/** The columns of a text, glyph after glyph. Characters the font lacks are left out. */
export function textStrip(text: string, font: ProportionalFont): number[] {
  const out: number[] = [];
  let first = true;
  for (const char of font.fold(text)) {
    const columns = char === ' ' ? Array.from({ length: font.space }, () => 0) : font.glyph(char);
    if (!columns) continue;
    if (!first) for (let i = 0; i < font.spacing; i++) out.push(0);
    out.push(...columns);
    first = false;
  }
  return out;
}

/** How many columns a text takes. */
export function measure(text: string, font: ProportionalFont): number {
  return textStrip(text, font).length;
}

/**
 * The longest of several forms of a text that fits `room` columns; if none
 * does, the shortest one cut short: at the end of the last whole word that
 * fits, or inside the first word if not even that one does.
 */
export function fitText(forms: string[], font: ProportionalFont, room: number): string {
  const folded = forms.map((form) => font.fold(form)).filter(Boolean);
  const fitting = folded.find((form) => measure(form, font) <= room);
  if (fitting !== undefined) return fitting;
  const whole = Array.from(folded[folded.length - 1] ?? '');
  const chars = [...whole];
  while (chars.length && measure(chars.join(''), font) > room) chars.pop();
  // A cut that falls inside a word goes back to the end of the last whole one, when there is one.
  if (chars.length < whole.length && /[^\s\-/]/.test(whole[chars.length] ?? '')) {
    const kept = chars.join('');
    const end = Math.max(kept.lastIndexOf(' '), kept.lastIndexOf('-'), kept.lastIndexOf('/'));
    if (end > 0) return kept.slice(0, end).replace(/[\s\-/.]+$/, '');
  }
  return chars.join('').replace(/[\s\-/.]+$/, '');
}

/**
 * Writes a strip of columns into a line `cols` wide: from column `at`
 * leftwards-anchored, or ending at column `at` when right-aligned. What falls
 * outside the line is cut.
 */
export function place(line: number[], strip: number[], at: number, align: 'left' | 'right'): number[] {
  const out = [...line];
  const start = align === 'right' ? at - strip.length + 1 : at;
  strip.forEach((byte, i) => {
    const c = start + i;
    if (c >= 0 && c < out.length) out[c] = (out[c] ?? 0) | byte;
  });
  return out;
}
