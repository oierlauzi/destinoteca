import type { APIRoute } from 'astro';
import { getCatalog } from '@/site/catalog';
import { compositionSvg } from '@/site/composition';
import { posterSvg } from '@/site/replica';

// One still image per entry that has a replica, drawn by the replica itself.
// Catalog cards show it; being a file of its own, it is cached and loaded
// lazily instead of weighing down every page that lists the entry.
export async function getStaticPaths() {
  const catalog = await getCatalog();
  return catalog.models.filter((model) => model.data.replica || model.data.composition).map((model) => ({ params: { id: model.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const catalog = await getCatalog();
  const model = catalog.model(params.id!);
  const { replica, composition } = model.data;
  const svg = composition ? await compositionSvg(catalog.composition(model), model.data.name) : await posterSvg(replica!.id, { ...replica!.params, ...replica!.poster });
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' } });
};
