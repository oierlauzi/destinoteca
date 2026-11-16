import { demoDef } from './demo/def';
import { manualDef } from './manual/def';
import { mitrenDef } from './mitren/def';
import type { SourceDef } from './types';

/**
 * Every data source the site offers, in the order they are listed. Only
 * definitions are imported here; a source's code (and the station list of the
 * live one) is loaded when it is first used.
 *
 * To add a source: a folder with `def.ts` and `index.ts`, and a line here.
 */
export const sources: SourceDef[] = [demoDef, mitrenDef, manualDef];

export function getSource(id: string): SourceDef | undefined {
  return sources.find((source) => source.id === id);
}
