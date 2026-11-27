import { adifDef } from './adif/def';
import { demoDef } from './demo/def';
import { deviceDef } from './device/def';
import { manualDef } from './manual/def';
import { mitrenDef } from './mitren/def';
import { sharesData, type DataKind, type SourceDef } from './types';

/**
 * Every data source the site offers, in the order they are listed: the
 * simulation first, then what is live, then what is typed by hand. Only
 * definitions are imported here; a source's code (and the station list of the
 * live one) is loaded when it is first used.
 *
 * To add a source: a folder with `def.ts` and `index.ts`, and a line here.
 */
export const sources: SourceDef[] = [demoDef, mitrenDef, adifDef, deviceDef, manualDef];

export function getSource(id: string): SourceDef | undefined {
  return sources.find((source) => source.id === id);
}

/**
 * The sources worth offering to a display that reads these kinds of data, in
 * the order above: those that know something it can show. A clock is not
 * offered a train feed, and a board is not left without one.
 *
 * The first is what it starts on.
 */
export function sourcesFor(reads: readonly DataKind[]): SourceDef[] {
  return sources.filter((source) => sharesData(source.provides, reads));
}
