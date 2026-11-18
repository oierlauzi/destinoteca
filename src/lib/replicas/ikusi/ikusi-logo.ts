import { h, type VNode } from '../../hardware';

/*
 * Ikusi's logo: a disc of bars that turn into diagonals, and the word IKUSI.
 * Traced from the company's artwork into vector paths, in that artwork's own
 * units (410 × 150, the disc 130 across on the left).
 */
const SYMBOL = [
  'M77.0 11.8L80.3 12.0L80.9 13.0L79.5 15.0L35.0 56.5L30.0 60.2L3.9 60.0L3.5 58.0L4.7 54.0L11.0 41.9L45.0 41.2Z',
  'M50.0 12.8L52.0 12.7L52.2 14.0L30.0 34.2L17.5 34.0L18.5 32.0L25.0 25.5L33.0 19.7L41.0 15.7Z',
  'M97.0 19.6L99.0 19.3L102.0 20.7L109.4 26.0L115.5 32.0L116.0 34.0L86.0 34.8L32.0 85.2L1.9 85.0L1.5 69.0L3.0 66.8L46.0 66.2L51.0 62.5L78.0 36.5Z',
  'M101.0 41.8L122.0 41.8L124.3 44.0L127.3 50.0L130.2 58.0L129.3 60.0L87.0 60.8L81.0 65.5L32.0 111.2L10.9 111.0L5.7 101.0L3.7 95.0L4.0 92.9L47.0 92.2Z',
  'M103.0 66.8L131.0 66.8L132.5 69.0L132.0 85.1L88.0 85.8L37.0 133.2L34.0 133.3L29.0 130.3L17.6 120.0L17.5 119.0L19.0 118.5L47.0 118.2L98.0 70.5Z',
  'M103.0 92.8L130.0 93.0L126.3 105.0L122.3 111.0L88.0 111.8L61.4 137.0L56.0 141.2L53.4 140.0L65.0 127.5Z',
  'M103.0 118.8L115.0 118.7L115.6 120.0L113.5 123.0L100.0 133.3L92.0 137.3L82.0 139.8L81.8 139.0L84.5 136.0Z',
].join('');

const WORD = [
  'M160.0 41.9L177.0 41.5L178.5 43.0L178.5 105.0L178.1 107.0L177.0 107.5L161.0 107.5L159.5 106.0Z',
  'M192.0 41.9L210.0 41.9L210.5 52.0L212.0 53.9L218.4 51.0L229.0 41.5L249.1 42.0L249.2 44.0L245.0 50.4L232.1 64.0L240.3 74.0L245.3 83.0L250.3 96.0L252.5 105.0L252.0 107.1L233.7 107.0L230.3 98.0L224.3 86.0L216.0 74.6L214.0 73.6L212.0 74.5L210.5 77.0L210.1 107.0L191.9 107.0Z',
  'M262.0 41.8L280.1 42.0L280.5 85.0L281.7 88.0L284.0 90.5L289.0 92.5L294.3 91.0L297.3 88.0L298.5 85.0L298.9 42.0L317.1 42.0L317.5 90.0L314.3 98.0L308.4 104.0L297.0 108.5L282.0 108.5L277.0 107.3L271.0 104.3L265.0 98.4L261.7 92.0L260.5 85.0L260.5 44.0Z',
  'M346.0 41.7L370.0 41.5L372.2 43.0L372.5 55.0L371.3 57.0L352.0 57.5L350.0 58.7L349.6 60.0L351.0 63.1L364.0 73.5L370.3 80.0L372.2 83.0L373.5 88.0L373.3 94.0L370.5 100.0L366.4 104.0L362.0 106.3L357.0 107.5L328.0 107.5L326.9 107.0L326.5 105.0L326.5 93.0L327.7 91.0L350.0 90.5L352.2 89.0L352.2 87.0L348.0 82.5L332.5 70.0L328.7 64.0L327.5 59.0L328.7 53.0L332.6 47.0L341.0 42.7Z',
  'M385.0 41.9L402.0 41.5L403.5 43.0L403.5 105.0L403.1 107.0L402.0 107.5L386.0 107.5L384.5 106.0Z',
].join('');

const ART = { width: 410, height: 150 };
/** The disc's green. */
export const IKUSI_GREEN = '#06ab54';

/**
 * The logo with its top-left corner at (x, y), `height` tall. In one colour
 * it is a plate's mark (the bars are gaps); with `symbol` the disc takes its
 * own green.
 */
export function ikusiLogo(x: number, y: number, height: number, color: string, symbol = color): VNode {
  const scale = height / ART.height;
  return h('g', { transform: `translate(${x},${y}) scale(${scale})` }, [
    h('path', { d: SYMBOL, fill: symbol, 'fill-rule': 'evenodd' }),
    h('path', { d: WORD, fill: color, 'fill-rule': 'evenodd' }),
  ]);
}

/** How wide the logo is at this height. */
export const ikusiLogoWidth = (height: number): number => (ART.width * height) / ART.height;
