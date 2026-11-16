import { defaults } from '@/lib/params';
import { RAW, readConfig } from '@/lib/player/config';
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

/**
 * A replica showing a chosen frame, as a standalone SVG file: the picture of
 * an entry on catalog cards. `params` are a hand-typed frame and appearance by
 * URL key, exactly as in an embed URL; without any, the replica's own default
 * frame is shown.
 */
export async function posterSvg(replicaId: string, params: Record<string, string | number | boolean> = {}): Promise<string> {
  const def = getReplica(replicaId);
  if (!def) return '';
  const impl = await def.load();
  const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
  query.set('source', RAW);
  const config = readConfig(def, query);
  return impl.renderToString(config.frame, config.options);
}
