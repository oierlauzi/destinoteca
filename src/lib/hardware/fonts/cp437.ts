import type { Charset } from './types';

/**
 * IBM code page 437, exactly as IBM defined it. Nothing here is specific to
 * any display: character generators that deviate from it (and most do, a
 * little) describe their deviations in a charset of their own, built on this
 * one. See telenorma-cp437.ts for the first such case.
 */

// Codes 0x20-0x7E are ASCII and need no table.
const LOW = '☺☻♥♦♣♠•◘○◙♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼'; // 0x01-0x1F
const HIGH =
  '⌂ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ '; // 0x7F-0xFF

const BLANK = 0x20;

const TO_CODE = new Map<string, number>();
Array.from(LOW).forEach((char, i) => TO_CODE.set(char, 0x01 + i));
Array.from(HIGH).forEach((char, i) => TO_CODE.set(char, 0x7f + i));
// CP437 has no accented capitals other than É, Ä, Å, Ö, Ü and Ñ. Signs of the
// time simply dropped the accent.
for (const [accented, plain] of Object.entries({
  Á: 'A', À: 'A', Â: 'A', Í: 'I', Ì: 'I', Î: 'I', Ï: 'I', Ó: 'O', Ò: 'O', Ô: 'O', Ú: 'U', Ù: 'U', Û: 'U', È: 'E', Ê: 'E', Ë: 'E',
})) {
  TO_CODE.set(accented, plain.charCodeAt(0));
}

/** Names for the pictograms below 0x20, which do not read by eye in a picker. */
export const CP437_NAMES: Record<number, string> = {
  1: 'cara sonriente', 2: 'cara sonriente (rellena)', 3: 'corazón', 4: 'diamante', 5: 'trébol', 6: 'pica',
  7: 'punto', 8: 'punto (inverso)', 9: 'círculo', 10: 'círculo (inverso)', 11: 'símbolo masculino',
  12: 'símbolo femenino', 13: 'corchea', 14: 'corcheas', 15: 'sol', 16: 'puntero a la derecha',
  17: 'puntero a la izquierda', 18: 'flecha arriba y abajo', 19: 'doble exclamación', 20: 'calderón',
  21: 'párrafo', 22: 'rectángulo', 23: 'flecha arriba y abajo (con base)', 24: 'flecha arriba',
  25: 'flecha abajo', 26: 'flecha a la derecha', 27: 'flecha a la izquierda', 28: 'ángulo recto',
  29: 'flecha izquierda y derecha', 30: 'triángulo arriba', 31: 'triángulo abajo', 127: 'casa',
};

/** Everything a keyboard cannot type. */
const PICKER_CODES: readonly number[] = [
  ...Array.from({ length: 31 }, (_, i) => i + 1),
  127,
  ...Array.from({ length: 127 }, (_, i) => i + 128),
];

export const cp437: Charset = {
  id: 'cp437',
  pickerCodes: PICKER_CODES,
  nameOf: (code) => CP437_NAMES[code],
  encode(char: string): number {
    const mapped = TO_CODE.get(char);
    if (mapped !== undefined) return mapped;
    const code = char.codePointAt(0) ?? BLANK;
    return code >= 0x20 && code < 0x7f ? code : BLANK;
  },
  decode(code: number): string {
    if (code >= 0x20 && code < 0x7f) return String.fromCharCode(code);
    if (code >= 0x01 && code < 0x20) return Array.from(LOW)[code - 0x01] ?? ' ';
    if (code >= 0x7f && code <= 0xff) return Array.from(HIGH)[code - 0x7f] ?? ' ';
    return ' ';
  },
  // Upper case, accents dropped. The tilde (U+0303) is spared: Ñ is the one
  // accented capital these displays do have.
  fold(text: string): string {
    return text
      .toUpperCase()
      .normalize('NFD')
      .replace(/[̀-̂̄-ͯ]/g, '')
      .normalize('NFC');
  },
};
