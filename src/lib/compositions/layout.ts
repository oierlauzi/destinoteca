import type { Placement } from '../model';
import type { Values } from '../params';
import { readConfig, replicaSize, type PlayerConfig } from '../player/config';
import { getReplica } from '../replicas/registry';
import type { ReplicaDef } from '../replicas/types';
import type { CompositionInput, EntryInput, Member, ReplicaMember, ResolvedComposition, Settings } from './types';

const query = (params: Settings): URLSearchParams => new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));

/** A member's appearance, as its replica reads it. */
export const memberOptions = (def: ReplicaDef, params: Settings): Values => readConfig(def, query(params)).options;

/**
 * Places every element of a composition: an entry's replica with its
 * settings (the entry's, then its variant's, then the composition's own), its
 * height from the replica's shape, and, for boards in a series, how many
 * services the boards before it already show.
 *
 * Throws on an element the catalog cannot draw; the catalog checks report
 * those first, with the entry's name.
 */
export function resolveComposition(input: CompositionInput, entry: (id: string) => EntryInput | undefined): ResolvedComposition {
  const shown = new Map<string, number>();
  const members = input.elements.map((element): Member => {
    if (element.panel) {
      return { kind: 'panel', id: element.id, panel: element.panel, ...element.at, height: element.at.height ?? 0 };
    }
    const model = element.model ? entry(element.model) : undefined;
    if (!model?.replica) throw new Error(`element ${element.id}: no archive entry with a replica`);
    const def = getReplica(model.replica.id);
    if (!def) throw new Error(`element ${element.id}: unknown replica ${model.replica.id}`);
    const variant = element.variant ? model.variants.find((v) => v.id === element.variant) : undefined;
    if (element.variant && !variant) throw new Error(`element ${element.id}: ${model.id} has no variant ${element.variant}`);
    const params: Settings = { ...model.replica.params, ...variant?.replicaPreset, ...element.params };
    const options = memberOptions(def, params);
    const size = replicaSize(def, options);
    const serie = element.serie;
    const skip = serie ? (shown.get(serie) ?? 0) : 0;
    if (serie) shown.set(serie, skip + def.selection(options).window.size);
    return {
      kind: 'replica',
      id: element.id,
      entry: model.id,
      name: model.name,
      variant: variant?.name,
      replica: def.id,
      params,
      skip,
      platforms: element.platforms ?? [],
      x: element.at.x,
      y: element.at.y,
      width: element.at.width,
      height: Math.round(((element.at.width * size.height) / size.width) * 100) / 100,
    };
  });
  return { width: input.size.width, height: input.size.height, background: input.background, members };
}

/** Where a member hangs: its platforms, and the services the boards before it show. */
export const memberPlacement = (member: ReplicaMember): Placement => ({ platforms: member.platforms, cycle: true, skip: member.skip });

/**
 * A member's whole configuration on a page whose data comes from `source`:
 * its own appearance, the composition's source, its placement.
 */
export function memberConfig(def: ReplicaDef, member: ReplicaMember, source: string, sourceConfig: Values): PlayerConfig {
  const q = query(member.params);
  q.set('source', source);
  const config = readConfig(def, q);
  return { ...config, sourceConfig, placement: memberPlacement(member) };
}
