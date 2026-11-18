import { h, type VNode } from '../../hardware';

/*
 * The NaviLens code fitted beside Metro Bilbao's signs: a white plate with a
 * black square on it, and inside the square a grid of five by five cells in
 * cyan, yellow, magenta and black. A phone reads aloud what the sign shows.
 * Each sign has its own code; the one drawn here is made up, the same on
 * every replica, and reads as nothing.
 */

/** The plate's side: about five characters' pitch, in proportion to the signs in photographs. */
export const PLATE = 35;

const COLORS = ['#6cc4ef', '#f3e23a', '#e6489a', '#141414'];
/** A made-up pattern: colours by index, row by row. */
const PATTERN = [
  [0, 1, 1, 2, 2],
  [0, 3, 2, 3, 2],
  [1, 0, 0, 1, 1],
  [3, 0, 2, 2, 0],
  [2, 2, 1, 1, 3],
];

/** The plate with its top-left corner at (x, y). */
export function navilensPlate(x: number, y: number, side = PLATE): VNode {
  const margin = side * 0.07;
  const black = side - 2 * margin;
  const cell = black / 7;
  const nodes: VNode[] = [
    h('rect', { x, y, width: side, height: side, rx: side * 0.03, fill: '#eeeeea', stroke: '#c9c9c4', 'stroke-width': 0.3 }),
    h('rect', { x: x + margin, y: y + margin, width: black, height: black, fill: COLORS[3] }),
  ];
  PATTERN.forEach((row, r) =>
    row.forEach((color, c) => {
      if (color === 3) return;
      nodes.push(h('rect', { x: x + margin + (c + 1) * cell, y: y + margin + (r + 1) * cell, width: cell + 0.04, height: cell + 0.04, fill: COLORS[color] }));
    }),
  );
  return h('g', {}, nodes);
}
