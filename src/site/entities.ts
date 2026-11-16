import type { CollectionName } from '@/lib/catalog';

/** How each grouping collection appears on the site: its URL segment, its facet, its strings. */
export const ENTITY_PAGES: Record<CollectionName, { segment: string; facet: string; strings: string; hasIndex: boolean }> = {
  manufacturers: { segment: 'fabricantes', facet: 'fabricante', strings: 'catalog.manufacturers', hasIndex: true },
  operators: { segment: 'operadores', facet: 'operador', strings: 'catalog.operators', hasIndex: true },
  technologies: { segment: 'tecnologias', facet: 'tecnologia', strings: 'catalog.technologies', hasIndex: true },
  families: { segment: 'familias', facet: 'familia', strings: 'catalog.families', hasIndex: false },
};
