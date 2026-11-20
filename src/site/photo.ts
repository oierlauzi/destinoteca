import { getImage } from 'astro:assets';

/*
 * The largest rendition of a photograph the site serves: the thumbnail in the
 * gallery links to it, and the sitemap hands it to image search, so both must
 * ask for the same file. Capped so that a phone photo straight from the
 * camera does not become a multi-megabyte download.
 */
const FULL_WIDTH = 1800;

export const fullPhoto = (src: ImageMetadata) => getImage({ src, width: Math.min(src.width, FULL_WIDTH) });
