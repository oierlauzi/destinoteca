import type { ReplicaImpl } from '../types';
import type { AccesoFrame, AccesoOptions } from './def';
import { blank, present } from './presenter';
import { mount, renderToString } from './render';

const impl: ReplicaImpl<AccesoFrame, AccesoOptions> = { present, blank, renderToString, mount };

export default impl as unknown as ReplicaImpl;
