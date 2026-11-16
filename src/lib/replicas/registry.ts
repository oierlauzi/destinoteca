import { REPLICA_IDS, type ReplicaId } from './ids';
import { andenElectromagnetico } from './page-iberica-anden-electromagnetico/def';
import { accesoAtocha } from './page-iberica-acceso-atocha/def';
import { andenAtocha } from './page-iberica-anden-atocha/def';
import { andenContinuo } from './page-iberica-anden-continuo/def';
import { festinaAdif } from './festina-adif/def';
import { mpElectronicsAdif } from './mp-electronics-adif/def';
import { vestibulo2, vestibulo4 } from './page-iberica-vestibulo/def';
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
  'page-iberica-vestibulo-2-lineas': vestibulo2,
  'page-iberica-vestibulo-4-lineas': vestibulo4,
  'page-iberica-anden-continuo': andenContinuo,
  'page-iberica-acceso-atocha': accesoAtocha,
  'page-iberica-anden-atocha': andenAtocha,
  'mp-electronics-adif': mpElectronicsAdif,
  'festina-adif': festinaAdif,
};

export function getReplica(id: string): ReplicaDef | undefined {
  return (REGISTRY as Record<string, ReplicaDef>)[id];
}

export const replicas: ReplicaDef[] = REPLICA_IDS.map((id) => REGISTRY[id]);
