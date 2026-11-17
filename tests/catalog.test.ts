import { describe, expect, it } from 'vitest';
import {
  FACETS,
  collisions,
  countValues,
  decadesOf,
  formatPartialDate,
  inlineMarkdown,
  matches,
  modelProblems,
  photoProblems,
  yearsLabel,
  type ModelFacts,
} from '../src/lib/catalog';

const context = { currentYear: 2026 };

function model(overrides: Partial<ModelFacts> = {}): ModelFacts {
  return {
    id: 'acme-board',
    name: 'Acme board',
    summary: 'A board.',
    kind: 'departure-board',
    technologies: ['flip-dot'],
    transportModes: ['rail'],
    features: [],
    manufacturers: ['acme'],
    manufacturerUnknown: false,
    operators: ['renfe'],
    countries: ['es'],
    years: { from: 1996 },
    status: 'retiring',
    hasReplica: false,
    stage: 'stub',
    photoCount: 0,
    referenceCount: 0,
    bodyLength: 0,
    ...overrides,
  };
}

describe('decades and years', () => {
  it('runs to the current decade while a model is still in service', () => {
    expect(decadesOf(model(), 2026)).toEqual([1990, 2000, 2010, 2020]);
  });

  it('stops at the end year, or at the start year when retired with no end known', () => {
    expect(decadesOf(model({ years: { from: 1988, to: 2003 }, status: 'retired' }), 2026)).toEqual([1980, 1990, 2000]);
    expect(decadesOf(model({ years: { from: 1988 }, status: 'retired' }), 2026)).toEqual([1980]);
    expect(decadesOf(model({ years: undefined }), 2026)).toEqual([]);
  });

  it('labels as much of a period as is known', () => {
    expect(yearsLabel({ from: 1996, circa: true }, 'retiring')).toBe('c. 1996–');
    expect(yearsLabel({ from: 1996, to: 2026 }, 'retired')).toBe('1996–2026');
    expect(yearsLabel({ from: 1996 }, 'retired')).toBe('1996');
    expect(yearsLabel(undefined)).toBe('');
  });
});

describe('facets', () => {
  const models = [
    model(),
    model({ id: 'other', technologies: ['led', 'flip-dot'], countries: ['pt'], hasReplica: true, family: 'fam' }),
  ];

  it('have unique ids, since those are query-string keys', () => {
    expect(collisions(FACETS.map((facet) => facet.id))).toEqual([]);
  });

  it('count each value once per model', () => {
    const technology = FACETS.find((facet) => facet.id === 'tecnologia')!;
    expect(Object.fromEntries(countValues(technology, models, context))).toEqual({ 'flip-dot': 2, led: 1 });
  });

  it('match a model only when every axis asked for agrees', () => {
    expect(matches(models[1]!, { tecnologia: 'led', pais: 'pt' }, context)).toBe(true);
    expect(matches(models[1]!, { tecnologia: 'led', pais: 'es' }, context)).toBe(false);
    expect(matches(models[0]!, { replica: 'no', decada: '2010' }, context)).toBe(true);
    expect(matches(models[0]!, {}, context)).toBe(true);
  });
});

describe('validation', () => {
  it('lets a stub through with the basics', () => {
    expect(modelProblems(model())).toEqual([]);
  });

  it('asks more of an article', () => {
    const problems = modelProblems(model({ stage: 'article', operators: [], years: undefined }));
    expect(problems.join('\n')).toMatch(/operator/);
    expect(problems.join('\n')).toMatch(/reference/);
    expect(problems.join('\n')).toMatch(/photo/);
    expect(
      modelProblems(model({ stage: 'article', photoCount: 1, referenceCount: 1, bodyLength: 5000 })),
    ).toEqual([]);
  });

  it('accepts an unknown manufacturer only when said so', () => {
    const article = { stage: 'article' as const, photoCount: 1, referenceCount: 1, bodyLength: 5000, manufacturers: [] };
    expect(modelProblems(model(article))).toHaveLength(1);
    expect(modelProblems(model({ ...article, manufacturerUnknown: true }))).toEqual([]);
  });

  it('rejects ids with dots or capitals, and countries that are not ISO codes', () => {
    expect(modelProblems(model({ id: 'Acme-PI.T100' }))).toHaveLength(1);
    expect(modelProblems(model({ countries: ['ES'] }))).toHaveLength(1);
  });

  it('requires an author unless the photo is in the public domain', () => {
    const photo = { id: 'a-photo', alt: 'A sign reading CHAMARTIN', license: 'rights-reserved-credited' as const, ownWork: false };
    expect(photoProblems(photo)).toHaveLength(1);
    expect(photoProblems({ ...photo, author: 'Someone' })).toEqual([]);
    expect(photoProblems({ ...photo, license: 'public-domain' })).toEqual([]);
    expect(photoProblems({ ...photo, author: 'Me', ownWork: true })).toHaveLength(1);
  });
});

describe('formatting', () => {
  it('writes dates as precisely as they are known', () => {
    expect(formatPartialDate('1997')).toBe('1997');
    expect(formatPartialDate('1997-03')).toBe('marzo de 1997');
    expect(formatPartialDate('2026-06-09')).toBe('9 de junio de 2026');
  });

  it('allows emphasis in captions and nothing else', () => {
    expect(inlineMarkdown('En *Vía Libre*, <b>1997</b>')).toBe('En <em>Vía Libre</em>, &lt;b&gt;1997&lt;/b&gt;');
  });
});
