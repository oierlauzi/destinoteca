import { defaults } from '@/lib/params';
import { getReplica } from '@/lib/replicas/registry';

/**
 * A replica drawn at build time, dark, to stand in the page until its code
 * arrives: the layout does not jump, and without JavaScript there is still a
 * sign to look at. Returns markup safe to inline (it is our own renderer's).
 */
export async function restingSvg(replicaId: string): Promise<string> {
  const def = getReplica(replicaId);
  if (!def) return '';
  const impl = await def.load();
  const options = defaults(def.options);
  const view = { now: 0, timeZone: 'Europe/Madrid', services: [], total: 0, notices: [], placement: { platforms: [], cycle: true } };
  const svg = impl.renderToString(impl.blank(view, options), options);
  // Inline SVG wants neither the XML prolog nor a fixed size.
  return svg
    .slice(svg.indexOf('<svg'))
    .replace(/^<svg([^>]*?)\swidth="[^"]*"\sheight="[^"]*"/, '<svg$1 width="100%"');
}
