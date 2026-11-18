import type { APIRoute } from 'astro';
import { getCatalog } from '@/site/catalog';
import { bannerPng, hasBanner } from '@/site/social';

// The picture social networks show when an entry is shared (see src/site/social.ts).
export async function getStaticPaths() {
  const catalog = await getCatalog();
  return catalog.models.filter(hasBanner).map((model) => ({ params: { id: model.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const png = await bannerPng((await getCatalog()).model(params.id!));
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
