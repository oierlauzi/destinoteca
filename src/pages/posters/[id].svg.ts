import type { APIRoute } from 'astro';
import { getCatalog } from '@/site/catalog';
import { hasPoster, posterSvg } from '@/site/poster';

// One still image per entry that has a replica or is an installation, drawn by
// the replicas themselves. Catalog cards show it, at an address that changes
// with the picture (see src/site/poster.ts); being a file of its own, it is
// cached and loaded lazily instead of weighing down every page that lists it.
export async function getStaticPaths() {
  const catalog = await getCatalog();
  return catalog.models.filter(hasPoster).map((model) => ({ params: { id: model.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const svg = await posterSvg((await getCatalog()).model(params.id!));
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
