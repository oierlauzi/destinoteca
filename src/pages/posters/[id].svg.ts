import type { APIRoute } from 'astro';
import { getCatalog } from '@/site/catalog';
import { posterSvg } from '@/site/replica';

// One still image per entry that has a replica, drawn by the replica itself.
// Catalog cards show it; being a file of its own, it is cached and loaded
// lazily instead of weighing down every page that lists the entry.
export async function getStaticPaths() {
  const catalog = await getCatalog();
  return catalog.models.filter((model) => model.data.replica).map((model) => ({ params: { id: model.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const replica = (await getCatalog()).model(params.id!).data.replica!;
  return new Response(await posterSvg(replica.id, replica.poster), { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
