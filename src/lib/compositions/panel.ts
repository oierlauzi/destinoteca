import { h, type VNode } from '../hardware';
import { cercaniasRoundel } from '../replicas/page-iberica-electromagneticos/parts';
import { adifLogo } from '../replicas/mp-electronics-adif/adif-logo';
import type { PanelMember } from './types';

/** Printed lettering: a grotesque, with capitals about 0.72 of the type size tall. */
export const PANEL_FONT = "Helvetica, Arial, 'Liberation Sans', sans-serif";
const CAP = 0.72;
/** Between two lines, as a fraction of the taller one's capitals. */
const LEADING = 0.55;
/** From the plate's edges to its lettering, as a fraction of the smaller side. */
const MARGIN = 0.08;

/** A printed plate, in the composition's centimetres. */
export function panelNodes(member: PanelMember): VNode[] {
  const { x, y, width, height, panel } = member;
  const margin = Math.min(width, height) * MARGIN;
  const nodes: VNode[] = [h('rect', { x, y, width, height, fill: panel.fill, ...(panel.edge ? { stroke: panel.edge, 'stroke-width': 0.6 } : {}) })];
  const gaps = panel.lines.slice(1).map((line, i) => Math.max(line.size, panel.lines[i]!.size) * LEADING);
  const block = panel.lines.reduce((sum, line) => sum + line.size, 0) + gaps.reduce((sum, gap) => sum + gap, 0);
  const valign = panel.valign ?? 'middle';
  let top = valign === 'top' ? y + margin : valign === 'bottom' ? y + height - margin - block : y + (height - block) / 2;
  panel.lines.forEach((line, i) => {
    const baseline = top + line.size;
    const align = line.align ?? 'center';
    const lx = align === 'left' ? x + margin : align === 'right' ? x + width - margin : x + width / 2;
    nodes.push(
      h('text', {
        x: lx,
        y: baseline,
        'font-family': PANEL_FONT,
        'font-size': Math.round((line.size / CAP) * 100) / 100,
        'font-weight': line.weight ?? 400,
        'text-anchor': align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle',
        ...(line.spacing ? { 'letter-spacing': line.spacing } : {}),
        fill: line.color ?? '#ffffff',
      }, [line.text]),
    );
    top = baseline + (gaps[i] ?? 0);
  });
  if (panel.logo) {
    const { kind, height: size, color, symbolColor } = panel.logo;
    const right = x + width - margin;
    const cy = y + height - margin - size / 2;
    nodes.push(kind === 'adif' ? adifLogo(right, cy, size, color ?? '#ffffff', symbolColor) : cercaniasRoundel(right - size / 2, cy, size / 2));
  }
  return nodes;
}
