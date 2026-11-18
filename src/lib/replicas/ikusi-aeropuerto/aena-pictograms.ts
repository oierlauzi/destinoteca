import { h, type VNode } from '../../hardware';

/*
 * Aena's pictograms for departures and arrivals, as printed in the headers
 * of the boards: a black aeroplane and a bar on a yellow square with
 * rounded corners. Traced into vector paths from frontal photographs of the
 * boards and checked against Aena's chart of pictograms, in units of 100
 * across the square.
 */
const DEPARTURES = [
  'M27.9 14.3L32.9 15.5L61.1 31.7L64.8 31.4L87.8 19.6L93 22.8L93.8 26.8L91.2 30.6L74.9 40L25 65.9L15.1 57L11.4 51.3L15.7 48.6L29.4 51.1L42.4 43.3L41.6 40.4L21.4 20.6L22.5 17.3Z',
  'M9.5 84.2L53.5 84.2L53.5 90.8L9.5 90.8Z',
].join('');

/** The aeroplane comes down to the right with its wheels out, over a bar on the right. */
const ARRIVALS = [
  'M40.9 11.9L49.2 14.1L58.6 46.2L62.5 49.4L86.3 56L89.3 60.3L87.6 64.5L79.6 66.1L44.4 57.2L10.7 47.7L9.1 43.6L9.2 32.2L12.2 27.8L16 29.4L23.8 39.5L34.4 41.9L38.6 40.4L40 29.4L39.2 14.1Z',
  'M48.3 83.6L91.6 83.6L91.6 90.2L48.3 90.2Z',
].join('');
const WHEELS = [
  { cx: 50.2, cy: 64.6 },
  { cx: 56.6, cy: 66.4 },
];

/** Aena's yellow. */
export const AENA_YELLOW = '#f6c400';

/** The pictogram with its top-left corner at (x, y), `size` across, the aeroplane in `ink`. */
export function aenaPictogram(kind: 'departures' | 'arrivals', x: number, y: number, size: number, ink: string): VNode {
  const scale = size / 100;
  return h('g', { transform: `translate(${x},${y}) scale(${scale})` }, [
    h('rect', { x: 0, y: 0, width: 100, height: 100, rx: 9, fill: AENA_YELLOW }),
    h('path', { d: kind === 'arrivals' ? ARRIVALS : DEPARTURES, fill: ink }),
    ...(kind === 'arrivals' ? WHEELS.map((wheel) => h('circle', { ...wheel, r: 2.1, fill: ink })) : []),
  ]);
}
