import type { DotSkin } from '../dot-matrix';
import { h, num, type VNode } from '../svg';

export interface OctagonFlapLook {
  lit: string;
  /** Colour of the dark side, or null to leave unlit dots out. */
  unlit: string | null;
}

export interface OctagonFlapShape {
  /** Half the width of a flap, as a fraction of the pitch. */
  size: number;
  /** How much of each corner is cut, as a fraction of the half-width. */
  corner: number;
}

/**
 * An electromagnetic flap seen head-on: an octagonal disc with the fold line
 * across it where the two halves of the flap meet, as on the Telenorma
 * modules of the 1990s.
 */
export function octagonFlap(shape: OctagonFlapShape = { size: 4.3 / 11, corner: 0.5 }): DotSkin<OctagonFlapLook> {
  const paint = (elements: SVGElement[], on: boolean, look: OctagonFlapLook): void => {
    const [disc, fold] = elements;
    const hidden = !on && look.unlit === null;
    for (const element of elements) {
      if (hidden) element.setAttribute('display', 'none');
      else element.removeAttribute('display');
    }
    if (hidden) return;
    disc?.setAttribute('fill', on ? look.lit : (look.unlit ?? 'none'));
    fold?.setAttribute('stroke', on ? '#000000' : '#ffffff');
    fold?.setAttribute('stroke-opacity', on ? '0.32' : '0.07');
  };
  return {
    draw(x0: number, y0: number, pitch: number, on: boolean, look: OctagonFlapLook): VNode[] {
      const half = pitch * shape.size;
      const s = half * 2;
      const k = half * shape.corner;
      const x = x0 + pitch / 2 - half;
      const y = y0 + pitch / 2 - half;
      const points = [
        [x + k, y], [x + s - k, y], [x + s, y + k], [x + s, y + s - k],
        [x + s - k, y + s], [x + k, y + s], [x, y + s - k], [x, y + k],
      ]
        .map(([px, py]) => `${num(px!)},${num(py!)}`)
        .join(' ');
      const inset = (half * 0.4) / 4.3;
      return [
        h('polygon', { points, fill: on ? look.lit : (look.unlit ?? 'none') }),
        h('line', {
          x1: x + inset, y1: y + s - inset, x2: x + s - inset, y2: y + inset,
          stroke: on ? '#000000' : '#ffffff',
          'stroke-opacity': on ? '0.32' : '0.07',
          'stroke-width': (half * 0.7) / 4.3,
        }),
      ];
    },
    update: paint,
    visible: (on, look) => on || look.unlit !== null,
  };
}
