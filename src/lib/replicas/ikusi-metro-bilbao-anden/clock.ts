import { h, num, type VNode } from '../../hardware';
import type { Angles } from '../festina-adif/render';

/*
 * The clock beside each sign: a black drum, and in it a very dark grey dial
 * lit from its edge, so that it brightens towards the rim, with the twelve
 * numerals in white, slender white hands and a thick red second hand with
 * a very short tail. In front, a glass with a ring of black vinyl round its
 * edge, and on it a white bar for every minute against its outer edge,
 * longer and a little wider at the hours. Lit, the dial often photographs
 * blue. Who made it is not known.
 */

const FONT = 'Helvetica, Arial, Liberation Sans, sans-serif';
const WHITE = '#f4f5f7';
const RED = '#d9262b';

export interface HandRefs {
  hour?: SVGElement;
  minute?: SVGElement;
  second?: SVGElement;
}

/** A hand pointing at 12, from `tail` behind the centre to `tip`, `width` wide at the root and tapering. */
function hand(cx: number, cy: number, r: number, tail: number, tip: number, width: number, taper: number, color: string): VNode {
  const w = (width * r) / 2;
  const t = (taper * r) / 2;
  const d = `M${num(cx - w)} ${num(cy + tail * r)}L${num(cx + w)} ${num(cy + tail * r)}L${num(cx + t)} ${num(cy - tip * r)}L${num(cx - t)} ${num(cy - tip * r)}Z`;
  return h('path', { d, fill: color });
}

export const rotate = (deg: number, cx: number, cy: number): string => `rotate(${num(deg)} ${num(cx)} ${num(cy)})`;

/** The clock centred on (cx, cy), `r` its outer radius. `id` names its gradients. */
export function clockNodes(cx: number, cy: number, r: number, a: Angles, id: string, refs?: HandRefs): VNode[] {
  const face = 0.95 * r;
  const opening = 0.78 * r;
  const nodes: VNode[] = [
    h('defs', {}, [
      // The dial, lit from its edge: darkest in the middle, brightening towards the rim under the vinyl.
      h('radialGradient', { id: `${id}-dial`, cx: 0.5, cy: 0.5, r: 0.5 }, [
        h('stop', { offset: 0, 'stop-color': '#2b2e32' }),
        h('stop', { offset: 0.55, 'stop-color': '#33363b' }),
        h('stop', { offset: 0.8, 'stop-color': '#555a62' }),
        h('stop', { offset: 0.86, 'stop-color': '#7a808a' }),
        h('stop', { offset: 1, 'stop-color': '#9aa0aa' }),
      ]),
      h('linearGradient', { id: `${id}-glass`, x1: 0, y1: 0, x2: 1, y2: 1 }, [
        h('stop', { offset: 0, 'stop-color': '#ffffff', 'stop-opacity': 0.1 }),
        h('stop', { offset: 0.45, 'stop-color': '#ffffff', 'stop-opacity': 0.02 }),
        h('stop', { offset: 1, 'stop-color': '#ffffff', 'stop-opacity': 0 }),
      ]),
    ]),
    // The drum, its rim, and the dial behind the glass.
    h('circle', { cx, cy, r, fill: '#121314' }),
    h('circle', { cx, cy, r: r - 0.35, fill: 'none', stroke: '#34363a', 'stroke-width': 0.5 }),
    h('circle', { cx, cy, r: face, fill: `url(#${id}-dial)` }),
  ];
  for (let hourNumber = 1; hourNumber <= 12; hourNumber++) {
    const angle = (hourNumber * Math.PI) / 6;
    const at = 0.6 * r;
    nodes.push(
      h('text', { x: num(cx + at * Math.sin(angle)), y: num(cy - at * Math.cos(angle)), 'font-size': num(0.17 * r), 'font-family': FONT, 'font-weight': 500, fill: WHITE, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, [String(hourNumber)]),
    );
  }
  const ref = (key: keyof HandRefs) => (refs ? (element: SVGElement) => (refs[key] = element) : undefined);
  nodes.push(
    h('g', { transform: rotate(a.hour, cx, cy) }, [hand(cx, cy, r, 0.12, 0.45, 0.07, 0.04, WHITE)], ref('hour')),
    h('g', { transform: rotate(a.minute, cx, cy) }, [hand(cx, cy, r, 0.14, 0.7, 0.055, 0.025, WHITE)], ref('minute')),
    h('g', { transform: rotate(a.second, cx, cy) }, [hand(cx, cy, r, 0.07, 0.74, 0.032, 0.024, RED)], ref('second')),
    // The glass in front: a ring of black vinyl round its edge, with the minutes on it in white.
    h('path', {
      d: `M${num(cx - face)} ${num(cy)}a${num(face)} ${num(face)} 0 1 0 ${num(2 * face)} 0a${num(face)} ${num(face)} 0 1 0 ${num(-2 * face)} 0zM${num(cx - opening)} ${num(cy)}a${num(opening)} ${num(opening)} 0 1 0 ${num(2 * opening)} 0a${num(opening)} ${num(opening)} 0 1 0 ${num(-2 * opening)} 0z`,
      fill: '#070708',
      'fill-rule': 'evenodd',
    }),
  );
  for (let minute = 0; minute < 60; minute++) {
    const hour = minute % 5 === 0;
    const width = (hour ? 0.027 : 0.014) * r;
    // Tight against the outer edge of the vinyl, growing inwards.
    const to = face - 0.006 * r;
    const from = to - (hour ? 0.13 : 0.075) * r;
    nodes.push(h('rect', { x: cx - width / 2, y: cy - to, width, height: to - from, fill: WHITE, transform: rotate(minute * 6, cx, cy) }));
  }
  nodes.push(h('circle', { cx, cy, r: face, fill: `url(#${id}-glass)` }));
  return nodes;
}
