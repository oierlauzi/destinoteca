/** A fixed-size dot font addressed by a display's own code page. */
export interface BitmapFont {
  id: string;
  cols: number;
  rows: number;
  /** One number per column, bit 0 being the top dot. */
  columns(code: number): number[];
}

/** Maps the text people type onto the codes a display's character generator understands. */
export interface Charset {
  id: string;
  /** The code for one character, or the code of a blank if the display has no such glyph. */
  encode(char: string): number;
  /** The character usually printed for a code, for pickers and for showing text back. */
  decode(code: number): string;
  /** Text as the display would spell it (case, accents it lacks), without changing its length. */
  fold(text: string): string;
  /** The codes worth offering in a picker: what a keyboard cannot type. */
  pickerCodes: readonly number[];
  /** A name for a code that does not read by eye, for tooltips. */
  nameOf?(code: number): string | undefined;
}
