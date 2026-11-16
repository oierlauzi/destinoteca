import type { DotSkin } from '../dot-matrix';
import { h, type VNode } from '../svg';

export interface LitFlapLook {
  /** Colour of the bright side of a flap. */
  lit: string;
  /** Colour of the dark side, or null to leave dark flaps out. */
  unlit: string | null;
  /** Whether the LED beside each flap lights the flaps that show their bright side. */
  leds: boolean;
  /** Colour of a lit LED. */
  led: string;
}

export interface LitFlapShape {
  /** Side of a flap, as a fraction of the pitch. */
  size: number;
  /** How much of the plain corners is cut, as a fraction of the side: the flap is a squarish octagon. */
  corner: number;
  /** Radius of the notches where the LED sits, as a fraction of the side. */
  notch: number;
  /** Radius of the LED, as a fraction of the pitch. */
  ledRadius: number;
}

const LED_OFF = '#141410';
const f = (n: number): string => String(Math.round(n * 1e4) / 1e4);

/**
 * A flap with a small LED in the lower-right corner of its cell, as on
 * flip-dot matrices lit by LEDs rather than by a tube: the LED shines on the
 * flap's bright side, so the dots read in the dark. Unlike the octagonal
 * flaps of character modules, these sit in one continuous grid.
 *
 * The flap is a squarish octagon with a round notch at the upper-left and
 * lower-right corners. It turns about the diagonal between the other two
 * corners, so whichever side faces out, a notch sits over the LED.
 */
export function litFlap(shape: LitFlapShape = { size: 0.84, corner: 0.16, notch: 0.24, ledRadius: 0.08 }): DotSkin<LitFlapLook> {
  const paint = (elements: SVGElement[], on: boolean, look: LitFlapLook): void => {
    const [flap, fold, led] = elements;
    const hidden = !on && look.unlit === null;
    for (const element of elements) {
      if (hidden) element.setAttribute('display', 'none');
      else element.removeAttribute('display');
    }
    if (hidden) return;
    flap?.setAttribute('fill', on ? look.lit : (look.unlit ?? 'none'));
    fold?.setAttribute('stroke', on ? '#000000' : '#ffffff');
    fold?.setAttribute('stroke-opacity', on ? '0.28' : '0.06');
    led?.setAttribute('fill', on && look.leds ? look.led : LED_OFF);
  };
  return {
    draw(x: number, y: number, pitch: number, on: boolean, look: LitFlapLook): VNode[] {
      const s = pitch * shape.size;
      const k = s * shape.corner;
      const n = s * shape.notch;
      // Centred in its cell.
      const x0 = x + (pitch - s) / 2;
      const y0 = y + (pitch - s) / 2;
      const x1 = x0 + s;
      const y1 = y0 + s;
      // Clockwise from the top edge; the two notches are arcs bending into the flap.
      const d = [
        `M${f(x0 + n)},${f(y0)}`,
        `L${f(x1 - k)},${f(y0)}`,
        `L${f(x1)},${f(y0 + k)}`,
        `L${f(x1)},${f(y1 - n)}`,
        `A${f(n)},${f(n)} 0 0 0 ${f(x1 - n)},${f(y1)}`,
        `L${f(x0 + k)},${f(y1)}`,
        `L${f(x0)},${f(y1 - k)}`,
        `L${f(x0)},${f(y0 + n)}`,
        `A${f(n)},${f(n)} 0 0 0 ${f(x0 + n)},${f(y0)}`,
        'Z',
      ].join(' ');
      const inset = s * 0.12;
      return [
        h('path', { d, fill: on ? look.lit : (look.unlit ?? 'none') }),
        // The hinge, from the lower-left corner to the upper-right one.
        h('line', {
          x1: x0 + inset, y1: y1 - inset, x2: x1 - inset, y2: y0 + inset,
          stroke: on ? '#000000' : '#ffffff',
          'stroke-opacity': on ? '0.28' : '0.06',
          'stroke-width': s * 0.05,
        }),
        // The LED, in the notch at the lower-right corner.
        h('circle', {
          cx: x1 - n * 0.32,
          cy: y1 - n * 0.32,
          r: pitch * shape.ledRadius,
          fill: on && look.leds ? look.led : LED_OFF,
        }),
      ];
    },
    update: paint,
    visible: (on, look) => on || look.unlit !== null,
  };
}
