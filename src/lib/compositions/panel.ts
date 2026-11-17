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

/**
 * Letters cut from brushed aluminium: a metallic sheen from top to bottom of
 * the letters, and fine horizontal grain over it.
 */
function brushedAluminium(id: string, top: number, bottom: number): { defs: VNode; fill: string; filter: string } {
  const gradient = `${id}-aluminio`;
  const grain = `${id}-veta`;
  const stops: [number, string][] = [[0, '#eef0f2'], [0.3, '#b9bec3'], [0.52, '#dde0e3'], [0.78, '#9aa0a6'], [1, '#c8ccd0']];
  return {
    defs: h('defs', {}, [
      h('linearGradient', { id: gradient, gradientUnits: 'userSpaceOnUse', x1: 0, y1: top, x2: 0, y2: bottom }, stops.map(([offset, color]) => h('stop', { offset, 'stop-color': color }))),
      h('filter', { id: grain, x: 0, y: 0, width: 1, height: 1 }, [
        h('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.004 0.9', numOctaves: 2, seed: 7, result: 'noise' }),
        h('feColorMatrix', { in: 'noise', type: 'matrix', values: '0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0.45 0.45 0.45 0 -0.34', result: 'streaks' }),
        h('feComposite', { in: 'streaks', in2: 'SourceGraphic', operator: 'in', result: 'grain' }),
        h('feBlend', { in: 'grain', in2: 'SourceGraphic', mode: 'multiply' }),
      ]),
    ]),
    fill: `url(#${gradient})`,
    filter: `url(#${grain})`,
  };
}

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
    const metal = line.finish === 'brushed-aluminium' ? brushedAluminium(`${member.id}-${i}`, baseline - line.size, baseline) : undefined;
    if (metal) nodes.push(metal.defs);
    nodes.push(
      h('text', {
        x: lx,
        y: baseline,
        'font-family': PANEL_FONT,
        'font-size': Math.round((line.size / CAP) * 100) / 100,
        'font-weight': line.weight ?? 400,
        'text-anchor': align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle',
        ...(line.spacing ? { 'letter-spacing': line.spacing } : {}),
        // Spread to the plate's width whatever the font: only the spaces between letters grow.
        ...(line.stretch ? { textLength: Math.round((width - 2 * margin) * 100) / 100, lengthAdjust: 'spacing' } : {}),
        fill: metal?.fill ?? line.color ?? '#ffffff',
        ...(metal ? { filter: metal.filter, stroke: '#7e848a', 'stroke-width': 0.25 } : {}),
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
