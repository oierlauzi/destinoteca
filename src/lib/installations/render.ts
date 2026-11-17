import { h, toString, type VNode } from '../hardware';
import { panelNodes } from './panel';
import type { Box, ResolvedInstallation } from './types';

const round = (n: number): string => String(Math.round(n * 100) / 100);

/**
 * One member's standalone SVG document, nested in the installation at `box`.
 * Its ids are prefixed so that several boards drawn with the same ids
 * (patterns, clip paths) do not take each other's.
 */
export function nestSvg(svg: string, prefix: string, box: Box): string {
  let inner = svg.slice(svg.indexOf('<svg'));
  inner = inner
    .replace(/\sid="([^"]+)"/g, ` id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${prefix}-$1"`);
  // The member's own size gives way to its place on the wall.
  return inner.replace(/^<svg([^>]*?)>/, (_, attrs: string) => {
    const kept = attrs.replace(/\s(width|height|x|y|xmlns(:\w+)?)="[^"]*"/g, '');
    return `<svg${kept} x="${round(box.x)}" y="${round(box.y)}" width="${round(box.width)}" height="${round(box.height)}">`;
  });
}

/** The wall and its printed panels, without the displays. */
export function wallNodes(installation: ResolvedInstallation): VNode[] {
  return [
    ...(installation.background ? [h('rect', { x: 0, y: 0, width: installation.width, height: installation.height, fill: installation.background })] : []),
    ...installation.members.flatMap((member) => (member.kind === 'panel' ? panelNodes(member) : [])),
  ];
}

/**
 * The whole installation as one standalone SVG file: the wall, its panels and
 * each display as drawn by its own replica (`drawn`, by member id).
 */
export function composeSvg(installation: ResolvedInstallation, drawn: Map<string, string>, title: string): string {
  const { width, height } = installation;
  const wall = wallNodes(installation).map((node) => toString(node)).join('');
  const displays = installation.members
    .filter((member) => member.kind === 'replica' && drawn.has(member.id))
    .map((member, i) => nestSvg(drawn.get(member.id)!, `m${i}`, member))
    .join('');
  const pixels = 1600;
  const head = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${pixels}" height="${round((pixels * height) / width)}" role="img">`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- destinoteca · ${title.replace(/--/g, '-')} · https://oierlauzi.github.io/destinoteca/ -->\n${head}${toString(h('title', {}, [title]))}${wall}${displays}</svg>\n`;
}
