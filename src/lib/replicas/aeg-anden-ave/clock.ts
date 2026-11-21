import { h, num, type VNode } from '../../hardware';
import { BEZEL, CLOCK_HEIGHT, CLOCK_WIDTH, INNER_RADIUS, OPENING_LINE } from './geometry';
import { frameBack } from './frame';

/*
 * The clock that hung with the display: its own box, a little wider than it
 * is tall, with the same frame and the same margin around the glass. The
 * face carries no numbers — the minutes are short strokes and the hours
 * longer, thicker ones. Of the two hands, the minute one is a thin flat bar and the hour
 * one a wider bar closing to a point. No photograph shows a second hand.
 */

/** The face, inside the frame: a pale sheet, the tone of the panel's grooves, with a round clock on it. */
export const DIAL = { x: BEZEL, y: BEZEL, width: CLOCK_WIDTH - 2 * BEZEL, height: CLOCK_HEIGHT - 2 * BEZEL };

const CENTRE = { x: DIAL.x + DIAL.width / 2, y: DIAL.y + DIAL.height / 2 };
/** The marks ring the middle of the face, as wide as the face is tall allows. */
const RING = Math.min(DIAL.width, DIAL.height) * 0.42;

function mark(i: number, ink: string): VNode {
  const hour = i % 5 === 0;
  const angle = (i / 60) * Math.PI * 2;
  const sin = Math.sin(angle);
  const cos = -Math.cos(angle);
  const outer = { x: CENTRE.x + sin * RING, y: CENTRE.y + cos * RING };
  // The minutes are short strokes, not dots; the hours are longer and thicker.
  const reach = hour ? 0.76 : 0.92;
  const inner = { x: CENTRE.x + sin * RING * reach, y: CENTRE.y + cos * RING * reach };
  return h('path', {
    d: `M${num(inner.x)} ${num(inner.y)}L${num(outer.x)} ${num(outer.y)}`,
    stroke: ink,
    'stroke-width': hour ? 1.6 : 0.6,
    'stroke-linecap': 'butt',
  });
}

/** A hand drawn pointing at twelve and turned to where it belongs. */
function turned(d: string, angle: number, ink: string): VNode {
  return h('path', { d, fill: ink, transform: `rotate(${num(angle)} ${num(CENTRE.x)} ${num(CENTRE.y)})` });
}

/** The minute hand: a thin flat bar, square at both ends. */
function minuteHand(angle: number, length: number, width: number, ink: string): VNode {
  const tip = CENTRE.y - RING * length;
  const back = CENTRE.y + 2.2;
  const half = width / 2;
  return turned(
    `M${num(CENTRE.x - half)} ${num(back)}L${num(CENTRE.x + half)} ${num(back)}L${num(CENTRE.x + half)} ${num(tip)}L${num(CENTRE.x - half)} ${num(tip)}Z`,
    angle,
    ink,
  );
}

/** The hour hand: a wider bar that closes to a point at its end. */
function hourHand(angle: number, length: number, width: number, ink: string): VNode {
  const tip = CENTRE.y - RING * length;
  const back = CENTRE.y + 2.2;
  const half = width / 2;
  const shoulder = tip + width * 1.6;
  return turned(
    `M${num(CENTRE.x - half)} ${num(back)}L${num(CENTRE.x + half)} ${num(back)}L${num(CENTRE.x + half)} ${num(shoulder)}` +
      `L${num(CENTRE.x)} ${num(tip)}L${num(CENTRE.x - half)} ${num(shoulder)}Z`,
    angle,
    ink,
  );
}

/** The hands for a time of day written «HH:MM»; nothing when it cannot be read. */
export function handAngles(time: string): { hour: number; minute: number } | undefined {
  const match = /^\s*(\d{1,2})[:.h ]?(\d{2})\s*$/.exec(time ?? '');
  if (!match) return undefined;
  const hours = Number(match[1]) % 12;
  const minutes = Number(match[2]) % 60;
  return { hour: (hours + minutes / 60) * 30, minute: minutes * 6 };
}

/** The clock's box, drawn from its own top-left corner. */
export function clockBox(time: string, colours: { frame: string; edge: string; face: string; ink: string; line: string }): VNode[] {
  const at = handAngles(time);
  return [
    frameBack({ x: 0, y: 0, width: CLOCK_WIDTH, height: CLOCK_HEIGHT }, colours.frame, colours.edge),
    h('rect', { ...DIAL, rx: INNER_RADIUS, fill: colours.face, stroke: colours.line, 'stroke-width': OPENING_LINE }),
    ...Array.from({ length: 60 }, (_, i) => mark(i, colours.ink)),
    ...(at ? [hourHand(at.hour, 0.62, 2.8, colours.ink), minuteHand(at.minute, 0.96, 1.2, colours.ink)] : []),
    h('circle', { cx: CENTRE.x, cy: CENTRE.y, r: 1.2, fill: colours.ink }),
  ];
}
