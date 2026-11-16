import { decadesOf, type ModelFacts } from './facts';

/**
 * The single table of ways to slice the catalog. The filter on the catalog
 * page and every taxonomy page (/fabricantes/x/, /paises/es/...) are generated
 * from it, so a new organising axis is one field on the entry plus one row
 * here.
 */
export interface Facet {
  /** Also the query-string key on the catalog page. Never rename. */
  id: string;
  /** i18n key of its name. */
  label: string;
  /** The values one model has on this axis. */
  values(facts: ModelFacts, context: FacetContext): string[];
  /**
   * How a value gets its human name: from a collection entry, from the i18n
   * dictionary (`catalog.<vocabulary>.<value>`), or computed.
   */
  names: { from: 'collection'; collection: CollectionName } | { from: 'vocabulary'; vocabulary: string } | { from: 'country' } | { from: 'decade' };
  /** Site path of the page for one value, when the axis has pages of its own. */
  route?(value: string): string;
  /** Site path of the page listing every value. */
  index?: string;
}

export type CollectionName = 'manufacturers' | 'operators' | 'families' | 'technologies';

export interface FacetContext {
  currentYear: number;
}

export const FACETS: Facet[] = [
  {
    id: 'tipo',
    label: 'catalog.facet.kind',
    values: (m) => [m.kind],
    names: { from: 'vocabulary', vocabulary: 'kind' },
  },
  {
    id: 'tecnologia',
    label: 'catalog.facet.technology',
    values: (m) => m.technologies,
    names: { from: 'collection', collection: 'technologies' },
    route: (value) => `tecnologias/${value}/`,
    index: 'tecnologias/',
  },
  {
    id: 'fabricante',
    label: 'catalog.facet.manufacturer',
    values: (m) => m.manufacturers,
    names: { from: 'collection', collection: 'manufacturers' },
    route: (value) => `fabricantes/${value}/`,
    index: 'fabricantes/',
  },
  {
    id: 'operador',
    label: 'catalog.facet.operator',
    values: (m) => m.operators,
    names: { from: 'collection', collection: 'operators' },
    route: (value) => `operadores/${value}/`,
    index: 'operadores/',
  },
  {
    id: 'familia',
    label: 'catalog.facet.family',
    values: (m) => (m.family ? [m.family] : []),
    names: { from: 'collection', collection: 'families' },
    route: (value) => `familias/${value}/`,
  },
  {
    id: 'pais',
    label: 'catalog.facet.country',
    values: (m) => m.countries,
    names: { from: 'country' },
    route: (value) => `paises/${value}/`,
  },
  {
    id: 'modo',
    label: 'catalog.facet.mode',
    values: (m) => m.transportModes,
    names: { from: 'vocabulary', vocabulary: 'mode' },
  },
  {
    id: 'decada',
    label: 'catalog.facet.decade',
    values: (m, context) => decadesOf(m, context.currentYear).map(String),
    names: { from: 'decade' },
  },
  {
    id: 'estado',
    label: 'catalog.facet.status',
    values: (m) => [m.status],
    names: { from: 'vocabulary', vocabulary: 'status' },
  },
  {
    id: 'replica',
    label: 'catalog.facet.replica',
    values: (m) => [m.hasReplica ? 'si' : 'no'],
    names: { from: 'vocabulary', vocabulary: 'replica' },
  },
];

export function getFacet(id: string): Facet {
  const facet = FACETS.find((candidate) => candidate.id === id);
  if (!facet) throw new Error(`Unknown facet "${id}"`);
  return facet;
}

/** Every value in use on one axis, with how many models have it. */
export function countValues(facet: Facet, models: ModelFacts[], context: FacetContext): Map<string, number> {
  const counts = new Map<string, number>();
  for (const model of models) {
    for (const value of new Set(facet.values(model, context))) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

/** Whether a model passes a filter: every axis asked for must match one of the model's values. */
export function matches(model: ModelFacts, filter: Record<string, string>, context: FacetContext): boolean {
  return FACETS.every((facet) => {
    const wanted = filter[facet.id];
    return !wanted || facet.values(model, context).includes(wanted);
  });
}
