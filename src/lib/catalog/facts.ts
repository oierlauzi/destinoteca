import type { Kind, Stage, Status, TransportMode } from './vocab';

/**
 * A catalog entry reduced to what browsing needs: plain ids and numbers, no
 * Markdown and no images. Facets, filters and validation all work on this, so
 * none of them depends on the site generator.
 */
export interface ModelFacts {
  id: string;
  name: string;
  summary: string;
  kind: Kind;
  technologies: string[];
  transportModes: TransportMode[];
  features: string[];
  /** Manufacturer ids, whatever their role. */
  manufacturers: string[];
  manufacturerUnknown: boolean;
  /** Operator ids, including the parents of those named (Cercanías Madrid brings Renfe). */
  operators: string[];
  /** Family ids. */
  families: string[];
  countries: string[];
  years?: { from?: number; to?: number; circa?: boolean };
  status: Status;
  hasReplica: boolean;
  stage: Stage;
  photoCount: number;
  referenceCount: number;
  bodyLength: number;
}

/**
 * The decades a model was in service, as their first year (1990, 2000...).
 * A model with no end year that has not been retired is still running, so it
 * reaches the current decade.
 */
export function decadesOf(facts: Pick<ModelFacts, 'years' | 'status'>, currentYear: number): number[] {
  const from = facts.years?.from;
  if (from === undefined) return [];
  const open = facts.status === 'in-service' || facts.status === 'retiring';
  const to = facts.years?.to ?? (open ? currentYear : from);
  const out: number[] = [];
  for (let decade = Math.floor(from / 10) * 10; decade <= to; decade += 10) out.push(decade);
  return out;
}

/** "1996–2026", "c. 1996–", "1996" — however much is known. */
export function yearsLabel(years: ModelFacts['years'], status?: Status): string {
  if (!years || (years.from === undefined && years.to === undefined)) return '';
  const circa = years.circa ? 'c. ' : '';
  const from = years.from !== undefined ? String(years.from) : '?';
  if (years.to !== undefined) return years.to === years.from ? `${circa}${from}` : `${circa}${from}–${years.to}`;
  const open = status === 'in-service' || status === 'retiring';
  return open ? `${circa}${from}–` : `${circa}${from}`;
}
