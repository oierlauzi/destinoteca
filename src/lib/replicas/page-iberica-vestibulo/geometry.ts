import { LED_HEIGHT, LINE_HEIGHT, MIN_GAP, MIN_WIDTH, lineWidth } from '../page-iberica-electromagneticos/dimensions';

/**
 * Where everything goes on a concourse board of `lines` lines, in the units
 * of the platform sign's drawing (its flaps, LEDs and legends are the same
 * parts). Margins follow the platform sign; the header and the spacing of
 * the lines are estimated from photographs taken at an angle.
 */
export const CELLS = 20;
/** From the edge of the housing to the inner panel. */
const FRAME = { side: 7.7189846, top: 6.7270778, bottom: 6.6713 };
/** The LED row is a little wider than the flip-dot lines, as in the photographs. */
const LED_WIDTH = 197;
/** Inner panel edge to the LED row, and LED row to the bottom of the panel, as on the platform sign. */
const LED_MARGIN = { side: 8, bottom: 7.6 };
const HEADER_HEIGHT = 17.27;
/** Clear space between two lines, and from a divider to the LED row. */
const LINE_GAP = 5.6;
const LED_AFTER_DIVIDER = 3.65318;

export interface BoardGeometry {
  width: number;
  height: number;
  panel: { x: number; y: number; width: number; height: number };
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
  const panelWidth = LED_WIDTH + LED_MARGIN.side * 2;
  const width = panelWidth + FRAME.side * 2;
  const panelX = FRAME.side;
  const panelY = FRAME.top;
  const ledX = panelX + LED_MARGIN.side;
  // The lines and the "min." beside them are centred over the LED row.
  const block = lineWidth(CELLS) + MIN_GAP + MIN_WIDTH;
  const linesX = ledX + (LED_WIDTH - block) / 2;
  const headerBottom = panelY + HEADER_HEIGHT;
  const firstTop = headerBottom + LINE_GAP / 2 + 1.6;
  const lineTops = Array.from({ length: lines }, (_, i) => firstTop + i * (LINE_HEIGHT + LINE_GAP));
  const dividers = [headerBottom, ...lineTops.map((top) => top + LINE_HEIGHT + LINE_GAP / 2)];
  const ledY = dividers[dividers.length - 1]! + LED_AFTER_DIVIDER;
  const panelHeight = ledY + LED_HEIGHT + LED_MARGIN.bottom - panelY;
  return {
    width,
    height: panelY + panelHeight + FRAME.bottom,
    panel: { x: panelX, y: panelY, width: panelWidth, height: panelHeight },
    linesX,
    lineTops,
    lineGap: LINE_GAP,
    dividers,
    led: { x: ledX, y: ledY, width: LED_WIDTH },
    headerTop: panelY,
    headerBottom,
    minX: linesX + lineWidth(CELLS) + MIN_GAP,
  };
}
