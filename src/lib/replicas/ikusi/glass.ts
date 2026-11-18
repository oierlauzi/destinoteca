import type { LcdLook } from '../../hardware';

export type GlassTint = 'verde' | 'oliva' | 'ambar';

/**
 * The colours of Ikusi's liquid-crystal modules, as photographed. The
 * characters are yellow everywhere; on the amber modules they go orange as
 * they age, on the green ones towards lime. Unlit, each glass glows faintly:
 * green at Bilbao airport; olive at Valencia, Barcelona and Madrid; amber
 * going to grey in the Canary Islands and Asturias. The platform signs of
 * Atocha Cercanías have the amber modules' characters.
 */
export const IKUSI_GLASSES: Record<GlassTint, Pick<LcdLook, 'lit' | 'litAged' | 'blank' | 'blankDull'>> = {
  verde: { lit: '#f6e84e', litAged: '#d8dc4a', blank: '#5c9a34', blankDull: '#34481f' },
  oliva: { lit: '#f6e84e', litAged: '#e2c846', blank: '#3b4513', blankDull: '#192010' },
  ambar: { lit: '#f8e64e', litAged: '#eaae40', blank: '#7a6630', blankDull: '#3d3b37' },
};
