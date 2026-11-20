import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { FACETS } from '@/lib/catalog';
import { getCatalog } from '@/site/catalog';
import { MOVED_TO_BACKLOG } from '@/site/moved';
import { fullPhoto } from '@/site/photo';
import { hasPoster, posterHref } from '@/site/poster';
import { href } from '@/site/url';

/*
 * Every page a search engine should know, for /sitemap.xml: the fixed pages,
 * each entry, and each page an axis gives its values (families, makers,
 * operators, technologies, countries). Pages that only redirect (former ids,
 * entries moved to the backlog), embeds and posters are left out.
 *
 * Each entry also carries its pictures, so that image search finds them and
 * shows them with the page that documents them: its photographs, at the
 * largest rendition the site serves, and its poster. The replica on the page
 * is SVG written into the HTML, which leaves a crawler no file to index, so
 * the poster — the same drawing as a file, the one the cards show — is what
 * stands for it. Only <image:loc> is given: Google dropped the caption,
 * title, licence and location tags in 2022, and reads the caption and the
 * credit off the page itself.
 */
const FIXED = ['', 'catalogo/', 'contribuir/', 'acerca/', 'pendientes/'];

/** The pictures of a page of running text live beside it, in src/texts/<locale>/<name>/. */
const TEXT_IMAGES = import.meta.glob<ImageMetadata>('../texts/*/*/*.{jpg,jpeg,png,webp,avif}', { eager: true, import: 'default' });

const escaped = (url: URL): string => url.href.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = async ({ site }) => {
  const catalog = await getCatalog();
  const paths = new Set<string>(FIXED);
  const pictures = new Map<string, string[]>();
  for (const facet of FACETS) {
    if (facet.index) paths.add(facet.index);
    for (const value of catalog.facetValues(facet.id)) if (value.path) paths.add(value.path);
  }
  for (const model of catalog.models) {
    const path = `catalogo/${model.id}/`;
    paths.add(path);
    const photos = await Promise.all(catalog.photos(model).map((photo) => fullPhoto(photo.src)));
    pictures.set(path, [...(hasPoster(model) ? [await posterHref(model)] : []), ...photos.map((photo) => photo.src)]);
  }
  for (const id of Object.keys(MOVED_TO_BACKLOG)) {
    paths.delete(`catalogo/${id}/`);
    pictures.delete(`catalogo/${id}/`);
  }
  for (const [file, image] of Object.entries(TEXT_IMAGES)) {
    const path = `${file.split('/').at(-2)}/`;
    if (!paths.has(path)) continue;
    // Markdown renders them whole, so the sitemap names that same rendition.
    pictures.set(path, [...(pictures.get(path) ?? []), (await getImage({ src: image })).src]);
  }

  const base = site ?? new URL('https://oierlauzi.github.io');
  const urls = [...paths].sort().map((path) => {
    const loc = `<loc>${escaped(new URL(href(path), base))}</loc>`;
    const images = (pictures.get(path) ?? []).map((src) => `    <image:image><image:loc>${escaped(new URL(src, base))}</image:loc></image:image>`);
    return images.length === 0 ? `  <url>${loc}</url>` : [`  <url>${loc}`, ...images, '  </url>'].join('\n');
  });
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
