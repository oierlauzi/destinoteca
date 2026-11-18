import { CM, DOTS_TOP, LED_HEIGHT, LINE_HEIGHT, MIN_GAP, ROW_HEIGHT, dotsInUnit, lineWidth, unitWidth } from '../page-iberica-electromagneticos/dimensions';

/**
 * Where everything goes on a concourse board of `lines` lines, in the units
 * of the platform sign's drawing (its flaps, LEDs and legends are the same
 * parts). Margins follow the platform sign; the header is estimated from
 * photographs taken at an angle.
 *
 * Each line is taken to be a unit built like the platform sign's PI-T100-M,
 * which was measured, with 20 characters instead of 16 and a longer tube:
 * the same height, the same characters, the same 9 cm from the ends of the
 * unit to the characters and 4 cm to the reflector. The tube under each line
 * is why the lines are far apart. Like that unit on the platform sign, each
 * one fills the panel between its black edges, from one hairline to the next.
 */
export const CELLS = 20;
/**
 * The tube under each line, in centimetres: what is left of the unit once
 * the 4 cm at each end and the sockets are taken off, which makes the unit
 * 197 cm. Photographs show it reaching a little past the first and last
 * characters, as this does. It is not a standard length, and it has not
 * been measured.
 */
const TUBE = 186;
/** The LED row, as long as the tubes, as on the platform sign. Centred, like them. */
const LED_WIDTH = TUBE * CM;
/** From the edge of the housing to the inner panel. */
const FRAME = { side: 7.7189846, top: 6.7270778, bottom: 6.6713 };
/** The panel's black edge, half of it inside the panel. */
const PANEL_EDGE = 1.5;
/** LED row to the bottom of the panel, as on the platform sign. */
const LED_BOTTOM = 7.6;
/** Measured against the height of a line of characters in photographs of the boards at Tres Cantos and Cantoblanco. */
const HEADER_HEIGHT = 25.5;
const LED_AFTER_DIVIDER = 3.65318;

export interface BoardGeometry {
  width: number;
  height: number;
  panel: { x: number; y: number; width: number; height: number };
  /** The line units: their left edge and width, and the top of each. */
  units: { x: number; width: number; tops: number[] };
  /** Left edge of the flip-dot lines. */
  linesX: number;
  /** Top of each line. */
  lineTops: number[];
  lineGap: number;
  /** Horizontal rules: under the header, between lines, above the LED row. */
  dividers: number[];
  led: { x: number; y: number; width: number };
  headerTop: number;
  headerBottom: number;
  minX: number;
}

export function boardGeometry(lines: number): BoardGeometry {
  const unit = unitWidth(TUBE);
  const panelWidth = unit + PANEL_EDGE * 2;
  const width = panelWidth + FRAME.side * 2;
  const panelX = FRAME.side;
  const panelY = FRAME.top;
  const ledX = panelX + (panelWidth - LED_WIDTH) / 2;
  // The lines' flaps are centred in their unit, and so over the LED row;
  // the "min." beside them sticks out to the right, as in the photographs.
  const unitX = panelX + PANEL_EDGE;
  const linesX = unitX + dotsInUnit(CELLS, TUBE);
  const headerBottom = panelY + HEADER_HEIGHT;
  const tops = Array.from({ length: lines }, (_, i) => headerBottom + i * ROW_HEIGHT);
  const lineTops = tops.map((top) => top + DOTS_TOP);
  const dividers = [headerBottom, ...tops.map((top) => top + ROW_HEIGHT)];
  const ledY = dividers[dividers.length - 1]! + LED_AFTER_DIVIDER;
  const panelHeight = ledY + LED_HEIGHT + LED_BOTTOM - panelY;
  return {
    width,
    height: panelY + panelHeight + FRAME.bottom,
    panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
    units: { x: unitX, width: unit, tops },
    linesX,
    lineTops,
    lineGap: ROW_HEIGHT - LINE_HEIGHT,
    dividers,
    led: { x: ledX, y: ledY, width: LED_WIDTH },
    headerTop: panelY,
    headerBottom,
    minX: linesX + lineWidth(CELLS) + MIN_GAP,
  };
}
