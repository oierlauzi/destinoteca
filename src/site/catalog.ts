import { getCollection, type CollectionEntry } from 'astro:content';
import { t } from '@/i18n';
import {
  FACETS,
  collisions,
  countValues,
  getFacet,
  modelProblems,
  photoProblems,
  type CollectionName,
  type Facet,
  type FacetContext,
  type ModelFacts,
} from '@/lib/catalog';
import { resolveComposition } from '@/lib/compositions/layout';
import type { EntryInput, ResolvedComposition } from '@/lib/compositions/types';
import { getReplica } from '@/lib/replicas/registry';
import { isReplicaId } from '@/lib/replicas/ids';
import { MOVED_TO_BACKLOG } from '@/site/moved';

/*
 * The one door to the catalog. Pages never call `astro:content` themselves:
 * they ask here, and anything they ask for either exists or the build stops.
 *
 * Astro validates each file's shape but not the catalog as a whole (a
 * reference to an entry that does not exist is silently `undefined`), so the
 * whole-catalog rules live here: dangling references, id and alias
 * collisions, replicas that do not exist, and what an `article` must have.
 * Every problem is collected and reported at once, by file.
 */

export type Model = CollectionEntry<'models'>;
export type Family = CollectionEntry<'families'>;
export type Manufacturer = CollectionEntry<'manufacturers'>;
export type Operator = CollectionEntry<'operators'>;
export type Technology = CollectionEntry<'technologies'>;
export type Site = CollectionEntry<'sites'>;
export type Photo = Model['data']['photos'][number];

/** An entry of one of the collections that group models and have pages of their own. */
export type Entity = Family | Manufacturer | Operator | Technology;

export interface FacetValue {
  value: string;
  label: string;
  count: number;
  /** Site path of the page for this value, if the facet has pages. */
  path?: string;
}

const byName = <T extends { data: { name: string } }>(a: T, b: T) => a.data.name.localeCompare(b.data.name, 'es');

const countryNames = new Intl.DisplayNames(['es'], { type: 'region' });

/** "1 ficha", "3 fichas": the string for a count, from `<key>.one` or `<key>`. */
export function counted(key: string, count: number): string {
  return count === 1 ? t(`${key}.one`) : t(key, { count });
}

export function countryName(code: string): string {
  try {
    return countryNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export class Catalog {
  readonly context: FacetContext;
  private readonly factsById = new Map<string, ModelFacts>();
  /** Former model ids, and where each now points. */
  readonly modelAliases = new Map<string, string>();
  private readonly layouts = new Map<string, ResolvedComposition>();

  constructor(
    readonly models: Model[],
    readonly families: Family[],
    readonly manufacturers: Manufacturer[],
    readonly operators: Operator[],
    readonly technologies: Technology[],
    readonly sites: Site[],
    currentYear: number,
  ) {
    this.context = { currentYear };
    for (const list of [models, families, manufacturers, operators, technologies, sites]) list.sort(byName);
    this.validate();
  }

  // --- Lookups: an id that does not resolve is a broken catalog, not a missing page. ---

  private find<T extends { id: string }>(list: T[], id: string, what: string): T {
    const entry = list.find((candidate) => candidate.id === id);
    if (!entry) throw new Error(`Catalog: there is no ${what} "${id}"`);
    return entry;
  }

  model = (id: string): Model => this.find(this.models, id, 'model');
  family = (id: string): Family => this.find(this.families, id, 'family');
  manufacturer = (id: string): Manufacturer => this.find(this.manufacturers, id, 'manufacturer');
  operator = (id: string): Operator => this.find(this.operators, id, 'operator');
  technology = (id: string): Technology => this.find(this.technologies, id, 'technology');
  site = (id: string): Site => this.find(this.sites, id, 'site');

  entity(collection: CollectionName, id: string): Entity {
    switch (collection) {
      case 'families':
        return this.family(id);
      case 'manufacturers':
        return this.manufacturer(id);
      case 'operators':
        return this.operator(id);
      case 'technologies':
        return this.technology(id);
    }
  }

  entities(collection: CollectionName): Entity[] {
    return this[collection];
  }

  /** An operator and the companies above it, nearest first. */
  operatorChain(id: string): Operator[] {
    const chain: Operator[] = [];
    let next: string | undefined = id;
    while (next && !chain.some((seen) => seen.id === next)) {
      const operator = this.operator(next);
      chain.push(operator);
      next = operator.data.parent?.id;
    }
    return chain;
  }

  /** The networks and brands directly under an operator. */
  operatorChildren(id: string): Operator[] {
    return this.operators.filter((operator) => operator.data.parent?.id === id);
  }

  // --- Models as plain facts, for facets, filters and cards. ---

  facts(model: Model | string): ModelFacts {
    const id = typeof model === 'string' ? model : model.id;
    const facts = this.factsById.get(id);
    if (!facts) throw new Error(`Catalog: there is no model "${id}"`);
    return facts;
  }

  get allFacts(): ModelFacts[] {
    return this.models.map((model) => this.facts(model));
  }

  private buildFacts(model: Model): ModelFacts {
    const data = model.data;
    // A composition is made by, run by and built with whatever its elements are.
    const sources = [data, ...this.elementsOf(model).map((element) => element.data)];
    const operators = new Set<string>();
    for (const link of sources.flatMap((source) => source.operators)) for (const operator of this.operatorChain(link.ref.id)) operators.add(operator.id);
    const countries = new Set(data.countries);
    for (const installation of data.installations) {
      if (installation.site) countries.add(this.site(installation.site.id).data.country);
    }
    return {
      id: model.id,
      name: data.name,
      summary: data.summary,
      kind: data.kind,
      technologies: [...new Set(sources.flatMap((source) => source.technologies.map((ref) => ref.id)))],
      transportModes: [...new Set(sources.flatMap((source) => source.transportModes))],
      features: data.features,
      manufacturers: [...new Set(sources.flatMap((source) => source.manufacturers.map((link) => link.ref.id)))],
      manufacturerUnknown: data.manufacturerUnknown,
      operators: [...operators],
      families: data.families.map((ref) => ref.id),
      countries: [...countries],
      years: data.years,
      status: data.status,
      hasReplica: data.replica !== undefined || data.composition !== undefined,
      stage: data.stage,
      photoCount: data.photos.length,
      referenceCount: data.references.length,
      bodyLength: (model.body ?? '').trim().length,
    };
  }

  // --- Compositions ---

  /** The archive entries a composition is made of, each once, in the order first listed. */
  elementsOf(model: Model): Model[] {
    const ids = [...new Set((model.data.composition?.elements ?? []).flatMap((element) => (element.model ? [element.model.id] : [])))];
    return ids.flatMap((id) => this.models.filter((candidate) => candidate.id === id));
  }

  /** The compositions an entry appears in. */
  compositionsWith(model: Model | string): Model[] {
    const id = typeof model === 'string' ? model : model.id;
    return this.models.filter((candidate) => candidate.data.composition?.elements.some((element) => element.model?.id === id));
  }

  /** Where everything of a composition goes. */
  composition(model: Model): ResolvedComposition {
    const layout = this.layouts.get(model.id);
    if (!layout) throw new Error(`Catalog: "${model.id}" is not a composition`);
    return layout;
  }

  private entryInput = (id: string): EntryInput | undefined => {
    const entry = this.models.find((candidate) => candidate.id === id);
    if (!entry) return undefined;
    return { id: entry.id, name: entry.data.name, replica: entry.data.replica, variants: entry.data.variants };
  };

  private checkComposition(model: Model, report: (where: string, what: string) => void): void {
    const where = `models/${model.id}`;
    const { data } = model;
    if ((data.kind === 'composition') !== (data.composition !== undefined)) {
      report(where, 'kind: composition goes with a composition block, and a composition block with kind: composition');
    }
    if (!data.composition) return;
    if (data.replica) report(where, 'a composition draws its elements; it has no replica of its own');
    if (data.installations.length !== 1) report(where, 'a composition is one installation: give exactly one');
    const { size, elements } = data.composition;
    for (const id of collisions(elements.map((element) => element.id))) report(where, `element id "${id}" is repeated`);
    const series = new Map<string, string>();
    for (const element of elements) {
      const at = `${where}, element "${element.id}"`;
      const height = element.at.height ?? 0;
      if (element.at.x < 0 || element.at.y < 0 || element.at.x + element.at.width > size.width || element.at.y + height > size.height) {
        report(at, `does not fit in the composition's ${size.width} × ${size.height} cm`);
      }
      if (!element.model) continue;
      const entry = this.models.find((candidate) => candidate.id === element.model!.id);
      if (!entry) {
        report(at, `refers to the entry "${element.model.id}", which does not exist`);
        continue;
      }
      if (entry.data.composition) report(at, `"${entry.id}" is itself a composition`);
      if (!entry.data.replica) {
        report(at, `"${entry.id}" has no replica to draw it with`);
        continue;
      }
      if (element.variant && !entry.data.variants.some((variant) => variant.id === element.variant)) {
        report(at, `"${entry.id}" has no variant "${element.variant}"`);
      }
      if (element.serie) {
        const replica = series.get(element.serie);
        if (replica && replica !== entry.data.replica.id) report(at, `the series "${element.serie}" mixes different displays`);
        series.set(element.serie, entry.data.replica.id);
      }
    }
    try {
      const input = { ...data.composition, elements: data.composition.elements.map((element) => ({ ...element, model: element.model?.id })) };
      const layout = resolveComposition(input, this.entryInput);
      for (const member of layout.members) {
        if (member.kind === 'replica' && (member.y + member.height > size.height + 0.5 || member.x + member.width > size.width + 0.5)) {
          report(`${where}, element "${member.id}"`, `at its replica's shape it is ${member.height} cm tall and does not fit`);
        }
      }
      this.layouts.set(model.id, layout);
    } catch (error) {
      report(where, (error as Error).message);
    }
  }

  /** The photo that stands for a model on cards and in previews. */
  cover(model: Model): Photo | undefined {
    const photos = model.data.photos;
    return photos.find((photo) => photo.id === model.data.cover) ?? photos[0];
  }

  // --- Facets ---

  valueLabel(facet: Facet, value: string): string {
    switch (facet.names.from) {
      case 'collection':
        return this.entity(facet.names.collection, value).data.name;
      case 'vocabulary':
        return t(`catalog.${facet.names.vocabulary}.${value}`);
      case 'country':
        return countryName(value);
      case 'decade':
        return t('catalog.decade', { decade: value });
    }
  }

  /** Every value in use on one axis, most used first. */
  facetValues(facetId: string): FacetValue[] {
    const facet = getFacet(facetId);
    return [...countValues(facet, this.allFacts, this.context)]
      .map(([value, count]) => ({ value, count, label: this.valueLabel(facet, value), path: facet.route?.(value) }))
      .sort((a, b) =>
        facet.names.from === 'decade' ? Number(a.value) - Number(b.value) : b.count - a.count || a.label.localeCompare(b.label, 'es'),
      );
  }

  /** The models that have `value` on one axis. */
  modelsWith(facetId: string, value: string): Model[] {
    const facet = getFacet(facetId);
    return this.models.filter((model) => facet.values(this.facts(model), this.context).includes(value));
  }

  /** A model's values on every axis, as `data-*`-friendly strings for the client-side filter. */
  facetData(model: Model): Record<string, string> {
    const facts = this.facts(model);
    return Object.fromEntries(FACETS.map((facet) => [facet.id, facet.values(facts, this.context).join(' ')]));
  }

  // --- Whole-catalog validation ---

  private validate(): void {
    const problems: string[] = [];
    const report = (where: string, what: string) => problems.push(`  ${where}: ${what}`);
    const exists = (list: { id: string }[], id: string) => list.some((entry) => entry.id === id);

    const check = (where: string, list: { id: string }[], ref: { id: string } | undefined, what: string) => {
      if (ref && !exists(list, ref.id)) report(where, `refers to ${what} "${ref.id}", which does not exist`);
    };

    // References between the grouping collections.
    for (const family of this.families) {
      for (const ref of family.data.manufacturers) check(`families/${family.id}`, this.manufacturers, ref, 'manufacturer');
      const cover = family.data.cover;
      if (cover) {
        const model = this.models.find((entry) => entry.id === cover.id);
        if (!model) report(`families/${family.id}`, `its cover "${cover.id}" is not an entry`);
        else if (!model.data.families.some((ref) => ref.id === family.id)) report(`families/${family.id}`, `its cover "${cover.id}" is not one of its members`);
      }
    }
    for (const operator of this.operators) {
      check(`operators/${operator.id}`, this.operators, operator.data.parent, 'operator');
    }

    // Ids and aliases must be unique within each collection that has pages.
    const groups: [string, { id: string; data: { aliases: string[] } }[]][] = [
      ['models', this.models],
      ['families', this.families],
      ['manufacturers', this.manufacturers],
      ['operators', this.operators],
      ['technologies', this.technologies],
    ];
    for (const [name, list] of groups) {
      const ids = list.flatMap((entry) => [entry.id, ...entry.data.aliases]);
      // A model's former address may also be held by an entry moved to «Por documentar».
      if (name === 'models') ids.push(...Object.keys(MOVED_TO_BACKLOG));
      for (const id of collisions(ids)) report(name, `"${id}" is used as an id or alias more than once`);
    }
    for (const model of this.models) for (const alias of model.data.aliases) this.modelAliases.set(alias, model.id);

    for (const model of this.models) {
      const where = `models/${model.id}`;
      const data = model.data;
      const before = problems.length;
      for (const ref of data.technologies) check(where, this.technologies, ref, 'technology');
      for (const link of data.manufacturers) check(where, this.manufacturers, link.ref, 'manufacturer');
      for (const link of data.operators) check(where, this.operators, link.ref, 'operator');
      for (const component of data.components) check(where, this.manufacturers, component.manufacturer, 'manufacturer');
      for (const installation of data.installations) check(where, this.sites, installation.site, 'site');
      for (const ref of data.families) check(where, this.families, ref, 'family');
      if (data.replica && !isReplicaId(data.replica.id)) report(where, `replica "${data.replica.id}" does not exist`);
      if (data.replica && !getReplica(data.replica.id)) report(where, `replica "${data.replica.id}" is not registered`);
      this.checkComposition(model, report);
      if (data.cover && !data.photos.some((photo) => photo.id === data.cover)) {
        report(where, `cover "${data.cover}" is not the id of one of its photos`);
      }
      for (const id of collisions(data.photos.map((photo) => photo.id))) report(where, `photo id "${id}" is repeated`);
      for (const id of collisions(data.variants.map((variant) => variant.id))) report(where, `variant id "${id}" is repeated`);
      for (const photo of data.photos) {
        for (const problem of photoProblems(photo)) report(`${where}, photo "${photo.id}"`, problem);
      }
      // Facts follow references, so they can only be built once those hold.
      if (problems.length > before) continue;
      const facts = this.buildFacts(model);
      this.factsById.set(model.id, facts);
      for (const problem of modelProblems(facts)) report(where, problem);
    }

    if (problems.length > 0) {
      throw new Error(`The catalog has ${problems.length} problem(s):\n${problems.join('\n')}\n`);
    }
  }
}

let loading: Promise<Catalog> | undefined;

/** The validated catalog. Loaded once per build. */
export function getCatalog(): Promise<Catalog> {
  loading ??= (async () => {
    const [models, families, manufacturers, operators, technologies, sites] = await Promise.all([
      getCollection('models'),
      getCollection('families'),
      getCollection('manufacturers'),
      getCollection('operators'),
      getCollection('technologies'),
      getCollection('sites'),
    ]);
    return new Catalog(models, families, manufacturers, operators, technologies, sites, new Date().getFullYear());
  })();
  return loading;
}
