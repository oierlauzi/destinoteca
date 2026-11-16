import { h, type VNode } from '../../hardware';

/**
 * PAGE Ibérica's logo, as vectors: a globe whose eastern half is a white
 * oval set in a blue rectangle, and the wordmark "PAGE" in heavy extended
 * italics. Traced by hand from the company's logo, in the logo's own pixel
 * coordinates (mark 14–183 wide, 46–115 tall; letters 18 tall on the
 * baseline y = 144), so that it can be checked against it.
 *
 * It is only drawn as the makers' plate of the signs that carry one.
 */
export const PAGE_BLUE = '#000a76';

const CX = 78.5;
const CY = 80.5;
const RX = 64.5;
const RY = 34.2;
const TOP = CY - RY;
const BOTTOM = CY + RY;
/** The meridian that bounds the globe on the right: half an oval this wide. */
const EDGE = 20;
const LINE = 1.7;

/** Left half of an oval through the poles of the globe. */
const meridian = (rx: number): string => `M${CX},${TOP} A${rx},${RY} 0 0 0 ${CX},${BOTTOM}`;

/** The globe, the white oval and the rectangle around it. */
function mark(id: string): VNode[] {
  const globe = `M${CX},${TOP} A${RX},${RY} 0 0 0 ${CX},${BOTTOM} A${EDGE},${RY} 0 0 0 ${CX},${TOP} Z`;
  // Parallels run straight across the middle of the globe and bend towards the poles near its western edge.
  const upper = 68.3;
  const lower = 2 * CY - upper;
  const white = { fill: 'none', stroke: '#ffffff', 'stroke-width': LINE };
  return [
    h('rect', { x: 96, y: 46, width: 87.6, height: 68.6, fill: PAGE_BLUE }),
    h('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: '#ffffff' }),
    h('clipPath', { id }, [h('path', { d: globe })]),
    h('path', { d: globe, fill: PAGE_BLUE }),
    h('g', { 'clip-path': `url(#${id})`, ...white }, [
      h('path', { d: `M10,${CY} H110 M${CX},${TOP} V${BOTTOM}` }),
      h('path', { d: `${meridian(22)} ${meridian(42.5)}` }),
      h('path', { d: `M110,${upper} H58 Q42,${upper - 1.2} 26,${upper - 11.5} M110,${lower} H58 Q42,${lower + 1.2} 26,${lower + 11.5}` }),
    ]),
  ];
}

/** "PAGE", drawn upright and then slanted. */
function wordmark(): VNode {
  const letters = [
    // P
    'M16,144 V126 H47 Q52,126 52,131 Q52,136 47,136 H24 V144 Z M24,128.8 V133.8 H43 Q45,133.8 45,131.8 V130.8 Q45,128.8 43,128.8 Z',
    // A
    'M50,144 L65,126 H75 L92,144 H83 L79.2,140 H61.3 L58,144 Z M69.7,129.9 L76.4,137 H63.8 Z',
    // G
    'M133,131 V130 Q133,126 125,126 H98 Q90,126 90,133 V137 Q90,144 98,144 H125 Q133,144 133,137 V134.5 H113 V137.5 H125 V138 Q125,141.3 121,141.3 H102 Q98,141.3 98,137.5 V132.5 Q98,128.8 102,128.8 H121 Q125,128.8 125,131 Z',
    // E
    'M142,126 H179 V128.8 H150 V133.8 H168 V136.8 H150 V141.6 H179 V144 H142 Z',
  ];
  // The slant of the italics: 0.45 to the right for every unit up, pivoting on the baseline.
  return h('path', { d: letters.join(' '), fill: PAGE_BLUE, 'fill-rule': 'evenodd', transform: 'matrix(1,0,-0.45,1,64.8,0)' });
}

/**
 * The makers' plate of the Atocha Cercanías signs: a white strip with the
 * mark on the left and "PAGE" on its right, centred on (cx, cy) and `height`
 * tall. `id` must be unique in the document (it names a clip path).
 */
export function pageLogoPlate(cx: number, cy: number, height: number, id: string): VNode {
  // In logo units: letters 18 tall; on the plates the mark is as tall as
  // the letters, and the letters are a little narrower than in the artwork.
  const letter = 18;
  const condense = 0.85;
  const markScale = letter / 69;
  const markWidth = 169 * markScale;
  const gap = 20;
  const pad = 7;
  const wordWidth = (179 + 8.1 - 16) * condense;
  const width = pad + markWidth + gap + wordWidth + pad;
  const plateHeight = letter + 2 * 6.5;
  const scale = height / plateHeight;
  const markLeft = pad;
  const wordLeft = pad + markWidth + gap;
  return h('g', { transform: `translate(${cx - (width * scale) / 2},${cy - height / 2}) scale(${scale})` }, [
    h('rect', { x: 0, y: 0, width, height: plateHeight, rx: 2, fill: '#f2f2ee', stroke: '#8d8d88', 'stroke-width': 0.8 }),
    h('g', { transform: `translate(${markLeft - 14 * markScale},${plateHeight / 2 - CY * markScale}) scale(${markScale})` }, mark(id)),
    h('g', { transform: `translate(${wordLeft - 16 * condense},${plateHeight / 2 + letter / 2 - 144}) scale(${condense},1)` }, [wordmark()]),
  ]);
}

/** The whole logo as in the company's own artwork: the mark above the letters. For checking the tracing. */
export function pageLogo(id: string): VNode {
  return h('g', {}, [...mark(id), wordmark()]);
}
