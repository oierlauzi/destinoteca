import { createHash } from 'node:crypto';
import { getCatalog, type Model } from '@/site/catalog';
import { installationSvg } from '@/site/installation';
import { posterSvg as replicaPoster } from '@/site/replica';
import { href } from '@/site/url';

/*
 * The picture of an entry on archive cards: drawn by its replica, or by its
 * elements for an installation. Each is drawn once per build, and its address
 * carries a fingerprint of the drawing, so that a browser keeping an old
 * copy fetches the new one as soon as it changes, and keeps it otherwise.
 */
const drawn = new Map<string, Promise<string>>();

export const hasPoster = (model: Model): boolean => model.data.replica !== undefined || model.data.installation !== undefined;

export function posterSvg(model: Model): Promise<string> {
  let svg = drawn.get(model.id);
  if (!svg) {
    svg = (async () => {
      const { replica, installation } = model.data;
      if (installation) return installationSvg((await getCatalog()).installation(model), model.data.name);
      if (replica) return replicaPoster(replica.id, { ...replica.params, ...replica.poster });
      throw new Error(`"${model.id}" has nothing to draw a picture with`);
    })();
    drawn.set(model.id, svg);
  }
  return svg;
}

/** The address of an entry's picture, with the fingerprint of what it shows. */
export async function posterHref(model: Model): Promise<string> {
  const version = createHash('sha1').update(await posterSvg(model)).digest('hex').slice(0, 10);
  return `${href(`posters/${model.id}.svg`).replace(/\/$/, '')}?v=${version}`;
}
