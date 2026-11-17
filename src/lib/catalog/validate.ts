import type { ModelFacts } from './facts';
import { COUNTRY_PATTERN, ID_PATTERN, LICENSES_WITHOUT_AUTHOR, type License } from './vocab';

/** A stub must be worth listing; an article must be worth citing. */
const MIN_ARTICLE_LENGTH = 1200;

/**
 * What is wrong with one entry, in words a contributor can act on. Empty when
 * it is fine. Stubs are deliberately easy; `stage: article` is where the bar is.
 */
export function modelProblems(model: ModelFacts): string[] {
  const problems: string[] = [];
  if (!ID_PATTERN.test(model.id)) problems.push('the id must be lower-case words joined by hyphens, with no dots');
  if (model.technologies.length === 0) problems.push('needs at least one technology');
  if (model.transportModes.length === 0) problems.push('needs at least one transport mode');
  if (model.countries.length === 0) problems.push('needs at least one country, or an installation at a known site');
  for (const country of model.countries) {
    if (!COUNTRY_PATTERN.test(country)) problems.push(`"${country}" is not a lower-case ISO 3166-1 country code`);
  }
  if (model.years?.from !== undefined && model.years.to !== undefined && model.years.to < model.years.from) {
    problems.push('years.to is earlier than years.from');
  }
  if (model.manufacturers.length > 0 && model.manufacturerUnknown) {
    problems.push('manufacturerUnknown is set although manufacturers are listed');
  }
  if (model.stage !== 'article') return problems;

  if (model.manufacturers.length === 0 && !model.manufacturerUnknown) {
    problems.push('an article needs a manufacturer, or manufacturerUnknown: true');
  }
  if (model.operators.length === 0) problems.push('an article needs at least one operator');
  if (model.referenceCount === 0) problems.push('an article needs at least one reference');
  if (model.photoCount === 0) problems.push('an article needs at least one photo');
  if (model.bodyLength < MIN_ARTICLE_LENGTH) {
    problems.push(`an article needs at least ${MIN_ARTICLE_LENGTH} characters of text (has ${model.bodyLength})`);
  }
  return problems;
}

export interface PhotoFacts {
  id: string;
  alt: string;
  author?: string;
  license: License;
  ownWork: boolean;
  sourceUrl?: string;
  source?: string;
  permission?: string;
}

/**
 * Every photo must say whose it is and under what terms. Where it came from
 * (`sourceUrl`, `source`) is asked for but not enforced: some photographs
 * reach the catalog straight from their author.
 */
export function photoProblems(photo: PhotoFacts): string[] {
  const problems: string[] = [];
  if (!ID_PATTERN.test(photo.id)) problems.push('the id must be lower-case words joined by hyphens');
  if (photo.alt.trim().length < 10) problems.push('needs alt text that describes the picture');
  if (!photo.author && !LICENSES_WITHOUT_AUTHOR.includes(photo.license)) problems.push('needs an author');
  if (photo.ownWork && photo.license === 'rights-reserved-credited') {
    problems.push('own work must be given a free licence, not "rights-reserved-credited"');
  }
  return problems;
}

/** Ids that appear more than once across a list of ids and aliases. */
export function collisions(ids: string[]): string[] {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const id of ids) (seen.has(id) ? twice : seen).add(id);
  return [...twice];
}
