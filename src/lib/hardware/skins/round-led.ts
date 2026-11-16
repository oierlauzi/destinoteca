import type { DotSkin } from '../dot-matrix';
import { h, num, type VNode } from '../svg';

export interface RoundLedLook {
  lit: string;
  unlit: string;
}

export interface RoundLedShape {
  /** Radius of a lit and of an unlit LED, as fractions of the pitch. A lit one looks bigger. */
  litRadius: number;
  unlitRadius: number;
}

/** A discrete round LED: a bright disc when lit, a smaller dull one when not. */
export function roundLed(shape: RoundLedShape = { litRadius: 3.1 / 12, unlitRadius: 2.3 / 12 }): DotSkin<RoundLedLook> {
  return {
    draw(x: number, y: number, pitch: number, on: boolean, look: RoundLedLook): VNode[] {
      return [
        h('circle', {
          cx: x + pitch / 2,
          cy: y + pitch / 2,
          r: pitch * (on ? shape.litRadius : shape.unlitRadius),
          fill: on ? look.lit : look.unlit,
          // The pitch rides along so that `update` can resize the LED without being told it again.
          'data-p': pitch,
        }),
      ];
    },
    update(elements: SVGElement[], on: boolean, look: RoundLedLook): void {
      const led = elements[0];
      if (!led) return;
      const pitch = Number(led.getAttribute('data-p'));
      led.setAttribute('r', num(pitch * (on ? shape.litRadius : shape.unlitRadius)));
      led.setAttribute('fill', on ? look.lit : look.unlit);
    },
    visible: () => true,
  };
}
