import { REPLICA_IDS, type ReplicaId } from './ids';
import { andenElectromagnetico } from './page-iberica-anden-electromagnetico/def';
import type { ReplicaDef } from './types';

/**
 * Every replica the site can show. Only definitions are imported here; the
 * code that draws one is loaded when it is first needed.
 *
 * To add a replica: a folder with `def.ts` and `index.ts`, its id in ids.ts,
 * and a line here.
 */
const REGISTRY: Record<ReplicaId, ReplicaDef> = {
  'page-iberica-anden-electromagnetico': andenElectromagnetico,
};

export function getReplica(id: string): ReplicaDef | undefined {
  return (REGISTRY as Record<string, ReplicaDef>)[id];
}

export const replicas: ReplicaDef[] = REPLICA_IDS.map((id) => REGISTRY[id]);
