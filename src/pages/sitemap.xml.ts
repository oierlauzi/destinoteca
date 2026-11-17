import type { APIRoute } from 'astro';
import { FACETS } from '@/lib/catalog';
import { getCatalog } from '@/site/catalog';
import { MOVED_TO_BACKLOG } from '@/site/moved';
import { href } from '@/site/url';

/*
 * Every page a search engine should know, for /sitemap.xml: the fixed pages,
 * each entry, and each page an axis gives its values (families, makers,
 * operators, technologies, countries). Pages that only redirect (former ids,
 * entries moved to the backlog), embeds and posters are left out.
 */
const FIXED = ['', 'catalogo/', 'contribuir/', 'acerca/', 'pendientes/'];

export const GET: APIRoute = async ({ site }) => {
  const catalog = await getCatalog();
  const paths = new Set<string>(FIXED);
  for (const facet of FACETS) {
    if (facet.index) paths.add(facet.index);
    for (const value of catalog.facetValues(facet.id)) if (value.path) paths.add(value.path);
  }
  for (const model of catalog.models) paths.add(`catalogo/${model.id}/`);
  for (const id of Object.keys(MOVED_TO_BACKLOG)) paths.delete(`catalogo/${id}/`);

  const base = site ?? new URL('https://oierlauzi.github.io');
  const urls = [...paths].sort().map((path) => `  <url><loc>${new URL(href(path), base).href}</loc></url>`);
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', ...urls, '</urlset>', ''].join('\n');
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
