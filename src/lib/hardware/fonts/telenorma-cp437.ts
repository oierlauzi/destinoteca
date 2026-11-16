import { cp437 } from './cp437';
import type { Charset } from './types';

/**
 * Code page 437 as the character generator of Telenorma's flip-dot terminals
 * has it (ROM of a PAGE Ibérica PI-T100-M, firmware AK0052.139U1). It is not
 * standard CP437: three codes of the ASCII half were given other glyphs.
 *
 *   0x23  a solid block, instead of #
 *   0x24  ñ, instead of $
 *   0x25  Ñ, instead of %
 *
 * The two eñes are there for 7-bit serial links. CP437's own ñ and Ñ are at
 * 0xA4 and 0xA5; a link that carries seven bits drops the top one, and they
 * arrive as 0x24 and 0x25 ($ and %). Drawing ñ and Ñ at those two codes as
 * well makes Spanish text read right either way. Text typed here is sent to
 * the native 8-bit codes; `sevenBit()` below spells it as a 7-bit link would
 * deliver it.
 *
 * The three displaced characters are passed through as their ASCII codes
 * rather than refused: a controller sending "100%" did get "100Ñ" on the
 * sign, and so does the replica.
 */
const OVERRIDES: Record<number, string> = { 0x23: '█', 0x24: 'ñ', 0x25: 'Ñ' };

export const telenormaCp437: Charset = {
  ...cp437,
  id: 'telenorma-cp437',
  decode: (code) => OVERRIDES[code] ?? cp437.decode(code),
};

/** The same code page restricted to 7 bits: ñ and Ñ go to 0x24 and 0x25, and nothing above 0x7F exists. */
export function sevenBit(charset: Charset = telenormaCp437): Charset {
  return {
    ...charset,
    id: `${charset.id}-7bit`,
    encode(char: string): number {
      if (char === 'ñ') return 0x24;
      if (char === 'Ñ') return 0x25;
      const code = charset.encode(char);
      return code < 0x80 ? code : 0x20;
    },
    pickerCodes: charset.pickerCodes.filter((code) => code < 0x80),
  };
}
