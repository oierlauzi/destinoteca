import { h, num, type VNode } from '../../hardware';
import { INNER_RADIUS, OPENING_LINE, RADIUS } from './geometry';

/*
 * The box the display and the clock each sit in: a frame with rounded
 * corners, and an opening whose corners are rounded with it, concentric,
 * with a dark line running round where the frame meets the glass.
 */

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A rounded rectangle as a path, clockwise. */
export function roundedPath(box: Box, r: number): string {
  const radius = Math.max(0, Math.min(r, box.width / 2, box.height / 2));
  const { x, y, width: w, height: hgt } = box;
  return (
    `M${num(x + radius)} ${num(y)}H${num(x + w - radius)}A${num(radius)} ${num(radius)} 0 0 1 ${num(x + w)} ${num(y + radius)}` +
    `V${num(y + hgt - radius)}A${num(radius)} ${num(radius)} 0 0 1 ${num(x + w - radius)} ${num(y + hgt)}` +
    `H${num(x + radius)}A${num(radius)} ${num(radius)} 0 0 1 ${num(x)} ${num(y + hgt - radius)}` +
    `V${num(y + radius)}A${num(radius)} ${num(radius)} 0 0 1 ${num(x + radius)} ${num(y)}Z`
  );
}

/** The frame itself, behind everything. */
export function frameBack(box: Box, fill: string, edge: string): VNode {
  return h('rect', { x: 0.3, y: 0.3, width: box.width - 0.6, height: box.height - 0.6, rx: RADIUS, fill, stroke: edge, 'stroke-width': 0.6 });
}

/**
 * Drawn over the glass: the frame again, with the opening cut out of it, so
 * that the glass shows only through the rounded opening; and the dark line
 * round it.
 */
export function frameFront(box: Box, opening: Box, fill: string, edge: string, line: string): VNode[] {
  const outer = roundedPath({ x: 0.3, y: 0.3, width: box.width - 0.6, height: box.height - 0.6 }, RADIUS);
  return [
    h('path', { d: `${outer}${roundedPath(opening, INNER_RADIUS)}`, 'fill-rule': 'evenodd', fill, stroke: edge, 'stroke-width': 0.6 }),
    h('path', { d: roundedPath(opening, INNER_RADIUS), fill: 'none', stroke: line, 'stroke-width': OPENING_LINE }),
  ];
}
