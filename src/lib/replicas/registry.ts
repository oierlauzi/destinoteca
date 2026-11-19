import { REPLICA_IDS, type ReplicaId } from './ids';
import { andenElectromagnetico } from './page-iberica-anden-electromagnetico/def';
import { accesoAtocha } from './page-iberica-acceso-atocha/def';
import { pasarelaAtocha } from './page-iberica-pasarela-atocha/def';
import { andenAtocha } from './page-iberica-anden-atocha/def';
import { andenContinuo } from './page-iberica-anden-continuo/def';
import { andenSinLed } from './page-iberica-anden-sin-led/def';
import { andenDosVias } from './page-iberica-anden-dos-vias/def';
import { ikusiAndenAtocha } from './ikusi-anden-atocha/def';
import { ikusiAeropuerto } from './ikusi-aeropuerto/def';
import { ikusiMetroBilbaoAnden } from './ikusi-metro-bilbao-anden/def';
import { ikusiMetroBilbaoAvisos } from './ikusi-metro-bilbao-avisos/def';
import { ikusiEuskotrenAnden } from './ikusi-euskotren-anden/def';
import { festinaAdif } from './festina-adif/def';
import { relojCercanias } from './reloj-cercanias/def';
import { relojEuskotren } from './reloj-euskotren/def';
import { andenMp, andenMpReloj, andenMpVertical } from './mp-electronics-adif-anden/def';
import { mpCercanias } from './mp-electronics-adif-cercanias/def';
import { solariCercanias, solariLargo } from './solari-renfe/def';
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
  'page-iberica-pasarela-atocha': pasarelaAtocha,
  'page-iberica-anden-atocha': andenAtocha,
  'mp-electronics-adif': mpElectronicsAdif,
  'festina-adif': festinaAdif,
  'mp-electronics-adif-anden': andenMp,
  'mp-electronics-adif-anden-reloj': andenMpReloj,
  'mp-electronics-adif-anden-vertical': andenMpVertical,
  'mp-electronics-adif-cercanias': mpCercanias,
  'solari-renfe-largo-recorrido': solariLargo,
  'solari-renfe-cercanias': solariCercanias,
  'page-iberica-anden-sin-led': andenSinLed,
  'page-iberica-anden-dos-vias': andenDosVias,
  'ikusi-anden-atocha': ikusiAndenAtocha,
  'ikusi-aeropuerto': ikusiAeropuerto,
  'ikusi-metro-bilbao-anden': ikusiMetroBilbaoAnden,
  'ikusi-metro-bilbao-avisos': ikusiMetroBilbaoAvisos,
  'ikusi-euskotren-anden': ikusiEuskotrenAnden,
  'reloj-cercanias': relojCercanias,
  'reloj-euskotren': relojEuskotren,
};

export function getReplica(id: string): ReplicaDef | undefined {
  return (REGISTRY as Record<string, ReplicaDef>)[id];
}

export const replicas: ReplicaDef[] = REPLICA_IDS.map((id) => REGISTRY[id]);
